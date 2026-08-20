import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey
)
from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="USER")  # "USER" | "ADMIN"
    phone_hash = Column(String(64), index=True, nullable=True)
    upi_handle_hash = Column(String(64), index=True, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    recipient_hash = Column(String(64), nullable=False, index=True)
    recipient_masked = Column(String(100), nullable=False)
    new_recipient = Column(Boolean, default=False)
    transaction_time = Column(DateTime, default=get_utc_now)
    status = Column(String(30), default="COMPLETED")  # COMPLETED, BLOCKED, CANCELLED, FLAGGED
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    reasons_json = Column(Text, default="[]")
    payment_method = Column(String(50), default="UPI Demo")
    created_at = Column(DateTime, default=get_utc_now)


class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(50), nullable=False)  # TRANSACTION, VOICE_CALL, MESSAGE, CORRELATED
    source_id = Column(String(36), nullable=True)
    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(20), nullable=False)
    reasons_json = Column(Text, default="[]")
    explanation = Column(Text, nullable=True)
    composite_factors_json = Column(Text, default="{}")
    user_action = Column(String(30), nullable=True)  # PROCEEDED, CANCELLED, REPORTED_FRAUD, FALSE_POSITIVE
    created_at = Column(DateTime, default=get_utc_now, index=True)


class VoiceEvent(Base):
    __tablename__ = "voice_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    call_sid = Column(String(100), nullable=True, index=True)
    caller_phone_hash = Column(String(64), nullable=True)
    duration_seconds = Column(Integer, default=0)
    transcript = Column(Text, nullable=False)
    detected_patterns_json = Column(Text, default="[]")
    risk_score = Column(Integer, default=0)
    confidence = Column(Float, default=0.0)
    consent_status = Column(String(30), default="DEMO")  # CONSENTED, DECLINED, DEMO
    created_at = Column(DateTime, default=get_utc_now, index=True)


class MessageEvent(Base):
    __tablename__ = "message_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sender_hash = Column(String(64), nullable=True)
    message_text = Column(Text, nullable=False)
    detected_patterns_json = Column(Text, default="[]")
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="LOW")
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True)


class DeviceContext(Base):
    __tablename__ = "device_context"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    device_fingerprint_hash = Column(String(64), nullable=False)
    ip_hash = Column(String(64), nullable=True)
    location_tag = Column(String(100), default="Known Region")
    is_known_device = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=get_utc_now)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    risk_event_id = Column(String(36), nullable=True, index=True)
    transaction_id = Column(String(36), nullable=True, index=True)
    prediction_risk_level = Column(String(20), nullable=False)
    prediction_risk_score = Column(Integer, nullable=False)
    actual_feedback = Column(String(30), nullable=False)  # CONFIRMED_FRAUD, FALSE_POSITIVE
    user_comments = Column(Text, nullable=True)
    model_version = Column(String(50), default="v1.0-xgb-upi")
    features_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True)


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    version_name = Column(String(50), unique=True, nullable=False)
    algorithm = Column(String(50), default="XGBoost")
    accuracy = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    trained_at = Column(DateTime, default=get_utc_now)
    is_active = Column(Boolean, default=True)
    metadata_json = Column(Text, default="{}")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action = Column(String(50), nullable=False)  # DATA_DELETION, FEEDBACK_SUBMITTED, RETENTION_PURGE
    actor_id = Column(String(50), default="system")
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=get_utc_now)
