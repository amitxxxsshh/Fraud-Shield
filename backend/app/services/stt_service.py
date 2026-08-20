import os
import io
import base64
import logging
from typing import Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class STTService:
    """
    Speech-To-Text Service supporting:
    1. OpenAI Whisper API (when OPENAI_API_KEY is configured)
    2. Local/Mock transcript fallback library for 100% demo reliability
    """

    DEMO_TRANSCRIPTS = {
        "bank_scam": (
            "I am calling from your bank security division. Your account has been compromised. "
            "You need to transfer 25000 rupees immediately to verify and secure your account. "
            "Please give me the OTP sent to your phone to proceed."
        ),
        "refund_scam": (
            "Hello sir, I am calling from UPI payment support. A refund of 4500 rupees has been initiated "
            "for your cancelled order. Please open your payment app and approve the request immediately."
        ),
        "electricity_scam": (
            "Dear consumer, this is an urgent notification from the electricity board. "
            "Your power supply will be disconnected tonight at 9 PM due to pending bill update. "
            "Pay 3500 rupees immediately to prevent disconnection."
        ),
        "kyc_scam": (
            "Your bank account KYC has expired. Your net banking will be permanently blocked. "
            "Install our QuickSupport verification app and share your UPI PIN to update Aadhaar."
        ),
        "normal_call": (
            "Hey Rahul, are you coming to the office today? Let's catch up for lunch around 1 PM."
        ),
    }

    @classmethod
    async def transcribe_audio(
        cls,
        audio_bytes: Optional[bytes] = None,
        audio_base64: Optional[str] = None,
        scenario_hint: Optional[str] = None
    ) -> str:
        # If raw base64 is provided, decode it
        if audio_base64 and not audio_bytes:
            try:
                # Strip data url prefix if present
                if "," in audio_base64:
                    audio_base64 = audio_base64.split(",", 1)[1]
                audio_bytes = base64.b64decode(audio_base64)
            except Exception as e:
                logger.error(f"Error decoding base64 audio: {e}")

        # Attempt OpenAI Whisper if API key is present and audio is available
        if settings.OPENAI_API_KEY and audio_bytes and len(audio_bytes) > 500:
            try:
                transcript = await cls._whisper_api_transcribe(audio_bytes)
                if transcript and transcript.strip():
                    return transcript
            except Exception as e:
                logger.warning(f"Whisper transcription failed: {e}. Falling back to demo transcript.")

        # Fallback to realistic demo transcript
        if scenario_hint and scenario_hint in cls.DEMO_TRANSCRIPTS:
            return cls.DEMO_TRANSCRIPTS[scenario_hint]

        return cls.DEMO_TRANSCRIPTS["bank_scam"]

    @classmethod
    async def _whisper_api_transcribe(cls, audio_bytes: bytes) -> Optional[str]:
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        }
        files = {
            "file": ("audio.wav", io.BytesIO(audio_bytes), "audio/wav"),
            "model": (None, "whisper-1"),
            "language": (None, "en"),
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                files=files
            )
            if resp.status_code == 200:
                return resp.json().get("text", "")
            else:
                logger.warning(f"Whisper API error {resp.status_code}: {resp.text}")
                return None


stt_service = STTService()
