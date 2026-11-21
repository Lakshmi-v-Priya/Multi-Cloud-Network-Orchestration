from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.services.comparison_service import compare_cloud_resources
from app.schemas.comparison import ComparisonResponse

router = APIRouter(
    prefix="/comparison",
    tags=["Multi-Cloud Comparison"],
)


@router.get("/{intent_id}", response_model=ComparisonResponse)
def get_cloud_comparison(intent_id: int, db: Session = Depends(get_db)):
    # Retrieve the saved intent
    intent = db.query(Intent).filter(Intent.id == intent_id).first()

    if not intent:
        raise HTTPException(
            status_code=404,
            detail=f"Intent with ID {intent_id} not found",
        )

    # Compare the resource configurations across cloud providers
    comparison_results = compare_cloud_resources(intent)

    return ComparisonResponse(
        intent_id=intent.id,
        workload=intent.workload,
        comparison_results=comparison_results,
    )