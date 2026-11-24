from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.services.deployment_service import prepare_deployment_configuration
from app.services.terraform_service import generate_terraform_configuration
from app.services.terraform_validation_service import validate_terraform_configuration

router = APIRouter(
    prefix="/terraform-validation",
    tags=["Terraform Validation"],
)


@router.get("/{intent_id}/validate")
def validate_generated_terraform(
    intent_id: int,
    provider: str,
    db: Session = Depends(get_db),
):
    # 1. Retrieve the saved intent
    intent = (
        db.query(Intent)
        .filter(Intent.id == intent_id)
        .first()
    )

    # 2. Check whether the intent exists
    if not intent:
        raise HTTPException(
            status_code=404,
            detail="Intent not found.",
        )

    # 3. Prepare the deployment configuration and generate Terraform code
    try:
        deployment_configuration = prepare_deployment_configuration(
            intent=intent,
            provider=provider,
        )

        terraform_configuration = generate_terraform_configuration(
            deployment_configuration
        )

        terraform_code = terraform_configuration.get("terraform_code")

        if not terraform_code or not terraform_code.strip():
            raise ValueError("Generated Terraform configuration is empty.")

        # 4. Validate the generated code in the service's isolated temporary directory
        report = validate_terraform_configuration(
            terraform_code=terraform_code,
            provider=provider,
            intent_id=intent_id,
        )

        return report

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to validate generated Terraform configuration.",
        ) from error
