
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent

from app.schemas.network_topology import (
    NetworkTopologyRequest,
    NetworkTopologyResponse,
)

from app.services.network_topology_service import (
    classify_workload,
    plan_subnets,
    plan_network_components,
    plan_connectivity_flow,
    generate_design_rationale,
)


router = APIRouter(
    prefix="/network-topology",
    tags=["Network Topology"],
)


@router.post("/generate", response_model=NetworkTopologyResponse)
def generate_network_topology(
    data: NetworkTopologyRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a simulated network topology for a saved intent.
    """

    # 1. Retrieve the saved intent from PostgreSQL.
    intent = (
        db.query(Intent)
        .filter(Intent.id == data.intent_id)
        .first()
    )

    if intent is None:
        raise HTTPException(
            status_code=404,
            detail=f"Intent with ID {data.intent_id} was not found.",
        )

    try:
        # 2. Classify the workload.
        architecture_type = classify_workload(intent)

        # 3. Plan the subnets.
        subnets = plan_subnets(
            architecture_type,
            intent.availability,
        )

        # 4. Select provider-specific components.
        components = plan_network_components(
            data.provider,
            architecture_type,
            subnets,
        )

        # 5. Generate connectivity flows.
        connectivity_flow = plan_connectivity_flow(subnets)

        # 6. Generate design rationale.
        rationale = generate_design_rationale(
            architecture_type,
            intent.availability,
            data.provider,
            subnets,
        )

        # 7. Return the complete topology result.
        return NetworkTopologyResponse(
            intent_id=intent.id,
            provider=data.provider,
            region=intent.region,
            network_cidr="10.0.0.0/16",
            subnets=subnets,
            components=components,
            connectivity_flow=connectivity_flow,
            architecture_type=architecture_type,
            design_rationale=rationale,
            is_simulation=True,
            disclaimer=(
                "This network topology is a simulation-generated design. "
                "No real cloud infrastructure or network resources have "
                "been provisioned."
            ),
        )

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate network topology.",
        ) from error
