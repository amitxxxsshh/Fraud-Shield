from typing import Dict, Any, List, Tuple
from app.schemas.transaction import RiskReason


class RuleEngine:
    """
    Deterministic heuristic risk evaluation engine for UPI transactions.
    Calculates rule-based score and detailed explainable reasons.
    """

    def evaluate(self, req_data: Dict[str, Any], features: Dict[str, float]) -> Tuple[int, List[RiskReason]]:
        score = 0
        reasons: List[RiskReason] = []

        amount = features.get("amount", 0.0)
        ratio = features.get("amount_to_average_ratio", 1.0)
        new_rec = bool(features.get("new_recipient", 0.0))
        voice_risk = features.get("voice_risk", 0.0)
        message_risk = features.get("message_risk", 0.0)
        hour = features.get("hour_of_day", 12.0)
        device_changed = bool(features.get("device_changed", 0.0))
        location_anomaly = bool(features.get("location_anomaly", 0.0))
        velocity = features.get("transaction_velocity", 0.0)

        # 1. New Recipient Rule
        if new_rec:
            score += 20
            reasons.append(RiskReason(
                factor="new_recipient",
                impact="high" if ratio > 2.0 else "medium",
                description="Recipient has not been paid previously.",
                weight=20
            ))

        # 2. Amount Anomaly Rule
        if ratio >= 4.0:
            score += 25
            reasons.append(RiskReason(
                factor="amount_anomaly",
                impact="high",
                description=f"Transaction amount (₹{amount:,.0f}) is {ratio:.1f}x above your typical average payment.",
                weight=25
            ))
        elif ratio >= 2.5:
            score += 20
            reasons.append(RiskReason(
                factor="amount_anomaly",
                impact="medium",
                description=f"Transaction amount (₹{amount:,.0f}) is {ratio:.1f}x higher than usual.",
                weight=20
            ))
        elif ratio >= 1.5:
            score += 10
            reasons.append(RiskReason(
                factor="amount_anomaly",
                impact="low",
                description=f"Transaction amount is moderately above typical average ({ratio:.1f}x).",
                weight=10
            ))

        # 3. High Value to New Recipient Compound Rule
        if new_rec and amount >= 25000:
            score += 20
            reasons.append(RiskReason(
                factor="high_value_new_recipient",
                impact="high",
                description="High-value transfer directed to an unverified recipient.",
                weight=20
            ))

        # 4. Recent Voice Phishing Risk
        if voice_risk >= 80:
            score += 30
            reasons.append(RiskReason(
                factor="voice_phishing",
                impact="critical",
                description=f"Critical voice call risk detected shortly before this transaction (Voice Risk: {int(voice_risk)}/100).",
                weight=30
            ))
        elif voice_risk >= 50:
            score += 20
            reasons.append(RiskReason(
                factor="voice_phishing",
                impact="high",
                description=f"Suspicious phone conversation detected recently (Voice Risk: {int(voice_risk)}/100).",
                weight=20
            ))

        # 5. Recent Suspicious Message Risk
        if message_risk >= 70:
            score += 25
            reasons.append(RiskReason(
                factor="message_scam",
                impact="high",
                description=f"Recent scam message / phishing link detected (Message Risk: {int(message_risk)}/100).",
                weight=25
            ))
        elif message_risk >= 40:
            score += 15
            reasons.append(RiskReason(
                factor="message_scam",
                impact="medium",
                description=f"Suspicious SMS/message received recently (Message Risk: {int(message_risk)}/100).",
                weight=15
            ))

        # 6. Unusual Time Rule (00:00 - 05:00)
        if 0 <= hour < 5:
            score += 10
            reasons.append(RiskReason(
                factor="unusual_time",
                impact="low",
                description="Transaction initiated during unusual late-night hours.",
                weight=10
            ))

        # 7. Device & Location Anomaly
        if location_anomaly:
            score += 20
            reasons.append(RiskReason(
                factor="location_anomaly",
                impact="high",
                description="Payment initiated from an unrecognized geographic location.",
                weight=20
            ))
        elif device_changed:
            score += 15
            reasons.append(RiskReason(
                factor="device_anomaly",
                impact="medium",
                description="Transaction initiated from an unrecognized or altered device.",
                weight=15
            ))

        # 8. Velocity Burst
        if velocity > 0.5:  # > 12 transactions per day
            score += 15
            reasons.append(RiskReason(
                factor="velocity_burst",
                impact="medium",
                description="Abnormally rapid succession of payment attempts detected.",
                weight=15
            ))

        # Normalize and clamp score to 0-100
        normalized_score = min(100, max(0, score))
        return normalized_score, reasons
