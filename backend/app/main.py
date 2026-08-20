import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.core.metrics import metrics_endpoint_handler, HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION_SECONDS
from app.api.routes.auth import router as auth_router
from app.api.routes.risk import router as risk_router
from app.api.routes.ml import router as ml_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.feedback import router as feedback_router
from app.api.routes.user import router as user_router
from app.api.routes.twilio_routes import router as twilio_router
from app.websocket.endpoints import router as ws_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing Fraud Shield Database...")
    try:
        init_db()
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    yield
    # Shutdown
    logger.info("Shutting down Fraud Shield Backend.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Privacy-conscious, explainable real-time fraud prevention platform for UPI, voice phishing, and social engineering.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware Configuration
# Explicit origins, methods (GET, POST, PUT, PATCH, DELETE, OPTIONS), headers & credentials
cors_origins = [str(origin).strip().rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS if "*" not in str(origin)]
baseline_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://vercel.com/jackys-projects-fa9f7bec/fraud-shield",
    "https://vercel.com",
    "https://fraud-shield-erem.onrender.com",
]
for origin in baseline_origins:
    if origin not in cors_origins:
        cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^https://vercel\.com(/.*)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


# Prometheus Request Metrics Middleware
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    method = request.method
    path = request.url.path

    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        logger.error(f"Unhandled request error on {method} {path}: {e}")
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

    duration = time.time() - start_time
    try:
        HTTP_REQUESTS_TOTAL.labels(method=method, endpoint=path, status_code=status_code).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(method=method, endpoint=path).observe(duration)
    except Exception:
        pass

    return response


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(risk_router, prefix=settings.API_V1_STR)
app.include_router(ml_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(feedback_router, prefix=settings.API_V1_STR)
app.include_router(user_router, prefix=settings.API_V1_STR)
app.include_router(twilio_router)
app.include_router(ws_router)


# Health & Root Endpoints
@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time(),
    }


# Prometheus Metrics Route
app.add_route("/metrics", metrics_endpoint_handler, methods=["GET"])
