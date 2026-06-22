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
        """JWKS endpoint URL."""
        return f"{self.url}/auth/realms/{self.realm}/protocol/openid-connect/certs"

    @property
    def issuer(self) -> str:
        """Token issuer URL."""
        return f"{self.url}/auth/realms/{self.realm}"

    @property
    def oidc_config_url(self) -> str:
        """OIDC discovery endpoint."""
        return f"{self.url}/auth/realms/{self.realm}/.well-known/openid-configuration"


keycloak_config = KeycloakConfig()
