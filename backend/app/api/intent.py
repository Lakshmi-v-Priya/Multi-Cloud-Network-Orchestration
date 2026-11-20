
from fastapi import APIRouter

from app.schemas.intent import IntentRequest, IntentResponse
from app.services.intent_service import validate_intent

router = APIRouter(
    prefix="/api/v1/intents",
    tags=["Intent Management"]
)


@router.post("/validate", response_model=IntentResponse)
async def validate_intent_endpoint(data: IntentRequest):

    result = validate_intent(data)

    return result
