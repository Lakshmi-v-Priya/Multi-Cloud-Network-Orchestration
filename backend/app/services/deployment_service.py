from app.services.orchestration_service import generate_orchestration_plan
from app.schemas.deployment import DeploymentConfiguration


def prepare_deployment_configuration(intent, provider: str):

    # --------------------------------------------------
    # 1. Generate the existing orchestration plan
    # --------------------------------------------------

    orchestration_plan = generate_orchestration_plan(
        intent=intent,
        provider=provider,
    )

    # --------------------------------------------------
    # 2. Convert planned resources into deployment data
    # --------------------------------------------------

    resources = []

    for resource in orchestration_plan.resources:

        resources.append(
            {
                "resource_name": resource.resource_name,
                "resource_type": resource.resource_type,
                "provider": resource.provider,
                "region": resource.region,
                "configuration": resource.configuration,
                "purpose": resource.purpose,
            }
        )

    # --------------------------------------------------
    # 3. Prepare deployment configuration
    # --------------------------------------------------

    deployment_configuration = DeploymentConfiguration(
        intent_id=orchestration_plan.intent_id,
        workload=orchestration_plan.workload,
        provider=orchestration_plan.selected_provider,
        region=orchestration_plan.region,
        resources=resources,
        deployment_order=orchestration_plan.deployment_order,
        estimated_monthly_cost=(
            orchestration_plan.estimated_monthly_cost
        ),
        currency=orchestration_plan.currency,
        deployment_status="PREPARED",
        is_simulation=True,
        disclaimer=(
            "Deployment configuration has been prepared "
            "for simulation. No actual cloud resources "
            "have been created or modified."
        ),
    )

    # --------------------------------------------------
    # 4. Return prepared deployment configuration
    # --------------------------------------------------

    return deployment_configuration