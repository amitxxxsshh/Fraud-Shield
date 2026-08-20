import os
import time
import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np

logger = logging.getLogger(__name__)

# Try importing joblib
try:
    import joblib
except ImportError:
    joblib = None

from app.core.config import settings
from app.risk_engine.feature_engineering import FeatureEngineering
from app.core.metrics import MODEL_PREDICTION_LATENCY_SECONDS


class MLPredictor:
    """
    ML Predictor wrapping the trained XGBoost UPI Fraud Classifier.
    Includes deterministic fallback logic for 100% hackathon reliability.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.MODEL_PATH
        self.model = None
        self.model_version = settings.MODEL_VERSION
        self._load_model()

    def _load_model(self):
        if not joblib:
            logger.warning("Joblib not installed. Using fallback predictor.")
            return

        resolved_path = self.model_path
        if not os.path.exists(resolved_path):
            # Try alternate relative paths
            alternatives = [
                os.path.join(os.path.dirname(__file__), "../../../ml/models/xgboost_fraud_model.joblib"),
                "ml/models/xgboost_fraud_model.joblib",
                "../ml/models/xgboost_fraud_model.joblib",
            ]
            for alt in alternatives:
                if os.path.exists(alt):
                    resolved_path = alt
                    break

        if os.path.exists(resolved_path):
            try:
                self.model = joblib.load(resolved_path)
                logger.info(f"Loaded XGBoost model from {resolved_path}")
            except Exception as e:
                logger.error(f"Failed to load XGBoost model from {resolved_path}: {e}")
                self.model = None
        else:
            logger.warning(f"Model file not found at {resolved_path}. Fallback predictor active.")

    def predict_probability(self, features: Dict[str, float]) -> Tuple[float, int]:
        """
        Returns (fraud_probability: float 0.0-1.0, ml_risk_score: int 0-100).
        """
        start_time = time.time()
        fraud_prob = 0.0

        if self.model is not None:
            try:
                vec = FeatureEngineering.to_vector(features)
                probs = self.model.predict_proba(vec)
                # Class 1 is fraud
                fraud_prob = float(probs[0][1])
            except Exception as e:
                logger.error(f"Model inference error: {e}. Switching to heuristic fallback.")
                fraud_prob = self._heuristic_fallback(features)
        else:
            fraud_prob = self._heuristic_fallback(features)

        latency = time.time() - start_time
        try:
            MODEL_PREDICTION_LATENCY_SECONDS.labels(model_version=self.model_version).observe(latency)
        except Exception:
            pass

        ml_score = int(round(fraud_prob * 100))
        ml_score = min(100, max(0, ml_score))
        return fraud_prob, ml_score

    def _heuristic_fallback(self, f: Dict[str, float]) -> float:
        """
        Calibrated mathematical fallback if ML model artifact is unavailable.
        """
        z = -3.5  # Base log-odds for low fraud rate

        # Feature contributions
        z += 1.8 * float(f.get("new_recipient", 0))
        z += 0.45 * max(0.0, float(f.get("amount_to_average_ratio", 1.0)) - 1.0)
        z += 0.035 * float(f.get("voice_risk", 0))
        z += 0.030 * float(f.get("message_risk", 0))
        z += 0.8 * float(f.get("device_changed", 0))
        z += 1.2 * float(f.get("location_anomaly", 0))
        z += 0.9 * float(f.get("recent_suspicious_call", 0))

        # Sigmoid
        prob = 1.0 / (1.0 + np.exp(-z))
        return float(prob)


ml_predictor = MLPredictor()
