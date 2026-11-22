
from typing import List, Optional
from pydantic import BaseModel


class PlannedResource(BaseModel):
    resource_name: str
    resource_type: str
    provider: str
    region: str
    configuration: dict
    purpose: str


class OrchestrationPlanResponse(BaseModel):
    intent_id: int
    workload: str
    selected_provider: str
    region: str

    resources: List[PlannedResource]
    deployment_order: List[str]
    estimated_monthly_cost: float
    currency: str

    planning_status: str
    is_simulation: bool = True
    disclaimer: Optional[str] = None
