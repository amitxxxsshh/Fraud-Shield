from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_transactions: int
    high_risk_count: int
    critical_risk_count: int
    voice_scam_events: int
    message_scam_events: int
    false_positives: int
    confirmed_fraud: int
    average_risk_score: float
    false_positive_rate: float


class RiskTimelinePoint(BaseModel):
    timestamp: str
    risk_score: int
    amount: float
    status: str


class FactorDistribution(BaseModel):
    factor: str
    count: int
    impact: str


class CategoryCount(BaseModel):
    category: str
    count: int


class DashboardCharts(BaseModel):
    risk_over_time: List[RiskTimelinePoint]
    risk_distribution: Dict[str, int]  # {"LOW": x, "MEDIUM": y, "HIGH": z, "CRITICAL": w}
    top_risk_factors: List[FactorDistribution]
    voice_scam_categories: List[CategoryCount]
    transaction_amount_ranges: Dict[str, int]


class RiskEventBroadcast(BaseModel):
    event_id: str
    event_type: str
    risk_score: int
    risk_level: str
    timestamp: str
    reasons: List[Dict[str, Any]]
    explanation: Optional[str] = None
    recipient_masked: Optional[str] = None
    amount: Optional[float] = None
