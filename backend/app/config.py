"""Platform configuration - environment variables and settings."""
import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/cloud_flight_simulator"
)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# LLM Configuration (OpenAI-compatible)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

# LangSmith Configuration
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT_NAME = os.getenv("LANGSMITH_PROJECT_NAME", "cloud-flight-simulator")
LANGSMITH_TRACING_V2 = os.getenv("LANGSMITH_TRACING_V2", "true").lower() == "true"

# GCP Configuration
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "cloud-flight-sim")

# Application
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Validation
def validate_config():
    """Validate required configuration."""
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required")
