import os
from dotenv import load_dotenv

load_dotenv()


def _get_required_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Environment variable {key} is required but not set")
    return value


DATABASE_URL = _get_required_env("DATABASE_URL")

# Clerk authentication configuration
CLERK_SECRET_KEY = _get_required_env("CLERK_SECRET_KEY")
CLERK_PUBLISHABLE_KEY = _get_required_env("CLERK_PUBLISHABLE_KEY")
CLERK_PEM_PUBLIC_KEY = os.getenv("CLERK_PEM_PUBLIC_KEY", "")

# Clerk issuer - matches the JWT 'iss' claim
# For environment dynamic-raptor-82.clerk.accounts.dev
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "https://dynamic-raptor-82.clerk.accounts.dev")

# GCP configuration
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "cloud-flight-sim")
GCP_KEY_PATH = os.getenv("GCP_KEY_PATH", None)
