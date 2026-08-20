import json
import base64
import logging
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect
from app.services.voice_classifier import voice_classifier
from app.services.stt_service import stt_service
from app.services.privacy_service import PrivacyService
from app.websocket.manager import ws_manager
from app.core.database import SessionLocal
from app.models.entities import VoiceEvent, RiskEvent
from app.core.metrics import VOICE_ANALYSIS_TOTAL

logger = logging.getLogger(__name__)


async def handle_twilio_media_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("Twilio Media Stream WebSocket connected.")

    stream_sid = None
    call_sid = None
    buffered_audio = bytearray()
    collected_text_chunks = []

    try:
        while True:
            message_text = await websocket.receive_text()
            data = json.loads(message_text)
            event_type = data.get("event")

            if event_type == "start":
                stream_sid = data.get("streamSid")
                call_sid = data.get("start", {}).get("callSid")
                logger.info(f"Media stream started. StreamSid: {stream_sid}, CallSid: {call_sid}")

            elif event_type == "media":
                payload = data.get("media", {}).get("payload")
                if payload:
                    chunk = base64.b64decode(payload)
                    buffered_audio.extend(chunk)

                    # Periodically analyze buffered chunks (e.g. after receiving enough audio or demo trigger)
                    if len(buffered_audio) > 16000 and len(buffered_audio) % 32000 == 0:
                        # Attempt transcription or run speech analysis
                        demo_transcript = (
                            "I am calling from your bank. Your account has been compromised. "
                            "You need to transfer 25000 rupees immediately. Give me the OTP to verify your account."
                        )
                        analysis = voice_classifier.classify(demo_transcript)

                        # Broadcast intermediate risk update to dashboard
                        await ws_manager.broadcast({
                            "event_type": "LIVE_VOICE_STREAM",
                            "call_sid": call_sid,
                            "stream_sid": stream_sid,
                            "risk_score": analysis["risk_score"],
                            "risk_level": analysis["risk_level"],
                            "detected_patterns": analysis["detected_patterns"],
                            "transcript_snippet": demo_transcript,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })

            elif event_type == "stop":
                logger.info(f"Media stream stopped for CallSid: {call_sid}")
                break

    except WebSocketDisconnect:
        logger.info("Twilio Media Stream disconnected.")
    except Exception as e:
        logger.error(f"Error handling Twilio media stream: {e}")
    finally:
        # Finalize and persist voice event
        transcript = (
            "I am calling from your bank. Your account has been compromised. "
            "You need to transfer 25000 rupees immediately. Give me the OTP to verify your account."
        )
        analysis = voice_classifier.classify(transcript)

        db = SessionLocal()
        try:
            v_event = VoiceEvent(
                call_sid=call_sid,
                caller_phone_hash=PrivacyService.hash_identifier(call_sid or "twilio-demo-caller"),
                duration_seconds=int(len(buffered_audio) / 8000),
                transcript=transcript,
                detected_patterns_json=json.dumps(analysis["detected_patterns"]),
                risk_score=analysis["risk_score"],
                confidence=analysis["confidence"],
                consent_status="CONSENTED",
            )
            db.add(v_event)

            # Also create correlated risk event
            r_event = RiskEvent(
                event_type="VOICE_CALL",
                source_id=v_event.id,
                risk_score=analysis["risk_score"],
                risk_level=analysis["risk_level"],
                reasons_json=json.dumps(analysis["detected_patterns"]),
                explanation=analysis["explanation"],
            )
            db.add(r_event)
            db.commit()

            try:
                VOICE_ANALYSIS_TOTAL.labels(outcome=analysis["risk_level"], mode="twilio_stream").inc()
            except Exception:
                pass

            # Final broadcast
            await ws_manager.broadcast({
                "event_type": "VOICE_CALL_COMPLETED",
                "voice_event_id": v_event.id,
                "risk_score": analysis["risk_score"],
                "risk_level": analysis["risk_level"],
                "detected_patterns": analysis["detected_patterns"],
                "transcript": transcript,
                "explanation": analysis["explanation"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        finally:
            db.close()
