from datetime import datetime, timezone
from typing import Dict, Any, List
import numpy as np


class FeatureEngineering:
    FEATURE_NAMES: List[str] = [
        "amount",
        "amount_to_average_ratio",
        "new_recipient",
        "recipient_transaction_count",
        "transaction_velocity",
        "hour_of_day",
        "day_of_week",
        "historical_average",
        "historical_std",
        "recent_suspicious_call",
        "recent_suspicious_message",
        "device_changed",
        "location_anomaly",
        "voice_risk",
        "message_risk",
    ]

    @classmethod
    def extract_features(cls, req_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Extracts standardized numerical features from raw transaction request data.
        """
        amount = float(req_data.get("amount", 0.0))
        user_avg = float(req_data.get("user_average_amount", 3000.0))
        if user_avg <= 0:
            user_avg = 3000.0

        amount_ratio = round(amount / user_avg, 2)
        new_rec = 1.0 if req_data.get("new_recipient", False) else 0.0
        rec_count = 0.0 if new_rec else float(req_data.get("recipient_transaction_count", 8.0))
        frequency = float(req_data.get("transaction_frequency", 2))
        velocity = frequency / 24.0

        tx_time = req_data.get("transaction_time")
        if isinstance(tx_time, str):
            try:
                dt = datetime.fromisoformat(tx_time.replace("Z", "+00:00"))
            except Exception:
                dt = datetime.now(timezone.utc)
        elif isinstance(dt := tx_time, datetime):
            pass
        else:
            dt = datetime.now(timezone.utc)

        hour = float(dt.hour)
        day_of_week = float(dt.weekday())
        hist_std = float(user_avg * 0.45)

        voice_risk = float(req_data.get("recent_voice_risk", 0))
        message_risk = float(req_data.get("recent_message_risk", 0))
        device_risk = float(req_data.get("device_risk", 0))

        suspicious_call = 1.0 if voice_risk >= 50.0 else 0.0
        suspicious_msg = 1.0 if message_risk >= 50.0 else 0.0
        dev_changed = 1.0 if device_risk >= 40.0 else 0.0
        loc_anomaly = 1.0 if device_risk >= 70.0 else 0.0

        return {
            "amount": amount,
            "amount_to_average_ratio": amount_ratio,
            "new_recipient": new_rec,
            "recipient_transaction_count": rec_count,
            "transaction_velocity": velocity,
            "hour_of_day": hour,
            "day_of_week": day_of_week,
            "historical_average": user_avg,
            "historical_std": hist_std,
            "recent_suspicious_call": suspicious_call,
            "recent_suspicious_message": suspicious_msg,
            "device_changed": dev_changed,
            "location_anomaly": loc_anomaly,
            "voice_risk": voice_risk,
            "message_risk": message_risk,
        }

    @classmethod
    def to_vector(cls, features: Dict[str, float]) -> np.ndarray:
        """Converts feature dictionary to 2D numpy array in correct column order."""
        vec = [features.get(k, 0.0) for k in cls.FEATURE_NAMES]
        return np.array([vec], dtype=np.float32)
