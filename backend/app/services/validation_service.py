
from app.schemas.validation import (
    ValidationCheck,
    ValidationReportResponse
)

from app.services.orchestration_service import (
    generate_orchestration_plan
)


def validate_infrastructure_plan(intent, provider):

    checks = []

    # Generate the orchestration plan
    plan = generate_orchestration_plan(intent, provider)

    # Check 1: Provider consistency
    inconsistent_resources = [
        resource.resource_name
        for resource in plan.resources
        if resource.provider != provider
    ]

    if inconsistent_resources:
        checks.append(
            ValidationCheck(
                check_name="Provider Consistency",
                status="FAIL",
                message=(
                    f"Resources assigned to a different provider: "
                    f"{inconsistent_resources}"
                )
            )
        )
    else:
        checks.append(
            ValidationCheck(
                check_name="Provider Consistency",
                status="PASS",
                message=f"All resources are assigned to {provider}."
            )
        )

    # Check 2: Resource completeness
    required_resources = [
        "application_compute",
        "application_storage",
        "application_network",
        "application_security"
    ]

    resource_names = [
        resource.resource_name
        for resource in plan.resources
    ]

    missing_resources = [
        resource
        for resource in required_resources
        if resource not in resource_names
    ]

    if missing_resources:
        checks.append(
            ValidationCheck(
                check_name="Resource Completeness",
                status="FAIL",
                message=f"Missing resources: {missing_resources}"
            )
        )
    else:
        checks.append(
            ValidationCheck(
                check_name="Resource Completeness",
                status="PASS",
                message="All required infrastructure resources are present."
            )
        )

    # Check 3: Budget compliance
    if plan.estimated_monthly_cost <= intent.budget:
        checks.append(
            ValidationCheck(
                check_name="Budget Compliance",
                status="PASS",
                message="Estimated monthly cost is within the budget."
            )
        )
    else:
        checks.append(
            ValidationCheck(
                check_name="Budget Compliance",
                status="WARNING",
                message=(
                    f"Estimated cost {plan.estimated_monthly_cost} "
                    f"exceeds budget {intent.budget}."
                )
            )
        )

    # Check 4: Security configuration
    security_resource = next(
        (
            resource
            for resource in plan.resources
            if resource.resource_name == "application_security"
        ),
        None
    )

    if security_resource:
        ssh_enabled = security_resource.configuration.get(
            "ssh", False
        )

        if ssh_enabled:
            checks.append(
                ValidationCheck(
                    check_name="Security Configuration",
                    status="FAIL",
                    message="SSH access is enabled. Review security settings."
                )
            )
        else:
            checks.append(
                ValidationCheck(
                    check_name="Security Configuration",
                    status="PASS",
                    message="SSH access is disabled."
                )
            )
    else:
        checks.append(
            ValidationCheck(
                check_name="Security Configuration",
                status="FAIL",
                message="Security resource is missing."
            )
        )

    # Check 5: Deployment order
    expected_order = [
        "application_network",
        "application_security",
        "application_storage",
        "application_compute"
    ]

    if plan.deployment_order == expected_order:
        checks.append(
            ValidationCheck(
                check_name="Deployment Dependencies",
                status="PASS",
                message="Resources follow the expected deployment order."
            )
        )
    else:
        checks.append(
            ValidationCheck(
                check_name="Deployment Dependencies",
                status="WARNING",
                message="Deployment order differs from the expected order."
            )
        )

    # Overall status calculation
    failed_checks = sum(
        1 for check in checks
        if check.status == "FAIL"
    )

    warning_checks = sum(
        1 for check in checks
        if check.status == "WARNING"
    )

    passed_checks = sum(
        1 for check in checks
        if check.status == "PASS"
    )

    if failed_checks > 0:
        overall_status = "INVALID"
    elif warning_checks > 0:
        overall_status = "VALID_WITH_WARNINGS"
    else:
        overall_status = "VALID"

    # Return validation report
    return ValidationReportResponse(
        intent_id=intent.id,
        provider=provider,
        overall_status=overall_status,
        total_checks=len(checks),
        passed_checks=passed_checks,
        warning_checks=warning_checks,
        failed_checks=failed_checks,
        checks=checks,
        is_simulation=True,
        disclaimer=(
            "Infrastructure validation is simulated. "
            "No actual cloud resources are deployed."
        )
    )
