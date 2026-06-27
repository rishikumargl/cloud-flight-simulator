from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.auth.router import router as auth_router
from app.challenges.router import router as challenges_router
from app.scenarios.router import router as scenarios_router
from app.evaluation.router import router as evaluation_router
from app.admin.router import router as admin_router
from app.database import SessionLocal

app = FastAPI(
    title="PROPEL",
    version="3.0"
)

# CORS — list every origin your frontend runs on.
# withCredentials is NOT used (we use JWT Bearer tokens),
# so allow_credentials=False and allow_origins can stay specific.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,   # False because we use Authorization header, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(challenges_router)
app.include_router(scenarios_router)
app.include_router(evaluation_router)
app.include_router(admin_router)


@app.on_event("startup")
def startup_validation():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db.commit()
        print("[STARTUP] Database connection OK")
    except Exception as e:
        raise RuntimeError(f"Database connectivity check failed: {e}") from e
    finally:
        db.close()


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "cloud-flight-simulator",
        "version": "3.0"
    }
