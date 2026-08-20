from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.schemas.transaction import RiskReason


class RiskAggregator:
    """
    Hybrid Risk Aggregator fusing:
    1. Rule Engine score & heuristic triggers
    2. XGBoost ML model probability
    3. Context Engine multi-modal correlation score
    4. Anomaly detection thresholds
    """

    def aggregate(
        self,
        rule_score: int,
        rule_reasons: List[RiskReason],
        ml_score: int,
        ml_probability: float,
        context_score: int,
        context_reasons: List[RiskReason],
        features: Dict[str, float]
    ) -> Tuple[int, str, List[RiskReason], str]:
        # Hybrid baseline
        # When context signals are present, use 3-way fusion. When context is 0 (pure transaction evaluation),
        # prevent dilution by evaluating primary transaction signals (rules + ML)
        if context_score > 0:
            combined = (0.35 * rule_score) + (0.35 * ml_score) + (0.30 * context_score)
        else:
            combined = (0.50 * rule_score) + (0.50 * ml_score)

        # Critical Compound Boost:
        # If voice phishing is active and payment is to new recipient with high ratio
        voice_risk = float(features.get("voice_risk", 0))
        new_rec = bool(features.get("new_recipient", 0))
        ratio = float(features.get("amount_to_average_ratio", 1.0))
        amount = float(features.get("amount", 0.0))

        if voice_risk >= 80 and new_rec and (amount >= 15000 or ratio >= 2.5):
            # Bank impersonation / OTP call followed by large money transfer
            combined = max(combined, 94.0 + (voice_risk - 80) * 0.25)
        elif (rule_score >= 60 or ml_score >= 70) and context_score >= 40:
            combined = max(combined, combined + 15.0)
        elif new_rec and (ratio >= 4.0 or amount >= 40000):
            # Severe standalone transaction anomaly
            combined = max(combined, 65.0 + min(30.0, ratio * 1.5))

        # Normalize and cap
        final_score = int(round(min(100, max(0, combined))))

        # Determine Risk Level
        if final_score >= settings.RISK_THRESHOLD_HIGH:  # 80-100
            risk_level = "CRITICAL"
            recommended_action = "CANCEL_PAYMENT"
        elif final_score >= settings.RISK_THRESHOLD_MEDIUM:  # 60-79
            risk_level = "HIGH"
            recommended_action = "CANCEL_PAYMENT"
        elif final_score >= settings.RISK_THRESHOLD_LOW:  # 30-59
            risk_level = "MEDIUM"
            recommended_action = "VERIFY_RECIPIENT"
        else:  # 0-29
            risk_level = "LOW"
            recommended_action = "PROCEED"

        # Deduplicate & prioritize reasons
        all_reasons: List[RiskReason] = []
        seen_factors = set()

        # Context reasons first (they carry temporal urgency)
        for r in context_reasons + rule_reasons:
            if r.factor not in seen_factors:
                seen_factors.add(r.factor)
                all_reasons.append(r)

        # Sort by impact priority (critical -> high -> medium -> low)
        impact_weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        all_reasons.sort(key=lambda x: impact_weights.get(x.impact.lower(), 0), reverse=True)

        return final_score, risk_level, all_reasons, recommended_action


risk_aggregator = RiskAggregator()
