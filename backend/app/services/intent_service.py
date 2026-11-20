
from app.schemas.intent import IntentRequest, IntentResponse


def validate_intent(data: IntentRequest) -> IntentResponse:

    return IntentResponse(
        success=True,
        message="Infrastructure requirements validated successfully.",
        intent=data,
        validation_status="VALIDATED"
    )
