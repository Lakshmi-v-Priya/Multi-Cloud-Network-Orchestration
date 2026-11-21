
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.schemas.intent import IntentRequest, IntentResponse

router = APIRouter(
    prefix="/intents",
    tags=["Intents"],
)


@router.post("/validate", response_model=IntentResponse)
def validate_intent(
    intent_data: IntentRequest,
    db: Session = Depends(get_db),
):
    try:
        # Convert the validated request into database-compatible data
        intent = Intent(**intent_data.model_dump())

        # Save the intent to PostgreSQL
        db.add(intent)
        db.commit()
        db.refresh(intent)

        return IntentResponse(
            success=True,
            message="Intent validated and saved successfully!",
            intent=intent_data,
            validation_status="VALIDATED",
        )

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to save intent: {str(error)}",
        )
