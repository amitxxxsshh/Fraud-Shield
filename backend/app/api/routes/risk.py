import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.metrics import RISK_PREDICTIONS_TOTAL, HIGH_RISK_EVENTS_TOTAL
from app.models.entities import Transaction, RiskEvent, VoiceEvent, MessageEvent
from app.schemas.transaction import (
    TransactionRiskRequest,
    TransactionRiskResponse,
    TransactionExecuteRequest,
    TransactionSummary,
    RiskReason
)
from app.schemas.message import MessageRiskRequest, MessageRiskResponse
from app.schemas.voice import VoiceAnalysisRequest, VoiceAnalysisResponse
from app.risk_engine.feature_engineering import FeatureEngineering
from app.risk_engine.rule_engine import RuleEngine
from app.risk_engine.ml_predictor import ml_predictor
from app.risk_engine.context_engine import context_engine
from app.risk_engine.risk_aggregator import risk_aggregator
from app.risk_engine.explanation_builder import ExplanationBuilder
from app.services.voice_classifier import voice_classifier
from app.services.stt_service import stt_service
from app.services.privacy_service import PrivacyService
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/risk", tags=["Risk Assessment"])

rule_engine = RuleEngine()


@router.post("/transaction", response_model=TransactionRiskResponse)
async def evaluate_transaction_risk(
    req: TransactionRiskRequest,
    db: Session = Depends(get_db)
):
    """
    Evaluates real-time risk for a UPI transaction using the hybrid risk engine:
    1. Feature extraction
    2. Heuristic rule engine
    3. XGBoost ML classifier
    4. Context correlation engine
    5. Structured explainability builder & LLM explanation
    6. Real-time WebSocket broadcast
    """
    # 1. Privacy Hashing & Masking
    raw_recipient = req.recipient or "unknown@upi"
    recipient_hash = req.recipient_hash or PrivacyService.hash_identifier(raw_recipient)
    recipient_masked = PrivacyService.mask_identifier(raw_recipient)

    # 2. Feature Extraction
    features = FeatureEngineering.extract_features({
        "amount": req.amount,
        "new_recipient": req.new_recipient,
        "user_average_amount": req.user_average_amount,
        "transaction_frequency": req.transaction_frequency,
        "transaction_time": req.transaction_time or datetime.now(timezone.utc),
        "recent_voice_risk": req.recent_voice_risk,
        "recent_message_risk": req.recent_message_risk,
        "device_risk": req.device_risk,
    })

    # 3. Heuristic Rules
    rule_score, rule_reasons = rule_engine.evaluate(req.model_dump(), features)

    # 4. ML Model Prediction (XGBoost)
    ml_prob, ml_score = ml_predictor.predict_probability(features)

    # 5. Context Correlation
    context_score, context_reasons, is_correlated = context_engine.correlate(
        features=features, db=db, user_id=req.user_id
    )

    # 6. Hybrid Risk Aggregation
    final_score, risk_level, all_reasons, recommended_action = risk_aggregator.aggregate(
        rule_score=rule_score,
        rule_reasons=rule_reasons,
        ml_score=ml_score,
        ml_probability=ml_prob,
        context_score=context_score,
        context_reasons=context_reasons,
        features=features,
    )

    # 7. Natural Language Explanation
    explanation = await ExplanationBuilder.build_explanation(
        risk_score=final_score,
        risk_level=risk_level,
        reasons=all_reasons,
        amount=req.amount,
        recipient_masked=recipient_masked,
    )

    # 8. Persist Transaction & Risk Event
    now = datetime.now(timezone.utc)
    reasons_data = [r.model_dump() for r in all_reasons]

    tx = Transaction(
        user_id=req.user_id,
        amount=req.amount,
        recipient_hash=recipient_hash,
        recipient_masked=recipient_masked,
        new_recipient=req.new_recipient,
        transaction_time=now,
        status="FLAGGED" if final_score >= 60 else "COMPLETED",
        risk_score=final_score,
        risk_level=risk_level,
        reasons_json=json.dumps(reasons_data),
        payment_method="UPI Demo",
    )
    db.add(tx)

    r_event = RiskEvent(
        event_type="TRANSACTION",
        source_id=tx.id,
        risk_score=final_score,
        risk_level=risk_level,
        reasons_json=json.dumps(reasons_data),
        explanation=explanation,
        composite_factors_json=json.dumps({
            "rule_score": rule_score,
            "ml_score": ml_score,
            "ml_probability": ml_prob,
            "context_score": context_score,
            "is_correlated": is_correlated,
        }),
    )
    db.add(r_event)
    db.commit()
    db.refresh(tx)

    # 9. Metrics update
    try:
        RISK_PREDICTIONS_TOTAL.labels(event_type="transaction", risk_level=risk_level).inc()
        if risk_level in ("HIGH", "CRITICAL"):
            HIGH_RISK_EVENTS_TOTAL.labels(category="transaction").inc()
    except Exception:
        pass

    # 10. Real-time WebSocket Broadcast
    await ws_manager.broadcast({
        "event_id": r_event.id,
        "event_type": "TRANSACTION_ASSESSED",
        "transaction_id": tx.id,
        "amount": req.amount,
        "recipient_masked": recipient_masked,
        "risk_score": final_score,
        "risk_level": risk_level,
        "reasons": reasons_data,
        "explanation": explanation,
        "recommended_action": recommended_action,
        "timestamp": now.isoformat(),
    })

    return TransactionRiskResponse(
        transaction_id=tx.id,
        risk_score=final_score,
        risk_level=risk_level,
        reasons=all_reasons,
        recommended_action=recommended_action,
        ml_probability=round(ml_prob, 4),
        explanation=explanation,
        context_correlated=is_correlated,
        recipient_masked=recipient_masked,
        recipient_hash=recipient_hash,
        timestamp=now,
    )


