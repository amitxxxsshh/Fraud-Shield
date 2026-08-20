import logging
from fastapi import APIRouter, Request, Response, WebSocket
from app.twilio.voice_handler import twilio_voice_handler
from app.twilio.stream_handler import handle_twilio_media_stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/twilio", tags=["Twilio Voice & Media Streams"])


@router.post("/voice/incoming")
async def incoming_voice_call(request: Request) -> Response:
    """
    Twilio Webhook for incoming demo calls.
    Returns compliant TwiML that:
    1. Plays disclosure: 'Security notice: This call is being analyzed in real-time by Fraud Shield...'
    2. Opens a bidirectional Twilio Media Stream to our WebSocket endpoint.
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "unknown")
    caller = form_data.get("From", "unknown")
    logger.info(f"Incoming Twilio call received: CallSid={call_sid}, Caller={caller}")

    return twilio_voice_handler.generate_incoming_call_twiml()


@router.post("/voice/status")
async def call_status_callback(request: Request) -> Response:
    """
    Twilio Call Status Callback handler.
    """
    form_data = await request.form()
    call_sid = form_data.get("CallSid", "unknown")
    call_status = form_data.get("CallStatus", "unknown")
    logger.info(f"Twilio call status update: CallSid={call_sid}, Status={call_status}")
    return Response(content="<Response/>", media_type="application/xml")


@router.websocket("/media-stream")
async def media_stream_websocket(websocket: WebSocket):
    """
    Twilio Media Stream WebSocket endpoint receiving live audio packets.
    """
    await handle_twilio_media_stream(websocket)
