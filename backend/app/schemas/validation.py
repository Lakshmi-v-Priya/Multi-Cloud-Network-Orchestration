from typing import List
from pydantic import BaseModel


class ValidationCheck(BaseModel):
    check_name: str
    status: str  # PASS, WARNING, FAIL
    message: str


class ValidationReportResponse(BaseModel):
    intent_id: int
    provider: str

    overall_status: str  # VALID, VALID_WITH_WARNINGS, INVALID

    total_checks: int
    passed_checks: int
    warning_checks: int
    failed_checks: int

    checks: List[ValidationCheck]

    is_simulation: bool = True
    disclaimer: str