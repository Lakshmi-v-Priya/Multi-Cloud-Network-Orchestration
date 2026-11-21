
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.schemas.intent import (
    IntentRequest,
    IntentResponse,
    SavedIntentResponse,
)
from app.services.intent_service import validate_intent

router = APIRouter(
    prefix="/intents",
    tags=["Intents"],
)


@router.post("/validate", response_model=IntentResponse)
def validate_intent_endpoint(
    data: IntentRequest,
    db: Session = Depends(get_db),
):
    # Validate the submitted intent
    result = validate_intent(data)

    if not result.success:
        return result

    try:
        # Convert request data into a database model
        intent_record = Intent(**data.model_dump())

        # Save to PostgreSQL
        db.add(intent_record)
        db.commit()
        db.refresh(intent_record)

        return result

    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Intent validation succeeded, but saving to database failed.",
        ) from error


@router.get("/", response_model=list[SavedIntentResponse])
def get_saved_intents(db: Session = Depends(get_db)):
    try:
        intents = (
            db.query(Intent)
            .order_by(Intent.id.desc())
            .all()
        )
        return intents

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve saved intents.",
        ) from error
