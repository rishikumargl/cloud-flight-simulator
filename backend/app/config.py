import os
from dotenv import load_dotenv

load_dotenv()


def _get_required_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Environment variable {key} is required but not set")
    return value


DATABASE_URL = _get_required_env("DATABASE_URL")

# Keycloak OIDC configuration
KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8081")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "cloud-flight-simulator")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "cloud-flight-simulator-backend")
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "")
