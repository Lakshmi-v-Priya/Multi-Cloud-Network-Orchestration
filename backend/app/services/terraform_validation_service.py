
from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
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
            "stdout": (
                (error.stdout or "").strip()
                if isinstance(error.stdout, str)
                else ""
            ),
            "stderr": (
                f"Command timed out after "
                f"{TERRAFORM_TIMEOUT_SECONDS} seconds."
            ),
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
    """Check whether core infrastructure resource categories are present."""

    required = {
        "Network": (
            "application_network",
            "vpc",
            "virtual_network",
            "compute_network",
        ),
        "Security": (
            "application_security",
            "security_group",
            "network_security_group",
            "firewall",
        ),
        "Compute": (
            "application_compute",
            "aws_instance",
            "azurerm_linux_virtual_machine",
            "google_compute_instance",
        ),
        "Storage": (
            "application_storage",
            "ebs_volume",
            "managed_disk",
            "compute_disk",
        ),
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
        "message": (
            "All core infrastructure categories were detected."
            if not missing
            else f"Missing categories: {', '.join(missing)}"
        ),
    }


def _security_review(terraform_code: str) -> list[dict]:
    """Perform a basic heuristic security review of Terraform configuration."""

    code_lower = terraform_code.lower()
    findings = []

    def add_finding(severity, title, message, recommendation):
        findings.append(
            {
                "id": f"security-{len(findings) + 1}",
                "severity": severity,
                "title": title,
                "message": message,
                "recommendation": recommendation,
            }
        )

    # ---------------------------------------------------------
    # Extract individual network rule blocks
    # ---------------------------------------------------------

    rule_start_pattern = re.compile(
        r"\b(?:ingress|security_rule|ingress_rule)\s*\{",
        re.IGNORECASE,
    )

    network_rule_blocks = []

    for match in rule_start_pattern.finditer(terraform_code):
        opening_brace = terraform_code.find("{", match.start())
        depth = 0
        closing_brace = None

        for index in range(opening_brace, len(terraform_code)):
            character = terraform_code[index]

            if character == "{":
                depth += 1
            elif character == "}":
                depth -= 1

                if depth == 0:
                    closing_brace = index
                    break

        if closing_brace is not None:
            block = terraform_code[opening_brace + 1 : closing_brace]
            network_rule_blocks.append(block.lower())

    # ---------------------------------------------------------
    # Public ingress patterns
    # ---------------------------------------------------------

    public_ingress_patterns = [
        r'cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0/0"\s*\]',
        r'source_address_prefix\s*=\s*"\*"\s*',
        r'source_ranges\s*=\s*\[\s*"0\.0\.0\.0/0"\s*\]',
        r'cidr_block\s*=\s*"0\.0\.0\.0/0"',
        r'ip_ranges\s*=\s*\[\s*"0\.0\.0.0/0"\s*\]',
    ]

    def is_public_rule(rule):
        return any(
            re.search(pattern, rule)
            for pattern in public_ingress_patterns
        )

    public_rules = [
        rule for rule in network_rule_blocks
        if is_public_rule(rule)
    ]

    unrestricted_ingress = bool(public_rules)

    # ---------------------------------------------------------
    # Detect unrestricted public ingress
    # ---------------------------------------------------------

    if unrestricted_ingress:
        add_finding(
            "MEDIUM",
            "Public ingress detected",
            "A network rule appears to allow inbound access "
            "from the public internet.",
            "Restrict inbound traffic to trusted IP addresses "
            "and only the ports required.",
        )

    # ---------------------------------------------------------
    # Detect publicly accessible SSH (port 22)
    # ---------------------------------------------------------

    ssh_port_patterns = [
        r'from_port\s*=\s*22\b',
        r'destination_port_range\s*=\s*"22"\b',
        r'destination_ports\s*=\s*\[\s*"22"\s*\]',
        r'ports\s*=\s*\[\s*"22"\s*\]',
        r'port\s*=\s*22\b',
        r'port_range\s*=\s*"22"\b',
    ]

    public_ssh_detected = any(
        is_public_rule(rule)
        and any(
            re.search(pattern, rule)
            for pattern in ssh_port_patterns
        )
        for rule in network_rule_blocks
    )

    if public_ssh_detected:
        add_finding(
            "HIGH",
            "Public SSH access detected",
            "SSH access on port 22 appears to be allowed "
            "from any IP address within the same network rule.",
            "Restrict SSH to a trusted IP address or use "
            "a secure access management service. Avoid "
            "exposing SSH directly to the public internet.",
        )

    # ---------------------------------------------------------
    # Detect publicly accessible RDP (port 3389)
    # ---------------------------------------------------------

    rdp_port_patterns = [
        r'from_port\s*=\s*3389\b',
        r'destination_port_range\s*=\s*"3389"\b',
        r'destination_ports\s*=\s*\[\s*"3389"\s*\]',
        r'ports\s*=\s*\[\s*"3389"\s*\]',
        r'port\s*=\s*3389\b',
        r'port_range\s*=\s*"3389"\b',
    ]

    public_rdp_detected = any(
        is_public_rule(rule)
        and any(
            re.search(pattern, rule)
            for pattern in rdp_port_patterns
        )
        for rule in network_rule_blocks
    )

    if public_rdp_detected:
        add_finding(
            "HIGH",
            "Public RDP access detected",
            "Remote Desktop access on port 3389 appears to "
            "be open to the public internet within the same rule.",
            "Restrict RDP access to trusted networks and avoid "
            "direct public exposure. Use a secure remote access "
            "solution where possible.",
        )

    # ---------------------------------------------------------
    # Detect public IP configuration
    # ---------------------------------------------------------

    public_ip_patterns = [
        r'access_config\s*\{\s*\}',
        r'public_ip_address_id',
        r'associate_public_ip_address\s*=\s*true',
    ]

    public_ip_detected = any(
        re.search(pattern, code_lower)
        for pattern in public_ip_patterns
    )

    if public_ip_detected:
        add_finding(
            "MEDIUM",
            "Public IP configuration detected",
            "The generated compute configuration appears to "
            "assign a public IP address.",
            "Check whether public IP access is required. "
            "Prefer private networking where possible.",
        )

    # ---------------------------------------------------------
    # Detect Azure SSH public key requirement
    # ---------------------------------------------------------

    if "admin_ssh_public_key" in code_lower:
        add_finding(
            "INFO",
            "SSH public key required",
            "The generated Azure configuration requires an "
            "SSH public key variable.",
            "Supply a valid public key and never store "
            "private keys in the project source code.",
        )

    # ---------------------------------------------------------
    # No findings detected
    # ---------------------------------------------------------

    if not findings:
        add_finding(
            "PASS",
            "No basic security issues detected",
            "The basic heuristic checks did not detect "
            "any known patterns.",
            "Continue reviewing the configuration before "
            "deployment. This is not a full security audit.",
        )

    return findings


