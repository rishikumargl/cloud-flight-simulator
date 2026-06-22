"""Cloud Flight Simulator - Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.app.database import init_db
from backend.app.evaluation.router import router as evaluation_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Cloud Flight Simulator",
    description="Hybrid evaluation engine for GCP learning challenges",
    version="3.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    logger.info("Database initialized")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "cloud-flight-simulator",
        "version": "3.0",
    }


# Register P5 evaluation router
app.include_router(evaluation_router)

# TODO: Register other routers (P2, P3, P4, P6, P7) when ready
# app.include_router(auth_router)
# app.include_router(scenarios_router)
# app.include_router(challenges_router)
# app.include_router(feedback_router)
# app.include_router(progress_router)

logger.info("Cloud Flight Simulator API initialized")
