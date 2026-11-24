from __future__ import annotations

import shutil
import subprocess
import tempfile
import os
from pathlib import Path


TERRAFORM_TIMEOUT_SECONDS = 120


def _run_terraform(command: list[str], cwd: Path, env: dict | None = None) -> dict:
    """Run a Terraform command safely with a timeout and captured output."""
    try:
        result = subprocess.run(
            command,
            cwd=str(cwd),
            capture_output=True,
            text=True,
            env=env,
            timeout=TERRAFORM_TIMEOUT_SECONDS,
            check=False,
        )
        return {
            "return_code": result.returncode,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "success": result.returncode == 0,
        }
    except subprocess.TimeoutExpired as error:
        return {
            "return_code": None,
            "stdout": (error.stdout or "").strip() if isinstance(error.stdout, str) else "",
            "stderr": f"Command timed out after {TERRAFORM_TIMEOUT_SECONDS} seconds.",
            "success": False,
        }
    except OSError as error:
        return {
            "return_code": None,
            "stdout": "",
            "stderr": str(error),
            "success": False,
        }


def _check_required_resources(terraform_code: str) -> dict:
    required = {
        "Network": ("application_network", "vpc", "virtual_network", "compute_network"),
        "Security": ("application_security", "security_group", "network_security_group", "firewall"),
        "Compute": ("application_compute", "aws_instance", "azurerm_linux_virtual_machine", "google_compute_instance"),
        "Storage": ("application_storage", "ebs_volume", "managed_disk", "compute_disk"),
    }
    code_lower = terraform_code.lower()
    missing = []
    present = []
    for label, tokens in required.items():
        if any(token.lower() in code_lower for token in tokens):
            present.append(label)
        else:
            missing.append(label)
    return {
        "success": not missing,
        "present": present,
        "missing": missing,
        "message": "All core infrastructure categories were detected." if not missing else f"Missing categories: {', '.join(missing)}",
    }


def _security_review(terraform_code: str) -> list[dict]:
    """Simple static checks. These are heuristic findings, not a full security audit."""
    code_lower = terraform_code.lower()
    findings = []

    public_patterns = (
        'cidr_blocks = ["0.0.0.0/0"]',
        'source_address_prefix      = "*"',
        'source_ranges = ["0.0.0.0/0"]',
    )
    if any(pattern.lower() in code_lower for pattern in public_patterns):
        findings.append({
            "severity": "WARNING",
            "title": "Public ingress detected",
            "message": "A generated rule appears to allow inbound access from the public internet. Review and restrict source ranges before real deployment.",
        })

    if "admin_ssh_public_key" in code_lower:
        findings.append({
            "severity": "INFO",
            "title": "SSH public key variable required",
            "message": "The generated Azure configuration requires an SSH public key variable to be supplied before deployment.",
        })

    if "access_config {}" in code_lower or "public_ip_address_id" in code_lower:
        findings.append({
            "severity": "WARNING",
            "title": "Public IP configuration detected",
            "message": "The generated compute configuration appears to assign a public IP. Review whether public exposure is required.",
        })

    if not findings:
        findings.append({
            "severity": "PASS",
            "title": "No basic static security patterns detected",
            "message": "The basic heuristic checks did not detect the reviewed patterns. This is not a comprehensive security assessment.",
        })
    return findings



