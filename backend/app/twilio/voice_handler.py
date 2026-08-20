from typing import Optional
from fastapi import Response
from app.core.config import settings


class TwilioVoiceHandler:
    @staticmethod
    def generate_incoming_call_twiml(media_stream_url: Optional[str] = None) -> Response:
        """
        Generates compliant TwiML for incoming demo calls.
        Plays explicit recording disclosure before attaching media stream.
        """
        stream_target = media_stream_url
        if not stream_target:
            base = settings.TWILIO_WEBHOOK_BASE_URL.replace("http://", "ws://").replace("https://", "wss://")
            stream_target = f"{base}/twilio/media-stream"

        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="en-IN">
        Security notice: This call is being analyzed in real-time by Fraud Shield for fraud prevention demonstration.
    </Say>
    <Connect>
        <Stream url="{stream_target}">
            <Parameter name="app" value="fraud-shield" />
        </Stream>
    </Connect>
    <Pause length="40"/>
    <Say>Thank you. The fraud prevention demonstration session has ended.</Say>
</Response>
"""
        return Response(content=twiml, media_type="application/xml")


twilio_voice_handler = TwilioVoiceHandler()
