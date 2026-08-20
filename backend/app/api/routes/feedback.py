import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Feedback, RiskEvent, AuditLog
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackResponse)
async def submit_feedback(
    req: FeedbackCreate,
    db: Session = Depends(get_db)
):
    """
    Submits user confirmation or false-positive feedback on a risk alert.
    Stores the prediction, actual user feedback, and model version for continuous quality tracking.
    """
    if req.actual_feedback not in ("CONFIRMED_FRAUD", "FALSE_POSITIVE"):
        raise HTTPException(
            status_code=400,
            detail="actual_feedback must be either 'CONFIRMED_FRAUD' or 'FALSE_POSITIVE'"
        )

    now = datetime.now(timezone.utc)
    feedback_entry = Feedback(
        risk_event_id=req.risk_event_id,
        transaction_id=req.transaction_id,
        prediction_risk_level=req.prediction_risk_level or "HIGH",
        prediction_risk_score=req.prediction_risk_score or 85,
        actual_feedback=req.actual_feedback,
        user_comments=req.user_comments,
        model_version=req.model_version or "v1.0-xgb-upi",
    )
    db.add(feedback_entry)

    # If associated with a RiskEvent, update user_action
    if req.risk_event_id:
        r_event = db.query(RiskEvent).filter(RiskEvent.id == req.risk_event_id).first()
        if r_event:
            r_event.user_action = req.actual_feedback

    # Record Audit Log
    audit = AuditLog(
        action="FEEDBACK_SUBMITTED",
        actor_id="user",
        details_json=f'{{"feedback": "{req.actual_feedback}", "risk_event_id": "{req.risk_event_id}"}}',
    )
    db.add(audit)
    db.commit()
    db.refresh(feedback_entry)

    # Real-time WebSocket Broadcast
    await ws_manager.broadcast({
        "event_type": "FEEDBACK_SUBMITTED",
        "feedback_id": feedback_entry.id,
        "actual_feedback": req.actual_feedback,
        "prediction_risk_score": req.prediction_risk_score,
        "timestamp": now.isoformat(),
    })

    return FeedbackResponse(
        id=feedback_entry.id,
        status="success",
        message=f"Feedback '{req.actual_feedback}' successfully recorded.",
        created_at=now,
    )


@router.get("")
def get_feedback_list(limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns list of submitted feedback entries for model performance auditing.
    """
    entries = db.query(Feedback).order_by(Feedback.created_at.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "risk_event_id": e.risk_event_id,
            "transaction_id": e.transaction_id,
            "prediction_risk_level": e.prediction_risk_level,
            "prediction_risk_score": e.prediction_risk_score,
            "actual_feedback": e.actual_feedback,
            "user_comments": e.user_comments,
            "model_version": e.model_version,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in entries
    ]
