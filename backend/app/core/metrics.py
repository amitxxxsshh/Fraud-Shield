from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# Prometheus Metric Definitions
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total count of HTTP requests processed",
    ["method", "endpoint", "status_code"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0)
)

RISK_PREDICTIONS_TOTAL = Counter(
    "risk_predictions_total",
    "Total risk assessments computed",
    ["event_type", "risk_level"]
)

HIGH_RISK_EVENTS_TOTAL = Counter(
    "high_risk_events_total",
    "Count of transactions/calls classified as HIGH or CRITICAL risk",
    ["category"]
)

MODEL_PREDICTION_LATENCY_SECONDS = Histogram(
    "model_prediction_latency_seconds",
    "ML model inference latency in seconds",
    ["model_version"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5)
)

VOICE_ANALYSIS_TOTAL = Counter(
    "voice_analysis_total",
    "Total voice calls / audio streams analyzed",
    ["outcome", "mode"]
)

WEBSOCKET_CONNECTIONS = Gauge(
    "websocket_connections",
    "Number of currently active WebSocket clients"
)


def metrics_endpoint_handler() -> Response:
    """Returns Prometheus formatted metrics."""
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
