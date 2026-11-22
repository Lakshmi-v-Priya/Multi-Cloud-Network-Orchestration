
from app.services.cost_service import calculate_cloud_cost
from app.schemas.orchestration import (
    PlannedResource,
    OrchestrationPlanResponse,
)


def generate_orchestration_plan(intent, provider: str):

    # --------------------------------------------------
    # 1. Validate selected cloud provider
    # --------------------------------------------------

    if provider not in intent.providers:
        raise ValueError(
            f"{provider} is not included in the providers "
            "selected for this intent."
        )

    supported_providers = ["AWS", "Azure", "GCP"]

    if provider not in supported_providers:
        raise ValueError("Unsupported cloud provider.")

    # --------------------------------------------------
    # 2. Calculate cost using existing cost service
    # --------------------------------------------------

    cost_estimate = calculate_cloud_cost(
        provider=provider,
        cpu=intent.cpu,
        ram=intent.ram,
        storage=intent.storage,
        currency=intent.currency,
    )

    # --------------------------------------------------
    # 3. Create resource plan
    # --------------------------------------------------

    resources = []

    # Compute resource
    resources.append(
        PlannedResource(
            resource_name="application_compute",
            resource_type="Virtual Machine",
            provider=provider,
            region=intent.region,
            configuration={
                "vCPU": intent.cpu,
                "RAM_GB": intent.ram,
                "workload": intent.workload,
                "instance_type": cost_estimate.instance_type,
            },
            purpose=(
                "Runs the application workload and "
                "handles application processing."
            ),
        )
    )

    # Storage resource
    resources.append(
        PlannedResource(
            resource_name="application_storage",
            resource_type="Block Storage",
            provider=provider,
            region=intent.region,
            configuration={
                "capacity_GB": intent.storage,
                "storage_type": "General Purpose",
            },
            purpose=(
                "Stores application files, data, "
                "and persistent information."
            ),
        )
    )

    # Network resource
    resources.append(
        PlannedResource(
            resource_name="application_network",
            resource_type="Virtual Network",
            provider=provider,
            region=intent.region,
            configuration={
                "network_scope": "Application Network",
                "connectivity": "Private Network",
            },
            purpose=(
                "Provides network connectivity for "
                "the application infrastructure."
            ),
        )
    )

    # Security resource
    resources.append(
        PlannedResource(
            resource_name="application_security",
            resource_type="Network Security Rules",
            provider=provider,
            region=intent.region,
            configuration={
                "allow_http": True,
                "allow_https": True,
                "allow_ssh": False,
                "default_access": "Restricted",
            },
            purpose=(
                "Defines basic network access restrictions "
                "for the planned infrastructure."
            ),
        )
    )

    # --------------------------------------------------
    # 4. Define deployment order
    # --------------------------------------------------

    deployment_order = [
        "application_network",
        "application_security",
        "application_storage",
        "application_compute",
    ]

    # --------------------------------------------------
    # 5. Return orchestration plan
    # --------------------------------------------------

    return OrchestrationPlanResponse(
        intent_id=intent.id,
        workload=intent.workload,
        selected_provider=provider,
        region=intent.region,
        resources=resources,
        deployment_order=deployment_order,
        estimated_monthly_cost=cost_estimate.total_monthly_cost,
        currency=intent.currency,
        planning_status="PLAN_GENERATED",
        is_simulation=True,
        disclaimer=(
            "This is a simulated orchestration plan. "
            "Resource configurations are illustrative and "
            "have not been verified against live cloud "
            "provider catalogs. Costs use demo pricing. "
            "No cloud resources have been created."
        ),
    )
