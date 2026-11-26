from typing import Literal
from pydantic import BaseModel, Field


class AIIntentRequest(BaseModel):
    description: str = Field(min_length=20, max_length=5000)


class AIIntentExtracted(BaseModel):
    workload: str | None = None
    users: int | None = None
    cpu: int | None = None
    ram: int | None = None
    storage: int | None = None
    budget: float | None = None
    currency: Literal["INR", "USD", "EUR", "GBP"] | None = None
    region: str | None = None
    latency: Literal["Very Low", "Low", "Medium", "Flexible"] | None = None
    availability: Literal[
        "Basic",
        "High",
        "Very High",
        "Mission Critical"
    ] | None = None
    providers: list[Literal["AWS", "Azure", "GCP"]] | None = None


class AIIntentResponse(BaseModel):
    success: bool
    message: str
    extracted_intent: AIIntentExtracted
    missing_fields: list[str] = []
    clarification_questions: list[str] = []