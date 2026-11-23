from typing import List, Dict, Any
from pydantic import BaseModel


class DeploymentConfiguration(BaseModel):
    intent_id: int
    workload: str
    provider: str
    region: str

    resources: List[Dict[str, Any]]
    deployment_order: List[str]

    estimated_monthly_cost: float
    currency: str

    deployment_status: str = "PREPARED"
    is_simulation: bool = True

    disclaimer: str = (
        "This deployment configuration is prepared for simulation only. "
        "No cloud resources have been created or modified."
    )