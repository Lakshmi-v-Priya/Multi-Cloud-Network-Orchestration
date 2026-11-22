from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.intent import Intent
from app.services.optimization_service import optimize_intent
from app.schemas.optimization import OptimizationResponse


router = APIRouter(
    prefix="/optimization",
    tags=["Optimization"],
)


@router.get("/{intent_id}", response_model=OptimizationResponse)
def get_optimization(intent_id: int, db: Session = Depends(get_db)):
    # Retrieve the saved intent
    intent = db.query(Intent).filter(Intent.id == intent_id).first()

    if not intent:
        raise HTTPException(
            status_code=404,
            detail=f"Intent with ID {intent_id} not found",
        )

    # Run the optimization engine
    optimization_result = optimize_intent(intent)

    return optimization_result