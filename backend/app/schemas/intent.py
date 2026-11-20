
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class IntentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    description: str = Field(min_length=20, max_length=5000)

    workload: str = Field(min_length=2, max_length=100)

    users: int = Field(gt=0)

    cpu: int = Field(gt=0, le=1024)

    ram: int = Field(gt=0, le=16384)

    storage: int = Field(gt=0, le=10000000)

    budget: float = Field(gt=0)

    currency: Literal["INR", "USD", "EUR", "GBP"]

    region: str

    latency: Literal[
        "Very Low",
        "Low",
        "Medium",
        "Flexible"
    ]

    availability: Literal[
        "Basic",
        "High",
        "Very High",
        "Mission Critical"
    ]

    providers: list[
        Literal["AWS", "Azure", "GCP"]
    ] = Field(min_length=1)


class IntentResponse(BaseModel):
    success: bool
    message: str
    intent: IntentRequest
    validation_status: str
