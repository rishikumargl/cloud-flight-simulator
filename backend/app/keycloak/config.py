"""Keycloak configuration from environment variables."""
import os


class KeycloakConfig:
    """Keycloak OIDC server configuration."""

    def __init__(self):
        self.url = os.getenv("KEYCLOAK_URL", "http://localhost:8081")
        self.realm = os.getenv("KEYCLOAK_REALM", "cloud-flight-simulator")
        self.client_id = os.getenv("KEYCLOAK_CLIENT_ID", "cloud-flight-simulator-backend")
        self.client_secret = os.getenv("KEYCLOAK_CLIENT_SECRET", "")

    @property
    def jwks_url(self) -> str:
        """JWKS endpoint URL (supports Keycloak 18+ and 24+)."""
        # Keycloak 24+ uses /realms/ instead of /auth/realms/
        if self.url.endswith("/auth"):
            return f"{self.url}/realms/{self.realm}/protocol/openid-connect/certs"
        return f"{self.url}/realms/{self.realm}/protocol/openid-connect/certs"

    @property
    def issuer(self) -> str:
        """Token issuer URL (supports Keycloak 18+ and 24+)."""
        # Keycloak 18-23: /auth/realms/
        # Keycloak 24+: /realms/
        # Try 24+ format first, fall back to 18-23
        if "/auth" in self.url:
            return f"{self.url}/realms/{self.realm}"
        return f"{self.url}/realms/{self.realm}"

    @property
    def oidc_config_url(self) -> str:
        """OIDC discovery endpoint (supports Keycloak 18+ and 24+)."""
        if self.url.endswith("/auth"):
            return f"{self.url}/realms/{self.realm}/.well-known/openid-configuration"
        return f"{self.url}/realms/{self.realm}/.well-known/openid-configuration"


keycloak_config = KeycloakConfig()
