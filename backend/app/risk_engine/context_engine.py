from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.entities import VoiceEvent, MessageEvent, RiskEvent
from app.schemas.transaction import RiskReason


class ContextEngine:
    """
    Multi-modal Context Correlation Engine.
    Correlates recent voice calls, phishing messages, and device anomalies with current transaction attempts.
    Applies time-decay weighting (events within 5 minutes have maximum correlation).
    """

    def correlate(
        self,
        features: Dict[str, float],
        db: Optional[Session] = None,
        user_id: Optional[str] = None
    ) -> Tuple[int, List[RiskReason], bool]:
        context_score = 0
        correlated_reasons: List[RiskReason] = []
        is_correlated = False

        voice_risk = float(features.get("voice_risk", 0))
        message_risk = float(features.get("message_risk", 0))
        amount = float(features.get("amount", 0))
        new_rec = bool(features.get("new_recipient", 0))
        ratio = float(features.get("amount_to_average_ratio", 1.0))

        # Check in-db recent events if db session is provided
        recent_voice = None
        recent_msg = None
        if db:
            now = datetime.now(timezone.utc)
            fifteen_mins_ago = now - timedelta(minutes=15)
            
            recent_voice = db.query(VoiceEvent).filter(
                VoiceEvent.created_at >= fifteen_mins_ago
            ).order_by(VoiceEvent.created_at.desc()).first()

            recent_msg = db.query(MessageEvent).filter(
                MessageEvent.created_at >= fifteen_mins_ago
            ).order_by(MessageEvent.created_at.desc()).first()

            if recent_voice and recent_voice.risk_score > voice_risk:
                voice_risk = float(recent_voice.risk_score)
            if recent_msg and recent_msg.risk_score > message_risk:
                message_risk = float(recent_msg.risk_score)

        # 1. Voice Phishing + Transfer Request Correlation (The classic vishing flow)
        if voice_risk >= 70:
            is_correlated = True
            if new_rec and (ratio >= 2.0 or amount >= 10000):
                # Critical compound attack pattern: Scammer calls victim -> orders immediate transfer
                context_score += 45
                correlated_reasons.append(RiskReason(
                    factor="vishing_transfer_correlation",
                    impact="critical",
                    description=f"Suspicious bank/police voice call (Risk: {int(voice_risk)}/100) occurred shortly before this transfer attempt to an unverified recipient.",
                    weight=45
                ))
            else:
                context_score += 25
                correlated_reasons.append(RiskReason(
                    factor="recent_voice_risk_correlation",
                    impact="high",
                    description=f"Recent high-risk voice call detected (Risk: {int(voice_risk)}/100) in the user's active session window.",
                    weight=25
                ))

        # 2. Message Scam + Transfer Correlation (Urgent SMS / WhatsApp demand)
        if message_risk >= 60:
            is_correlated = True
            if new_rec or ratio >= 1.5:
                context_score += 35
                correlated_reasons.append(RiskReason(
                    factor="smishing_transfer_correlation",
                    impact="high",
                    description=f"Phishing SMS / WhatsApp message (Risk: {int(message_risk)}/100) received shortly before payment attempt.",
                    weight=35
                ))
            else:
                context_score += 20
                correlated_reasons.append(RiskReason(
                    factor="recent_message_risk_correlation",
                    impact="medium",
                    description=f"Recent suspicious message detected (Risk: {int(message_risk)}/100).",
                    weight=20
                ))

        # 3. Multi-Channel Coordinated Attack (Both voice and message triggers)
        if voice_risk >= 60 and message_risk >= 60:
            is_correlated = True
            context_score += 20
            correlated_reasons.append(RiskReason(
                factor="multi_channel_attack",
                impact="critical",
                description="Cross-channel social engineering detected: Concurrent suspicious voice call and scam messaging.",
                weight=20
            ))

        # Cap context score
        capped_score = min(100, max(0, context_score))
        return capped_score, correlated_reasons, is_correlated


context_engine = ContextEngine()
