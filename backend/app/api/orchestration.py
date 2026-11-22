
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.services.orchestration_service import (
    generate_orchestration_plan,
)

router = APIRouter(
    prefix="/orchestration",
    tags=["Orchestration"],
)


@router.get("/{intent_id}/plan")
def get_orchestration_plan(
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

    # 3. Generate the orchestration plan
    try:
        plan = generate_orchestration_plan(
            intent=intent,
            provider=provider,
        )

        return plan

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate orchestration plan.",
        ) from error