def validate_terraform_configuration(terraform_code: str, provider: str, intent_id: int | None = None) -> dict:
    """Validate generated Terraform in an isolated temporary directory.



    Runs formatting, initialization (backend disabled), and Terraform validation.
    Does not apply or create cloud resources.
    """
    provider = provider.strip().upper()
    supported_providers = {"AWS", "AZURE", "GCP"}
    if provider not in supported_providers:
        raise ValueError(f"Unsupported provider: {provider}")
    if not terraform_code or not terraform_code.strip():
        raise ValueError("Terraform configuration is empty.")

    terraform_executable = shutil.which("terraform")
    if not terraform_executable:
        return {
            "intent_id": intent_id,
            "provider": provider,
            "overall_status": "FAILED",
            "checks": [{
                "check_name": "Terraform availability",
                "status": "FAIL",
                "message": "Terraform executable was not found in the backend environment PATH.",
            }],
            "security_findings": [],
            "is_simulation": True,
            "disclaimer": "Validation only. No cloud resources have been created or modified.",
        }

    checks = []
    resource_check = _check_required_resources(terraform_code)
    checks.append({
        "check_name": "Required resource categories",
        "status": "PASS" if resource_check["success"] else "FAIL",
        "message": resource_check["message"],
        "details": resource_check,
    })

    with tempfile.TemporaryDirectory(prefix="multicloud_tf_validation_") as temp_dir:
        work_dir = Path(temp_dir)
        (work_dir / "main.tf").write_text(terraform_code, encoding="utf-8")

        fmt_result = _run_terraform(
            [terraform_executable, "fmt", "-check", "-no-color", "main.tf"],
            work_dir,
        )
        checks.append({
            "check_name": "Terraform formatting",
            "status": "PASS" if fmt_result["success"] else "WARNING",
            "message": "Terraform formatting check passed." if fmt_result["success"] else "Formatting is needed; configuration can still be validated.",
            "details": fmt_result["stdout"] or fmt_result["stderr"],
        })

        # Reuse downloaded provider plugins between validation runs to reduce init time.
        plugin_cache_dir = Path(__file__).resolve().parents[3] / ".terraform-plugin-cache"
        plugin_cache_dir.mkdir(parents=True, exist_ok=True)
        terraform_env = os.environ.copy()
        terraform_env["TF_PLUGIN_CACHE_DIR"] = str(plugin_cache_dir)

        init_result = _run_terraform(
            [terraform_executable, "init", "-backend=false", "-input=false", "-no-color"],
            work_dir,
            env=terraform_env,
        )
        checks.append({
            "check_name": "Terraform initialization",
            "status": "PASS" if init_result["success"] else "FAIL",
            "message": "Terraform initialization completed with backend disabled." if init_result["success"] else "Terraform initialization failed.",
            "details": init_result["stdout"] or init_result["stderr"],
        })

        if init_result["success"]:
            validate_result = _run_terraform(
                [terraform_executable, "validate", "-no-color"],
                work_dir,
            )
        else:
            validate_result = {
                "success": False,
                "stdout": "",
                "stderr": "Skipped because Terraform initialization failed.",
                "return_code": None,
            }

        checks.append({
            "check_name": "Terraform configuration validation",
            "status": "PASS" if validate_result["success"] else "FAIL",
            "message": "Terraform validate passed." if validate_result["success"] else "Terraform validate failed or was skipped.",
            "details": validate_result["stdout"] or validate_result["stderr"],
        })

    security_findings = _security_review(terraform_code)
    has_security_warning = any(item["severity"] == "WARNING" for item in security_findings)
    failed_checks = sum(item["status"] == "FAIL" for item in checks)
    warning_checks = sum(item["status"] == "WARNING" for item in checks)
    passed_checks = sum(item["status"] == "PASS" for item in checks)

    if failed_checks:
        overall_status = "FAILED"
    elif warning_checks or has_security_warning:
        overall_status = "READY_WITH_WARNINGS"
    else:
        overall_status = "READY"

    return {
        "intent_id": intent_id,
        "provider": provider,
        "overall_status": overall_status,
        "total_checks": len(checks),
        "passed_checks": passed_checks,
        "warning_checks": warning_checks,
        "failed_checks": failed_checks,
        "checks": checks,
        "security_findings": security_findings,
        "is_simulation": True,
        "disclaimer": (
            "Terraform configuration was checked in a temporary isolated directory. "
            "No cloud resources were created or modified. Static security checks are heuristic "
            "and do not constitute a complete security audit or guarantee deployment success."
        ),
    }
