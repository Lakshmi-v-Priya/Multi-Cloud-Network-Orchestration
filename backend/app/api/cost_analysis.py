from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.services.cost_service import analyze_costs
from app.schemas.cost_analysis import CostAnalysisResponse


router = APIRouter(
    prefix="/cost-analysis",
    tags=["Cost Analysis"],
)


@router.get("/{intent_id}", response_model=CostAnalysisResponse)
def get_cost_analysis(intent_id: int, db: Session = Depends(get_db)):
    # Retrieve the saved intent
    intent = db.query(Intent).filter(Intent.id == intent_id).first()

    if not intent:
        raise HTTPException(
            status_code=404,
            detail=f"Intent with ID {intent_id} not found",
        )

    # Calculate cost estimates for the selected cloud providers
    cost_analysis = analyze_costs(intent)

    return cost_analysis