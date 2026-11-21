from pydantic import BaseModel
from typing import List


class CloudResourceComparison(BaseModel):
    provider: str
    instance_type: str
    vcpu: int
    ram_gb: float
    estimated_monthly_cost: float | None = None
    currency: str
    storage_type: str
    notes: str


class ComparisonResponse(BaseModel):
    intent_id: int
    workload: str
    comparison_results: List[CloudResourceComparison]