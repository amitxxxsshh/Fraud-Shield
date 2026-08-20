import pytest
from app.risk_engine.feature_engineering import FeatureEngineering
from app.risk_engine.rule_engine import RuleEngine
from app.risk_engine.ml_predictor import ml_predictor
from app.risk_engine.context_engine import context_engine
from app.risk_engine.risk_aggregator import risk_aggregator
from app.services.voice_classifier import voice_classifier


def test_scenario_1_normal_payment():
    """1. Normal ₹500 known recipient -> LOW"""
    rule_engine = RuleEngine()
    features = FeatureEngineering.extract_features({
        "amount": 500.0,
        "user_average_amount": 3000.0,
        "new_recipient": False,
        "recent_voice_risk": 0,
        "recent_message_risk": 0,
        "device_risk": 0,
    })

    rule_score, rule_reasons = rule_engine.evaluate({}, features)
    ml_prob, ml_score = ml_predictor.predict_probability(features)
    ctx_score, ctx_reasons, _ = context_engine.correlate(features)

    final_score, risk_level, reasons, action = risk_aggregator.aggregate(
        rule_score, rule_reasons, ml_score, ml_prob, ctx_score, ctx_reasons, features
    )

    assert risk_level == "LOW"
    assert final_score < 30
    assert action == "PROCEED"


def test_scenario_2_large_amount_new_recipient():
    """2. ₹50,000 new recipient -> HIGH"""
    rule_engine = RuleEngine()
    features = FeatureEngineering.extract_features({
        "amount": 50000.0,
        "user_average_amount": 3000.0,
        "new_recipient": True,
        "recent_voice_risk": 0,
        "recent_message_risk": 0,
        "device_risk": 0,
    })

    rule_score, rule_reasons = rule_engine.evaluate({}, features)
    ml_prob, ml_score = ml_predictor.predict_probability(features)
    ctx_score, ctx_reasons, _ = context_engine.correlate(features)

    final_score, risk_level, reasons, action = risk_aggregator.aggregate(
        rule_score, rule_reasons, ml_score, ml_prob, ctx_score, ctx_reasons, features
    )

    assert risk_level in ("HIGH", "CRITICAL")
    assert final_score >= 60
    assert action == "CANCEL_PAYMENT"
    # Check that new recipient and amount anomaly reasons are captured
    factors = [r.factor for r in reasons]
    assert "new_recipient" in factors or "high_value_new_recipient" in factors


def test_scenario_3_voice_social_engineering_classifier():
    """3. Bank impersonation + OTP request -> HIGH/CRITICAL"""
    sample_transcript = (
        "I am calling from your bank security department. Your account has been compromised. "
        "You need to transfer 25000 rupees immediately. Please give me your OTP to verify."
    )
    res = voice_classifier.classify(sample_transcript)

    assert res["risk_score"] >= 80
    assert res["risk_level"] in ("HIGH", "CRITICAL")
    assert "bank_impersonation" in res["detected_patterns"]
    assert "otp_request" in res["detected_patterns"]


def test_scenario_4_voice_scam_followed_by_payment():
    """4. Suspicious call followed by large payment -> CRITICAL"""
    rule_engine = RuleEngine()
    features = FeatureEngineering.extract_features({
        "amount": 25000.0,
        "user_average_amount": 3000.0,
        "new_recipient": True,
        "recent_voice_risk": 94,  # Call just finished
        "recent_message_risk": 0,
        "device_risk": 0,
    })

    rule_score, rule_reasons = rule_engine.evaluate({}, features)
    ml_prob, ml_score = ml_predictor.predict_probability(features)
    ctx_score, ctx_reasons, is_correlated = context_engine.correlate(features)

    final_score, risk_level, reasons, action = risk_aggregator.aggregate(
        rule_score, rule_reasons, ml_score, ml_prob, ctx_score, ctx_reasons, features
    )

    assert risk_level == "CRITICAL"
    assert final_score >= 80
    assert is_correlated is True
    assert action == "CANCEL_PAYMENT"


def test_scenario_5_normal_transaction_after_unrelated_call():
    """5. Normal transaction after unrelated friendly call -> should remain LOW"""
    rule_engine = RuleEngine()
    features = FeatureEngineering.extract_features({
        "amount": 450.0,
        "user_average_amount": 3000.0,
        "new_recipient": False,
        "recent_voice_risk": 10,  # Harmless call
        "recent_message_risk": 0,
        "device_risk": 0,
    })

    rule_score, rule_reasons = rule_engine.evaluate({}, features)
    ml_prob, ml_score = ml_predictor.predict_probability(features)
    ctx_score, ctx_reasons, is_correlated = context_engine.correlate(features)

    final_score, risk_level, reasons, action = risk_aggregator.aggregate(
        rule_score, rule_reasons, ml_score, ml_prob, ctx_score, ctx_reasons, features
    )

    assert risk_level == "LOW"
    assert is_correlated is False
    assert action == "PROCEED"
