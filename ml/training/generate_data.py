"""
Synthetic UPI Scenario Dataset Generator for Fraud Shield
---------------------------------------------------------
Generates realistic UPI transaction fraud and normal patterns for training
and evaluating the XGBoost fraud risk model.

NOTE: This is synthetic data generated strictly for the hackathon prototype
and does NOT represent private or proprietary bank data.
"""

import os
import random
import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)


def generate_synthetic_upi_dataset(num_samples: int = 10000) -> pd.DataFrame:
    records = []

    for _ in range(num_samples):
        # Scenario distribution: 70% Normal, 20% Suspicious, 10% Extreme Fraud
        scenario_type = np.random.choice(["NORMAL", "SUSPICIOUS", "EXTREME"], p=[0.70, 0.20, 0.10])

        user_avg = random.choice([1500.0, 3000.0, 5000.0, 8000.0, 12000.0])
        hist_std = user_avg * 0.40

        if scenario_type == "NORMAL":
            # Normal daily transaction
            amount = max(50.0, np.random.normal(loc=user_avg * 0.85, scale=user_avg * 0.25))
            new_recipient = 1 if random.random() < 0.10 else 0
            recipient_count = 0 if new_recipient else random.randint(2, 45)
            velocity = random.uniform(0.04, 0.25)  # 1 to 6 transactions per day
            hour_of_day = random.randint(7, 22)
            day_of_week = random.randint(0, 6)
            voice_risk = random.randint(0, 15)
            message_risk = random.randint(0, 15)
            device_changed = 1 if random.random() < 0.05 else 0
            location_anomaly = 1 if random.random() < 0.03 else 0
            is_fraud = 0

        elif scenario_type == "SUSPICIOUS":
            # Anomaly / Mild social engineering / High amount
            amount = user_avg * random.uniform(2.5, 6.0)
            new_recipient = 1 if random.random() < 0.75 else 0
            recipient_count = 0 if new_recipient else random.randint(1, 3)
            velocity = random.uniform(0.20, 0.60)
            hour_of_day = random.choice([0, 1, 2, 3, 4, 23, 14, 19])
            day_of_week = random.randint(0, 6)
            voice_risk = random.randint(35, 75) if random.random() < 0.6 else random.randint(0, 20)
            message_risk = random.randint(40, 80) if random.random() < 0.6 else random.randint(0, 20)
            device_changed = 1 if random.random() < 0.35 else 0
            location_anomaly = 1 if random.random() < 0.25 else 0
            # Higher chance of fraud
            is_fraud = 1 if (voice_risk > 60 or message_risk > 60 or amount > user_avg * 3.5) else (1 if random.random() < 0.65 else 0)

        else:  # EXTREME
            # Severe vishing/phishing attack + large money transfer to fresh mule account
            amount = max(15000.0, user_avg * random.uniform(4.0, 12.0))
            new_recipient = 1  # Almost always a new mule account
            recipient_count = 0
            velocity = random.uniform(0.40, 1.20)
            hour_of_day = random.randint(0, 23)
            day_of_week = random.randint(0, 6)
            voice_risk = random.randint(80, 100)  # Bank impersonation / OTP request
            message_risk = random.randint(70, 95)  # Account block / KYC urgency
            device_changed = 1 if random.random() < 0.50 else 0
            location_anomaly = 1 if random.random() < 0.40 else 0
            is_fraud = 1

        ratio = round(amount / user_avg, 2)
        suspicious_call = 1 if voice_risk >= 50 else 0
        suspicious_msg = 1 if message_risk >= 50 else 0

        records.append({
            "amount": round(amount, 2),
            "amount_to_average_ratio": ratio,
            "new_recipient": new_recipient,
            "recipient_transaction_count": recipient_count,
            "transaction_velocity": round(velocity, 4),
            "hour_of_day": hour_of_day,
            "day_of_week": day_of_week,
            "historical_average": user_avg,
            "historical_std": round(hist_std, 2),
            "recent_suspicious_call": suspicious_call,
            "recent_suspicious_message": suspicious_msg,
            "device_changed": device_changed,
            "location_anomaly": location_anomaly,
            "voice_risk": voice_risk,
            "message_risk": message_risk,
            "scenario_type": scenario_type,
            "is_fraud": is_fraud,
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    output_dir = "ml/datasets"
    os.makedirs(output_dir, exist_ok=True)
    df = generate_synthetic_upi_dataset(15000)
    output_path = os.path.join(output_dir, "synthetic_upi_fraud_dataset.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} synthetic UPI records saved to {output_path}")
    print(f"Fraud distribution:\n{df['is_fraud'].value_counts(normalize=True)}")
