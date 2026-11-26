from fastapi import APIRouter, HTTPException

from app.schemas.ai_intent import AIIntentRequest, AIIntentResponse
from app.services.ai_intent_service import extract_intent


router = APIRouter(prefix="/intents", tags=["AI Intent Understanding"])


@router.post("/understand", response_model=AIIntentResponse)
def understand_intent(data: AIIntentRequest):
    try:
        result = extract_intent(data.description)
        return result

    except RuntimeError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while understanding the intent.",
        ) from error