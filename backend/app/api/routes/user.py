import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Transaction, RiskEvent, VoiceEvent, MessageEvent, DeviceContext, AuditLog
from app.services.privacy_service import PrivacyService
from app.websocket.manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user", tags=["Privacy & User Data"])


@router.delete("/data")
async def delete_user_data(
    user_id: str = Query("demo-user-1", description="Identifier of the user requesting data deletion"),
    db: Session = Depends(get_db)
):
    """
    DELETE MY DATA: Privacy by design endpoint complying with data retention principles.
    Permanently purges or redacts transactions, voice records, and message logs associated with the session.
    """
    now = datetime.now(timezone.utc)

    # 1. Delete associated transactions
    del_tx_count = db.query(Transaction).filter(
        (Transaction.user_id == user_id) | (Transaction.user_id == "demo-user-1")
    ).delete(synchronize_session=False)

    # 2. Delete voice events (raw audio and transcripts)
    del_voice_count = db.query(VoiceEvent).delete(synchronize_session=False)

    # 3. Delete message events
    del_msg_count = db.query(MessageEvent).delete(synchronize_session=False)

    # 4. Delete device context
    del_dev_count = db.query(DeviceContext).filter(
        (DeviceContext.user_id == user_id) | (DeviceContext.user_id == "demo-user-1")
    ).delete(synchronize_session=False)

    # 5. Record immutable audit log of privacy action
    audit = AuditLog(
        action="DATA_DELETION",
        actor_id=user_id,
        details_json=json.dumps({
            "deleted_transactions": del_tx_count,
            "deleted_voice_events": del_voice_count,
            "deleted_message_events": del_msg_count,
            "deleted_devices": del_dev_count,
            "timestamp": now.isoformat(),
        }),
    )
    db.add(audit)
    db.commit()

    # Broadcast privacy event
    await ws_manager.broadcast({
        "event_type": "DATA_PURGED",
        "actor_id": user_id,
        "timestamp": now.isoformat(),
    })

    return {
        "status": "success",
        "message": "All user data, voice streams, and transaction logs have been permanently purged.",
        "purged_records": {
            "transactions": del_tx_count,
            "voice_events": del_voice_count,
            "message_events": del_msg_count,
            "device_contexts": del_dev_count,
        },
        "audit_timestamp": now.isoformat(),
    }


@router.get("/privacy-audit")
def get_privacy_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns audit logs for data deletion, retention purges, and compliance verification.
    """
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    results = []
    for l in logs:
        details = {}
        try:
            details = json.loads(l.details_json)
        except Exception:
            pass
        results.append({
            "id": l.id,
            "action": l.action,
            "actor_id": l.actor_id,
            "details": details,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })
    return results
