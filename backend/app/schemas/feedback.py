from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    risk_event_id: Optional[str] = None
    transaction_id: Optional[str] = None
    prediction_risk_level: Optional[str] = "HIGH"
    prediction_risk_score: Optional[int] = 85
    actual_feedback: str = Field(..., description="'CONFIRMED_FRAUD' or 'FALSE_POSITIVE'")
    user_comments: Optional[str] = None
    model_version: Optional[str] = "v1.0-xgb-upi"


class FeedbackResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: datetime
