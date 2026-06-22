from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.auth.router import router as auth_router
from app.database import SessionLocal

app = FastAPI(
    title="Cloud Flight Simulator",
    version="3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)


@app.on_event("startup")
def startup_validation():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db.commit()
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
