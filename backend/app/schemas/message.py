from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class MessageRiskRequest(BaseModel):
    message_text: str = Field(..., description="Raw message text provided by user")
    sender_phone: Optional[str] = Field(None, description="Sender number or handle (will be hashed)")


class MessageRiskResponse(BaseModel):
    message_event_id: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str
    detected_patterns: List[str]
    explanation: str
    sender_hash: Optional[str] = None
    timestamp: datetime
