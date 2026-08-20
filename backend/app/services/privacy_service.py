import hashlib
import hmac
import re
from typing import Optional
from app.core.config import settings


class PrivacyService:
    @staticmethod
    def hash_identifier(raw_value: Optional[str]) -> str:
        """
        Creates a deterministic salted HMAC SHA-256 hash of a sensitive string
        (UPI handle, phone number, device fingerprint, IP address).
        """
        if not raw_value:
            return ""
        normalized = raw_value.strip().lower()
        secret_bytes = settings.PRIVACY_HASH_SALT.encode("utf-8")
        h = hmac.new(secret_bytes, normalized.encode("utf-8"), hashlib.sha256)
        return h.hexdigest()

    @staticmethod
    def mask_identifier(raw_value: Optional[str]) -> str:
        """
        Masks UPI ID or phone number for safe display in UI/logs without exposing raw identity.
        Examples:
        - "rahul@upi" -> "ra***@upi"
        - "9876543210" -> "+91 98****3210"
        - "john.doe@okaxis" -> "jo***@okaxis"
        """
        if not raw_value:
            return "unknown@recipient"

        raw = raw_value.strip()

        # UPI Handle (contains @)
        if "@" in raw:
            parts = raw.split("@", 1)
            handle, vpa = parts[0], parts[1]
            if len(handle) <= 2:
                masked_handle = handle[0] + "***"
            else:
                masked_handle = handle[:2] + "***"
            return f"{masked_handle}@{vpa}"

        # Phone number (digits)
        digits = re.sub(r"\D", "", raw)
        if len(digits) >= 10:
            return f"***-***-{digits[-4:]}"

        # Generic string
        if len(raw) <= 3:
            return "***"
        return raw[:2] + "***" + raw[-1:]

    @staticmethod
    def sanitize_log_text(text: str) -> str:
        """
        Removes sensitive patterns like 4-6 digit OTPs, PINs, card numbers, or passwords from logs.
        """
        if not text:
            return ""
        # Mask 4-6 digit standalone numbers (potential OTPs or UPI PINs)
        sanitized = re.sub(r"\b\d{4,6}\b", "[REDACTED_OTP_OR_PIN]", text)
        # Mask card numbers (16 digits)
        sanitized = re.sub(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b", "[REDACTED_CARD]", sanitized)
        return sanitized
