from typing import List, Optional

from pydantic import BaseModel, Field


class OptimizationCandidate(BaseModel):
    provider: str
    instance_type: str

    estimated_monthly_cost: float = Field(ge=0)
    budget: float = Field(ge=0)
    currency: str = "INR"

    within_budget: bool
    cost_rank: int = Field(ge=1)

    # Individual weighted score contributions
    cost_score: float = Field(ge=0, le=35)
    budget_score: float = Field(ge=0, le=25)
    latency_score: float = Field(ge=0, le=20)
    availability_score: float = Field(ge=0, le=20)

    # Final combined score
    optimization_score: float = Field(ge=0, le=100)

    recommendation: str
    reasons: List[str]

    pricing_source: str = "Illustrative Demo Pricing"
    is_simulation: bool = True


class OptimizationResponse(BaseModel):
    intent_id: int
    workload: str
    region: str

    optimization_strategy: str
    candidates: List[OptimizationCandidate]

    recommended_provider: Optional[str] = None
    recommendation_reason: Optional[str] = None

    is_simulation: bool = True
    disclaimer: str = (
        "Recommendations are based on illustrative demo pricing "
        "and simulated cost, latency, availability and budget "
        "evaluation. They do not represent live cloud pricing, "
        "measured performance or actual deployed infrastructure."
    )