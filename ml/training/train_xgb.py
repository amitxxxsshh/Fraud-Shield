"""
XGBoost Model Training Script for Fraud Shield
----------------------------------------------
Trains a high-performance gradient-boosted decision tree on synthetic UPI transaction data.
Exports model artifact and metadata including feature importance and ROC-AUC.
"""

import os
import sys
import json
from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from generate_data import generate_synthetic_upi_dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
import xgboost as xgb

from generate_data import generate_synthetic_upi_dataset

FEATURE_COLS = [
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


def train_model():
    dataset_path = "ml/datasets/synthetic_upi_fraud_dataset.csv"
    if not os.path.exists(dataset_path):
        print("Dataset not found, generating synthetic data...")
        df = generate_synthetic_upi_dataset(15000)
        os.makedirs("ml/datasets", exist_ok=True)
        df.to_csv(dataset_path, index=False)
    else:
        df = pd.read_csv(dataset_path)

    X = df[FEATURE_COLS]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"Training XGBoost model on {len(X_train)} samples with {len(FEATURE_COLS)} features...")

    # Calculate class imbalance scale
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = float(neg_count / max(1, pos_count))

    model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        eval_metric="logloss",
        random_state=42,
    )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n--- Model Evaluation Results ---")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"ROC-AUC:   {roc:.4f}")
    print("\nConfusion Matrix:")
    print(cm)
    print("\nClassification Report:\n", classification_report(y_test, y_pred))

    # Feature Importance
    importances = model.feature_importances_
    feature_importance_dict = {
        feat: float(imp) for feat, imp in zip(FEATURE_COLS, importances)
    }
    sorted_importances = sorted(
        feature_importance_dict.items(), key=lambda x: x[1], reverse=True
    )

    os.makedirs("ml/models", exist_ok=True)
    model_output_path = "ml/models/xgboost_fraud_model.joblib"
    joblib.dump(model, model_output_path)
    print(f"\nTrained model successfully saved to {model_output_path}")

    # Save metadata
    metadata = {
        "model_version": "v1.0-xgb-upi",
        "algorithm": "XGBoost Classifier",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "num_features": len(FEATURE_COLS),
        "feature_names": FEATURE_COLS,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc, 4),
            "confusion_matrix": cm,
        },
        "feature_importance": dict(sorted_importances),
    }

    metadata_path = "ml/models/metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Model metadata saved to {metadata_path}")


if __name__ == "__main__":
    train_model()
