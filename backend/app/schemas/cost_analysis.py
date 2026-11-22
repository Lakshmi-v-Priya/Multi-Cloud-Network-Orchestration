from pydantic import BaseModel, Field
from typing import Optional, List


class CloudCostEstimate(BaseModel):
    provider: str
    instance_type: str

    compute_cost: float = Field(ge=0)
    storage_cost: float = Field(ge=0)
    network_cost: float = Field(ge=0)

    total_monthly_cost: float = Field(ge=0)

    currency: str = "INR"

    pricing_source: str = "Demo Estimate"
    is_estimated: bool = True

    notes: Optional[str] = None


class CostAnalysisResponse(BaseModel):
    intent_id: int
    workload: str
    region: str

    cost_estimates: List[CloudCostEstimate]