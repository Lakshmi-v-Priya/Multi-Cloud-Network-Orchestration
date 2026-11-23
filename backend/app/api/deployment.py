from pathlib import Path

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
# Project Root and Terraform File Path
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[3]

TERRAFORM_FILE = PROJECT_ROOT / "main.tf"


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
# 2. Generate and Save Terraform Configuration
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

        # Step 3: Extract generated Terraform code
        terraform_code = terraform_configuration.get(
            "terraform_code"
        )

        if not terraform_code:
            raise ValueError(
                "Generated Terraform code is empty."
            )

        # Step 4: Save Terraform code to main.tf
        TERRAFORM_FILE.write_text(
            terraform_code,
            encoding="utf-8",
        )

        # Step 5: Add file-saving information to response
        terraform_configuration["saved_to"] = str(
            TERRAFORM_FILE
        )

        terraform_configuration["file_saved"] = True

        # Step 6: Return generated configuration
        return terraform_configuration

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate or save Terraform configuration.",
        ) from error