@router.post("/transaction/execute")
async def execute_or_cancel_transaction(
    req: TransactionExecuteRequest,
    db: Session = Depends(get_db)
):
    """
    Updates the final status of a transaction following user confirmation or cancellation.
    """
    tx = db.query(Transaction).filter(Transaction.id == req.transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    new_status = "COMPLETED" if req.action == "PROCEEDED" else "CANCELLED"
    tx.status = new_status
    db.commit()

    # Broadcast update
    await ws_manager.broadcast({
        "event_type": "TRANSACTION_RESOLVED",
        "transaction_id": tx.id,
        "status": new_status,
        "action": req.action,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"status": "success", "transaction_id": tx.id, "final_status": new_status}


@router.post("/message", response_model=MessageRiskResponse)
async def evaluate_message_risk(
    req: MessageRiskRequest,
    db: Session = Depends(get_db)
):
    """
    Analyzes user-provided SMS / WhatsApp message text for phishing, urgency, and extortion patterns.
    Clearly labeled as 'User-provided message analysis'.
    """
    classification = voice_classifier.classify(req.message_text)
    sender_hash = PrivacyService.hash_identifier(req.sender_phone or "user-pasted-message")

    now = datetime.now(timezone.utc)
    m_event = MessageEvent(
        sender_hash=sender_hash,
        message_text=req.message_text,
        detected_patterns_json=json.dumps(classification["detected_patterns"]),
        risk_score=classification["risk_score"],
        risk_level=classification["risk_level"],
        explanation=classification["explanation"],
    )
    db.add(m_event)

    r_event = RiskEvent(
        event_type="MESSAGE",
        source_id=m_event.id,
        risk_score=classification["risk_score"],
        risk_level=classification["risk_level"],
        reasons_json=json.dumps(classification["detected_patterns"]),
        explanation=classification["explanation"],
    )
    db.add(r_event)
    db.commit()
    db.refresh(m_event)

    try:
        RISK_PREDICTIONS_TOTAL.labels(event_type="message", risk_level=classification["risk_level"]).inc()
        if classification["risk_level"] in ("HIGH", "CRITICAL"):
            HIGH_RISK_EVENTS_TOTAL.labels(category="message").inc()
    except Exception:
        pass

    # Real-time WebSocket Broadcast
    await ws_manager.broadcast({
        "event_id": r_event.id,
        "event_type": "MESSAGE_SCAM_DETECTED",
        "risk_score": classification["risk_score"],
        "risk_level": classification["risk_level"],
        "detected_patterns": classification["detected_patterns"],
        "explanation": classification["explanation"],
        "timestamp": now.isoformat(),
    })

    return MessageRiskResponse(
        message_event_id=m_event.id,
        risk_score=classification["risk_score"],
        risk_level=classification["risk_level"],
        detected_patterns=classification["detected_patterns"],
        explanation=classification["explanation"],
        sender_hash=sender_hash,
        timestamp=now,
    )


@router.post("/voice", response_model=VoiceAnalysisResponse)
async def evaluate_voice_risk(
    req: VoiceAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Analyzes a voice call (live Twilio call, audio upload, or demo transcript).
    """
    # 1. Transcribe
    if req.transcript and req.transcript.strip():
        transcript = req.transcript.strip()
    else:
        transcript = await stt_service.transcribe_audio(audio_base64=req.audio_base64)

    # 2. Classify
    classification = voice_classifier.classify(transcript)
    caller_hash = PrivacyService.hash_identifier(req.caller_phone or req.call_sid or "voice-demo")

    now = datetime.now(timezone.utc)
    v_event = VoiceEvent(
        call_sid=req.call_sid,
        caller_phone_hash=caller_hash,
        transcript=transcript,
        detected_patterns_json=json.dumps(classification["detected_patterns"]),
        risk_score=classification["risk_score"],
        confidence=classification["confidence"],
        consent_status="CONSENTED" if req.consent_given else "DECLINED",
    )
    db.add(v_event)

    r_event = RiskEvent(
        event_type="VOICE_CALL",
        source_id=v_event.id,
        risk_score=classification["risk_score"],
        risk_level=classification["risk_level"],
        reasons_json=json.dumps(classification["detected_patterns"]),
        explanation=classification["explanation"],
    )
    db.add(r_event)
    db.commit()
    db.refresh(v_event)

    try:
        RISK_PREDICTIONS_TOTAL.labels(event_type="voice", risk_level=classification["risk_level"]).inc()
        if classification["risk_level"] in ("HIGH", "CRITICAL"):
            HIGH_RISK_EVENTS_TOTAL.labels(category="voice").inc()
    except Exception:
        pass

    # Real-time broadcast
    await ws_manager.broadcast({
        "event_id": r_event.id,
        "event_type": "VOICE_SCAM_DETECTED",
        "risk_score": classification["risk_score"],
        "risk_level": classification["risk_level"],
        "detected_patterns": classification["detected_patterns"],
        "transcript_excerpt": classification["transcript_excerpt"],
        "confidence": classification["confidence"],
        "explanation": classification["explanation"],
        "timestamp": now.isoformat(),
    })

    return VoiceAnalysisResponse(
        voice_event_id=v_event.id,
        risk_score=classification["risk_score"],
        risk_level=classification["risk_level"],
        detected_patterns=classification["detected_patterns"],
        transcript_excerpt=classification["transcript_excerpt"],
        confidence=classification["confidence"],
        explanation=classification["explanation"],
        timestamp=now,
    )


@router.get("/history")
def get_risk_history(
    limit: int = Query(25, ge=1, le=100),
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns historical risk events with structured reasons and timestamps.
    """
    query = db.query(RiskEvent).order_by(RiskEvent.created_at.desc())
    if event_type:
        query = query.filter(RiskEvent.event_type == event_type.upper())

    events = query.limit(limit).all()

    result = []
    for e in events:
        reasons = []
        try:
            reasons = json.loads(e.reasons_json)
        except Exception:
            pass

        result.append({
            "id": e.id,
            "event_type": e.event_type,
            "source_id": e.source_id,
            "risk_score": e.risk_score,
            "risk_level": e.risk_level,
            "reasons": reasons,
            "explanation": e.explanation,
            "user_action": e.user_action,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        })

    return result
