from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.services.validation_service import (
    validate_infrastructure_plan,
)

router = APIRouter(
    prefix="/validation",
    tags=["Infrastructure Validation"],
)


@router.get("/{intent_id}/validate")
def validate_infrastructure(
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

    # 3. Run infrastructure validation
    try:
        report = validate_infrastructure_plan(
            intent=intent,
            provider=provider,
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
            detail="Failed to validate infrastructure plan.",
        ) from error