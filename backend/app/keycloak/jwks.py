"""JWKS fetching and caching for Keycloak JWT validation."""
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import aiohttp


class JWKSCache:
    """Cache for Keycloak JWKS with automatic refresh."""

    def __init__(self, jwks_url: str):
        """Initialize JWKS cache.

        Args:
            jwks_url: URL to fetch JWKS from
        """
        self.jwks_url = jwks_url
        self.cache: Dict[str, Any] = {}
        self.cache_time: Optional[datetime] = None
        self.cache_ttl = timedelta(hours=24)

    async def get_keys(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Get public keys, fetching from Keycloak if needed.

        Args:
            force_refresh: Force refresh cache even if not expired

        Returns:
            List of JWK dictionaries
        """
        now = datetime.utcnow()
        is_expired = (
            self.cache_time is None
            or (now - self.cache_time) > self.cache_ttl
        )

        if force_refresh or is_expired:
            try:
                jwks = await self.fetch_jwks()
                self.cache = jwks
                self.cache_time = now
            except Exception as e:
                if not self.cache:
                    raise
                # Use stale cache if fetch fails
                print(f"WARNING: JWKS fetch failed, using stale cache: {str(e)}")

        return self.cache.get("keys", [])

    async def fetch_jwks(self) -> Dict[str, Any]:
        """Fetch JWKS from Keycloak.

        Returns:
            JWKS dictionary with 'keys' array

        Raises:
            Exception: If fetch fails
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.jwks_url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    if resp.status != 200:
                        raise ValueError(f"Keycloak returned {resp.status}")
                    return await resp.json()
        except Exception as e:
            raise ValueError(f"Failed to fetch JWKS: {str(e)}")
