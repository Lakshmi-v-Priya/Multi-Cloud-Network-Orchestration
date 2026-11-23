from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent

from app.services.deployment_service import (
    prepare_deployment_configuration,
)

from app.services.terraform_service import (
    generate_terraform_configuration,
)


router = APIRouter(
    prefix="/deployment",
    tags=["Deployment Preparation"],
)


# --------------------------------------------------
# 1. Prepare Deployment Configuration
# --------------------------------------------------

@router.get("/{intent_id}/prepare")
def prepare_deployment(
    intent_id: int,
    provider: str,
    db: Session = Depends(get_db),
):

    # Retrieve intent
    intent = db.query(Intent).filter(
        Intent.id == intent_id
    ).first()

    if not intent:
        raise HTTPException(
            status_code=404,
            detail="Intent not found.",
        )

    try:
        configuration = prepare_deployment_configuration(
            intent=intent,
            provider=provider,
        )

        return configuration

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to prepare deployment configuration.",
        ) from error


# --------------------------------------------------
# 2. Generate Terraform Configuration
# --------------------------------------------------

@router.get("/{intent_id}/terraform")
def generate_terraform(
    intent_id: int,
    provider: str,
    db: Session = Depends(get_db),
):

    # Retrieve intent
    intent = db.query(Intent).filter(
        Intent.id == intent_id
    ).first()

    if not intent:
        raise HTTPException(
            status_code=404,
            detail="Intent not found.",
        )

    try:

        # Step 1: Prepare deployment configuration
        deployment_configuration = (
            prepare_deployment_configuration(
                intent=intent,
                provider=provider,
            )
        )

        # Step 2: Generate Terraform code
        terraform_configuration = (
            generate_terraform_configuration(
                deployment_configuration
            )
        )

        # Step 3: Return generated configuration
        return terraform_configuration

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate Terraform configuration.",
        ) from error