import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_transaction_risk_api_normal():
    payload = {
        "amount": 500.0,
        "recipient": "friend@upi",
        "new_recipient": False,
        "user_average_amount": 3000.0,
        "transaction_frequency": 2,
        "recent_voice_risk": 0,
        "recent_message_risk": 0,
        "device_risk": 0
    }
    response = client.post("/api/risk/transaction", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert "risk_level" in data
    assert data["risk_level"] == "LOW"
    assert data["recommended_action"] == "PROCEED"
    assert data["recipient_masked"].startswith("fr***")


def test_transaction_risk_api_scam_scenario():
    payload = {
        "amount": 25000.0,
        "recipient": "unknown@ybl",
        "new_recipient": True,
        "user_average_amount": 3000.0,
        "transaction_frequency": 2,
        "recent_voice_risk": 94,
        "recent_message_risk": 0,
        "device_risk": 0
    }
    response = client.post("/api/risk/transaction", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 80
    assert data["risk_level"] == "CRITICAL"
    assert data["recommended_action"] == "CANCEL_PAYMENT"
    assert len(data["reasons"]) > 0


def test_transaction_execution_flow():
    # 1. Create transaction risk check
    payload = {
        "amount": 1000.0,
        "recipient": "merchant@upi",
        "new_recipient": False,
    }
    resp = client.post("/api/risk/transaction", json=payload)
    assert resp.status_code == 200
    tx_id = resp.json()["transaction_id"]

    # 2. Execute confirmation
    exec_resp = client.post("/api/risk/transaction/execute", json={
        "transaction_id": tx_id,
        "action": "PROCEEDED"
    })
    assert exec_resp.status_code == 200
    assert exec_resp.json()["final_status"] == "COMPLETED"


def test_message_risk_api():
    payload = {
        "message_text": "Your bank account will be blocked today. Pay ₹5000 immediately to update KYC."
    }
    response = client.post("/api/risk/message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 50
    assert "account_block_threat" in data["detected_patterns"] or "kyc_scam" in data["detected_patterns"]


def test_voice_risk_api():
    payload = {
        "transcript": "Hello, I am from your bank. Give me the OTP immediately to verify your account."
    }
    response = client.post("/api/risk/voice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] >= 60
    assert "bank_impersonation" in data["detected_patterns"]
    assert "otp_request" in data["detected_patterns"]


def test_feedback_api():
    payload = {
        "actual_feedback": "FALSE_POSITIVE",
        "prediction_risk_level": "HIGH",
        "prediction_risk_score": 88,
        "user_comments": "Legitimate rent transfer to new landlord"
    }
    response = client.post("/api/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"


def test_dashboard_stats_and_charts():
    res_stats = client.get("/api/dashboard/stats")
    assert res_stats.status_code == 200
    assert "total_transactions" in res_stats.json()

    res_charts = client.get("/api/dashboard/charts")
    assert res_charts.status_code == 200
    assert "risk_over_time" in res_charts.json()
    assert "risk_distribution" in res_charts.json()


def test_ml_predict_and_metadata():
    pred_res = client.post("/api/ml/predict", json={
        "amount": 25000.0,
        "user_average_amount": 3000.0,
        "new_recipient": True,
        "voice_risk": 90,
        "message_risk": 0,
        "device_risk": 0
    })
    assert pred_res.status_code == 200
    assert "fraud_probability" in pred_res.json()

    meta_res = client.get("/api/ml/metadata")
    assert meta_res.status_code == 200
    assert "metrics" in meta_res.json()


def test_delete_user_data_privacy():
    del_res = client.delete("/api/user/data?user_id=demo-user-1")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    audit_res = client.get("/api/user/privacy-audit")
    assert audit_res.status_code == 200
    assert len(audit_res.json()) > 0


def test_twilio_twiml_generation():
    response = client.post("/twilio/voice/incoming", data={"CallSid": "CA12345", "From": "+919876543210"})
    assert response.status_code == 200
    assert "application/xml" in response.headers["content-type"]
    assert "<Stream" in response.text
    assert "Security notice:" in response.text


def test_cors_development_origin():
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_production_origin():
    prod_origin = "https://vercel.com/jackys-projects-fa9f7bec/fraud-shield"
    response = client.get("/health", headers={"Origin": prod_origin})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == prod_origin
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_vercel_subdomain_origin():
    preview_origin = "https://fraud-shield-test.vercel.app"
    response = client.get("/health", headers={"Origin": preview_origin})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == preview_origin
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_preflight_options():
    prod_origin = "https://vercel.com/jackys-projects-fa9f7bec/fraud-shield"
    response = client.options(
        "/api/risk/transaction",
        headers={
            "Origin": prod_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization, content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == prod_origin
    assert response.headers.get("access-control-allow-credentials") == "true"
    allow_methods = response.headers.get("access-control-allow-methods", "")
    for method in ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]:
        assert method in allow_methods
    allow_headers = response.headers.get("access-control-allow-headers", "")
    assert "authorization" in allow_headers.lower() or "content-type" in allow_headers.lower() or "*" in allow_headers

