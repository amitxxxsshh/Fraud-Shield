from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskReason(BaseModel):
    factor: str
    impact: str = Field(..., description="'low', 'medium', 'high', or 'critical'")
    description: str
    weight: Optional[int] = None


class TransactionRiskRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR (₹)")
    recipient: Optional[str] = Field(None, description="Raw recipient handle e.g. rahul@upi (will be hashed & masked)")
    recipient_hash: Optional[str] = Field(None, description="Pre-hashed recipient identifier")
    new_recipient: bool = Field(False, description="Whether recipient is new to the user")
    transaction_time: Optional[datetime] = None
    user_average_amount: float = Field(3000.0, description="Historical user average amount in INR")
    transaction_frequency: int = Field(2, description="Transactions per day")
    recent_voice_risk: Optional[int] = Field(0, ge=0, le=100, description="Risk score from recent voice call")
    recent_message_risk: Optional[int] = Field(0, ge=0, le=100, description="Risk score from recent message")
    device_risk: Optional[int] = Field(0, ge=0, le=100, description="Device anomaly score")
    user_id: Optional[str] = "demo-user-1"
    device_id: Optional[str] = "browser-dev-1"


class TransactionRiskResponse(BaseModel):
    transaction_id: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    reasons: List[RiskReason]
    recommended_action: str = Field(..., description="PROCEED, VERIFY_RECIPIENT, CANCEL_PAYMENT, BLOCK_TRANSACTION")
    ml_probability: Optional[float] = None
    explanation: Optional[str] = None
    context_correlated: bool = False
    recipient_masked: str
    recipient_hash: str
    timestamp: datetime


class TransactionExecuteRequest(BaseModel):
    transaction_id: str
    action: str = Field(..., description="'PROCEEDED' or 'CANCELLED'")
    reasons: Optional[List[str]] = None


class TransactionSummary(BaseModel):
    id: str
    amount: float
    recipient_masked: str
    recipient_hash: str
    risk_score: int
    risk_level: str
    status: str
    payment_method: str
    transaction_time: datetime
    reasons: List[RiskReason]
