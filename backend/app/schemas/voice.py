from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class VoiceAnalysisRequest(BaseModel):
    audio_base64: Optional[str] = Field(None, description="Base64-encoded audio (mulaw or wav)")
    transcript: Optional[str] = Field(None, description="Direct text transcript for demo / fallback mode")
    caller_phone: Optional[str] = Field(None, description="Raw caller phone (will be hashed)")
    call_sid: Optional[str] = Field(None, description="Twilio Call SID if live call")
    consent_given: bool = Field(True, description="Explicit caller/user consent flag")


class VoiceAnalysisResponse(BaseModel):
    voice_event_id: str
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: str
    detected_patterns: List[str]
    transcript_excerpt: List[str]
    confidence: float
    explanation: str
    timestamp: datetime
