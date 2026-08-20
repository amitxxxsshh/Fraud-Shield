import re
from typing import Dict, Any, List, Tuple


class VoiceSocialEngineeringClassifier:
    """
    Social Engineering & Vishing Pattern Classifier.
    Analyzes live speech transcripts or uploaded audio transcripts for scam vectors.
    """

    PATTERNS: Dict[str, Dict[str, Any]] = {
        "bank_impersonation": {
            "weight": 25,
            "regex": r"\b(bank|account department|security team|fraud division|branch manager|reserve bank|rbi|sbi|hdfc|icici|axis|kotak|pnb)\b",
            "label": "Bank Impersonation",
        },
        "police_impersonation": {
            "weight": 30,
            "regex": r"\b(police|cbi|trai|customs|cyber crime|cyber cell|arrest warrant|digital arrest|court order|dsp|inspector)\b",
            "label": "Law Enforcement / Digital Arrest Impersonation",
        },
        "government_impersonation": {
            "weight": 25,
            "regex": r"\b(income tax|department of telecom|dot|aadhaar department|npci|government portal|uidai)\b",
            "label": "Government Agency Impersonation",
        },
        "otp_request": {
            "weight": 35,
            "regex": r"\b(otp|one[- ]time password|verification code|6[- ]digit code|4[- ]digit code|digits sent|sms code|read the code)\b",
            "label": "OTP / Verification Code Request",
        },
        "upi_pin_request": {
            "weight": 35,
            "regex": r"\b(upi pin|mpin|security pin|enter your pin|type the pin|approve the pin)\b",
            "label": "UPI PIN Request",
        },
        "password_request": {
            "weight": 30,
            "regex": r"\b(password|net banking password|login credential|secret question)\b",
            "label": "Password / Credential Request",
        },
        "urgent_financial_request": {
            "weight": 20,
            "regex": r"\b(immediately|urgent|right now|within \d+ minutes|before account closes|without delay|emergency)\b",
            "label": "Urgency & Coercion",
        },
        "account_block_threat": {
            "weight": 25,
            "regex": r"\b(account.*(blocked|suspended|frozen|deactivated|compromised|hacked)|freeze your account|stop all services)\b",
            "label": "Account Suspension / Block Threat",
        },
        "refund_scam": {
            "weight": 25,
            "regex": r"\b(refund|cashback|overpaid|reversal|claim reward|credited by mistake|bonus money)\b",
            "label": "Refund / Cashback Lure",
        },
        "kyc_scam": {
            "weight": 25,
            "regex": r"\b(kyc (update|expired|mandatory|verification)|submit pan|aadhaar linking|update kyc)\b",
            "label": "KYC Verification Trap",
        },
        "screen_sharing_request": {
            "weight": 30,
            "regex": r"\b(anydesk|teamviewer|rustdesk|quicksupport|screen share|install this app|download apk)\b",
            "label": "Remote Access / Screen Sharing Request",
        },
        "financial_transfer_request": {
            "weight": 25,
            "regex": r"\b(transfer|send money|pay|deposit|rupees|amount|upi transfer|pay ₹?\d+)\b",
            "label": "Direct Money Transfer Request",
        },
    }

    def classify(self, transcript: str) -> Dict[str, Any]:
        if not transcript or not transcript.strip():
            return {
                "risk_score": 0,
                "risk_level": "LOW",
                "detected_patterns": [],
                "transcript_excerpt": [],
                "confidence": 0.0,
                "explanation": "No voice transcript or pattern detected."
            }

        text = transcript.lower()
        detected_patterns = []
        raw_score = 0
        excerpts = []

        # Find matching sentences
        sentences = re.split(r"[.!?\n]+", transcript)
        matching_sentences = set()

        for pattern_key, meta in self.PATTERNS.items():
            if re.search(meta["regex"], text, re.IGNORECASE):
                detected_patterns.append(pattern_key)
                raw_score += meta["weight"]

                # Extract matching sentence excerpt
                for sent in sentences:
                    if re.search(meta["regex"], sent, re.IGNORECASE) and sent.strip():
                        matching_sentences.add(sent.strip())

        # Calculate confidence based on pattern density
        confidence = min(0.98, max(0.40, len(detected_patterns) * 0.22)) if detected_patterns else 0.0

        # Normalization
        # If both bank impersonation + OTP request or urgency are present, escalate score
        if "bank_impersonation" in detected_patterns and ("otp_request" in detected_patterns or "financial_transfer_request" in detected_patterns):
            raw_score = max(raw_score, 90)

        risk_score = min(100, max(0, raw_score))

        if risk_score >= 80:
            risk_level = "CRITICAL"
        elif risk_score >= 60:
            risk_level = "HIGH"
        elif risk_score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Generate explanation
        if detected_patterns:
            pattern_labels = [self.PATTERNS[p]["label"] for p in detected_patterns]
            explanation = f"Detected social engineering indicators: {', '.join(pattern_labels)}."
        else:
            explanation = "Conversation does not exhibit known voice phishing signatures."

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "detected_patterns": detected_patterns,
            "transcript_excerpt": list(matching_sentences)[:5],
            "confidence": round(confidence, 2),
            "explanation": explanation
        }


voice_classifier = VoiceSocialEngineeringClassifier()
