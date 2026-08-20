import logging
from typing import List, Optional
import httpx
from app.core.config import settings
from app.schemas.transaction import RiskReason

logger = logging.getLogger(__name__)


class ExplanationBuilder:
    """
    Generates explainable natural-language warnings for end users.
    Uses OpenAI API when configured with strict guardrails, otherwise uses deterministic templates.
    """

    SYSTEM_PROMPT = (
        "You are an explanation layer for Fraud Shield. "
        "Use ONLY the supplied structured risk factors. "
        "Do not create new evidence. "
        "Do not claim certainty. "
        "Do not say the transaction is definitely fraud. "
        "Explain clearly and calmly in 2-3 sentences why the system considers this transaction high risk, "
        "and advise the user on safe verification steps."
    )

    @classmethod
    async def build_explanation(
        cls,
        risk_score: int,
        risk_level: str,
        reasons: List[RiskReason],
        amount: float,
        recipient_masked: str
    ) -> str:
        # If OpenAI key is available, call OpenAI API
        if settings.OPENAI_API_KEY:
            try:
                explanation = await cls._generate_openai_explanation(
                    risk_score, risk_level, reasons, amount, recipient_masked
                )
                if explanation:
                    return explanation
            except Exception as e:
                logger.warning(f"OpenAI explanation failed: {e}. Falling back to deterministic template.")

        # Deterministic fallback
        return cls._generate_deterministic_explanation(risk_score, risk_level, reasons, amount, recipient_masked)

    @classmethod
    async def _generate_openai_explanation(
        cls,
        risk_score: int,
        risk_level: str,
        reasons: List[RiskReason],
        amount: float,
        recipient_masked: str
    ) -> Optional[str]:
        factors_summary = "\n".join([f"- {r.factor} ({r.impact} impact): {r.description}" for r in reasons])
        user_prompt = (
            f"Transaction Details:\n"
            f"- Amount: ₹{amount:,.0f}\n"
            f"- Recipient: {recipient_masked}\n"
            f"- Overall Risk Score: {risk_score}/100 ({risk_level})\n"
            f"- Structured Risk Factors:\n{factors_summary}\n\n"
            f"Generate a concise, explainable warning."
        )

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": cls.SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 150,
        }

        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                logger.warning(f"OpenAI API returned status {resp.status_code}: {resp.text}")
                return None

    @classmethod
    def _generate_deterministic_explanation(
        cls,
        risk_score: int,
        risk_level: str,
        reasons: List[RiskReason],
        amount: float,
        recipient_masked: str
    ) -> str:
        if risk_level == "LOW":
            return f"Payment of ₹{amount:,.0f} to {recipient_masked} aligns with your typical transaction profile."

        # High / Critical / Medium risk templates
        high_impact = [r.description for r in reasons if r.impact in ("high", "critical")]
        if not high_impact:
            high_impact = [r.description for r in reasons]

        key_points = "; ".join(high_impact[:3])

        if risk_level == "CRITICAL":
            return (
                f"CRITICAL WARNING: This ₹{amount:,.0f} payment to {recipient_masked} triggered critical fraud indicators "
                f"({key_points}). Legitimate banks and government officials will never demand immediate money transfers or OTPs over a call."
            )
        elif risk_level == "HIGH":
            return (
                f"HIGH RISK DETECTED: This payment of ₹{amount:,.0f} differs significantly from normal activity ({key_points}). "
                f"We strongly recommend verifying the recipient's identity before completing the transfer."
            )
        else:  # MEDIUM
            return (
                f"NOTICE: Moderate risk detected for ₹{amount:,.0f} to {recipient_masked} due to: {key_points}. "
                f"Please review recipient details."
            )
