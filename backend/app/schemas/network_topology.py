from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class NetworkTopologyRequest(BaseModel):
    intent_id: int = Field(gt=0)
    provider: Literal["AWS", "Azure", "GCP"]


class SubnetPlan(BaseModel):
    subnet_name: str
    tier: str
    cidr_block: str
    subnet_type: Literal["Public", "Private"]
    purpose: str


class NetworkComponent(BaseModel):
    component_name: str
    component_type: str
    purpose: str


class NetworkTopologyResponse(BaseModel):
    intent_id: int
    provider: str
    region: str

    network_cidr: str
    subnets: List[SubnetPlan]
    components: List[NetworkComponent]
    connectivity_flow: List[str]

    architecture_type: str
    design_rationale: List[str]

    is_simulation: bool = True
    disclaimer: Optional[str] = None