def validate_terraform_configuration(
    terraform_code: str,
    provider: str,
    intent_id: int | None = None,
) -> dict:
    """
    Validate generated Terraform in an isolated temporary directory.

    Runs formatting, initialization with backend disabled,
    and Terraform validation.

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
            "checks": [
                {
                    "check_name": "Terraform availability",
                    "status": "FAIL",
                    "message": (
                        "Terraform executable was not found in the "
                        "backend environment PATH."
                    ),
                }
            ],
            "security_findings": [],
            "is_simulation": True,
            "disclaimer": (
                "Validation only. No cloud resources have been "
                "created or modified."
            ),
        }

    checks = []

    # ---------------------------------------------------------
    # Check required resource categories
    # ---------------------------------------------------------

    resource_check = _check_required_resources(terraform_code)

    checks.append(
        {
            "check_name": "Required resource categories",
            "status": (
                "PASS" if resource_check["success"] else "FAIL"
            ),
            "message": resource_check["message"],
            "details": resource_check,
        }
    )

    # ---------------------------------------------------------
    # Run Terraform validation in an isolated temporary directory
    # ---------------------------------------------------------

    with tempfile.TemporaryDirectory(
        prefix="multicloud_tf_validation_"
    ) as temp_dir:

        work_dir = Path(temp_dir)

        (work_dir / "main.tf").write_text(
            terraform_code,
            encoding="utf-8",
        )

        # Automatically format generated Terraform configuration
        format_result = _run_terraform(
            [
                terraform_executable,
                "fmt",
                "-no-color",
                "main.tf",
            ],
            work_dir,
        )

        # Verify formatting after automatic formatting
        fmt_result = _run_terraform(
            [
                terraform_executable,
                "fmt",
                "-check",
                "-no-color",
                "main.tf",
            ],
            work_dir,
        )

        checks.append(
            {
                "check_name": "Terraform formatting",
                "status": (
                    "PASS" if fmt_result["success"] else "WARNING"
                ),
                "message": (
                    "Terraform formatting check passed."
                    if fmt_result["success"]
                    else "Formatting is needed; configuration "
                    "can still be validated."
                ),
                "details": (
                    fmt_result["stdout"] or fmt_result["stderr"]
                ),
            }
        )

        # -----------------------------------------------------
        # Reuse downloaded provider plugins between validations
        # -----------------------------------------------------

        plugin_cache_dir = (
            Path(__file__).resolve().parents[3]
            / ".terraform-plugin-cache"
        )

        plugin_cache_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        terraform_env = os.environ.copy()

        terraform_env["TF_PLUGIN_CACHE_DIR"] = (
            str(plugin_cache_dir)
        )

        # -----------------------------------------------------
        # Terraform initialization with backend disabled
        # -----------------------------------------------------

        init_result = _run_terraform(
            [
                terraform_executable,
                "init",
                "-backend=false",
                "-input=false",
                "-no-color",
            ],
            work_dir,
            env=terraform_env,
        )

        checks.append(
            {
                "check_name": "Terraform initialization",
                "status": "PASS" if init_result["success"] else "FAIL",
                "message": (
                    "Terraform initialization completed with backend disabled."
                    if init_result["success"]
                    else "Terraform initialization failed: "
                    + (
                        init_result["stderr"]
                        or init_result["stdout"]
                        or "No error output captured."
                    )
                ),
                "details": init_result["stdout"] or init_result["stderr"],
            }
        )

        # -----------------------------------------------------
        # Terraform configuration validation
        # -----------------------------------------------------

        if init_result["success"]:
            validate_result = _run_terraform(
                [
                    terraform_executable,
                    "validate",
                    "-no-color",
                ],
                work_dir,
            )
        else:
            validate_result = {
                "success": False,
                "stdout": "",
                "stderr": (
                    "Skipped because Terraform initialization failed."
                ),
                "return_code": None,
            }

        checks.append(
            {
                "check_name": "Terraform configuration validation",
                "status": (
                    "PASS" if validate_result["success"] else "FAIL"
                ),
                "message": (
                    "Terraform validate passed."
                    if validate_result["success"]
                    else "Terraform validate failed or was skipped."
                ),
                "details": (
                    validate_result["stdout"]
                    or validate_result["stderr"]
                ),
            }
        )

    # ---------------------------------------------------------
    # Security review
    # ---------------------------------------------------------

    security_findings = _security_review(terraform_code)

    has_security_warning = any(
        item["severity"] in {"MEDIUM", "HIGH", "CRITICAL"}
        for item in security_findings
    )

    failed_checks = sum(
        item["status"] == "FAIL"
        for item in checks
    )

    warning_checks = sum(
        item["status"] == "WARNING"
        for item in checks
    )

    passed_checks = sum(
        item["status"] == "PASS"
        for item in checks
    )

    # ---------------------------------------------------------
    # Overall validation status
    # ---------------------------------------------------------

    if failed_checks:
        overall_status = "FAILED"

    elif warning_checks or has_security_warning:
        overall_status = "READY_WITH_WARNINGS"

    else:
        overall_status = "READY"

    # ---------------------------------------------------------
    # Return validation results
    # ---------------------------------------------------------

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
            "Terraform configuration was checked in a temporary "
            "isolated directory. No cloud resources were created "
            "or modified. Static security checks are heuristic "
            "and do not constitute a complete security audit or "
            "guarantee deployment success."
        ),
    }