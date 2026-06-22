"""
FastAPI main application for Cloud Flight Simulator.

Uses HuggingFace Router endpoint for OpenAI-compatible LLM access.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from typing import Optional
from uuid import UUID
from openai import OpenAI

# Domain imports
from app.feedback import router as feedback_router

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Cloud Flight Simulator",
    description="Cloud infrastructure learning platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure per environment in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# DEPENDENCY INJECTION (P2 Auth & Database Integration)
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "cloud-flight-simulator"}


async def get_current_user():
    """
    Dependency to extract and validate JWT token.
    TODO: Integrate with P2 auth module.
    """
    # Placeholder: In production, this validates JWT from Authorization header
    return {"user_id": "placeholder-user-id", "role": "learner"}


async def get_db():
    """
    Dependency to get database session.
    TODO: Integrate with P2 database module.
    """
    # Placeholder: In production, this returns SQLAlchemy session
    return None


async def get_llm():
    """
    Dependency to get configured LLM instance via HuggingFace Router.
    Uses OpenAI-compatible API with HuggingFace endpoint.
    """
    hf_token = os.environ.get("HF_TOKEN")
    if not hf_token:
        logger.warning("HF_TOKEN not set. Using mock LLM.")
        # Return a mock LLM that works without credentials
        class MockLLM:
            def invoke(self, messages):
                class MockResponse:
                    content = "Mock feedback response"
                return MockResponse()
        return MockLLM()

    # Use HuggingFace Router endpoint for OpenAI-compatible LLM
    client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=hf_token
    )

    # Wrap OpenAI client to work with LangChain
    from langchain_openai import ChatOpenAI

    # Create LangChain compatible LLM using HuggingFace router
    llm = ChatOpenAI(
        client=client,
        model="openai/gpt-4-turbo",  # Can use any OpenAI model
        temperature=0.7,
        max_tokens=500,
        api_key=hf_token,
        base_url="https://router.huggingface.co/v1"
    )

    return llm


async def get_audit_service():
    """
    Dependency to get audit service.
    TODO: Integrate with P7 audit module.
    """
    # Placeholder: In production, this returns P7's audit service
    class AuditService:
        def write_event(self, db, event_type, source, user_id, session_id, metadata=None):
            logger.info(f"Audit: {event_type} from {source} by {user_id}")
            pass

    return AuditService()


# ============================================================================
# ROUTE REGISTRATION
# ============================================================================

# Register P6 feedback routes
app.include_router(feedback_router)


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )


# ============================================================================
# STARTUP & SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    logger.info("Cloud Flight Simulator starting up...")
    logger.info("Using HuggingFace Router endpoint for OpenAI LLM")
    # TODO: Initialize database connections
    # TODO: Initialize LangSmith tracing


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Cloud Flight Simulator shutting down...")
    # TODO: Close database connections


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )
