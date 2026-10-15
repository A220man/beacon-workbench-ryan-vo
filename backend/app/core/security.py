import time
from typing import Any, Dict, Optional

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import get_settings

settings = get_settings()

_jwks_cache: Dict[str, Any] = {"keys": {}, "fetched_at": 0}
JWKS_TTL_SECONDS = 3600


async def fetch_jwks() -> Dict[str, Any]:
    global _jwks_cache
    now = time.time()
    if _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"]) < JWKS_TTL_SECONDS:
        return _jwks_cache["keys"]

    jwks_url = settings.oidc_jwks_url
    if not jwks_url:
        raise ValueError("OIDC JWKS URL not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        jwks = response.json()

    keys = {key["kid"]: key for key in jwks.get("keys", [])}
    _jwks_cache = {"keys": keys, "fetched_at": now}
    return keys


def get_public_key(kid: str) -> Optional[Dict[str, Any]]:
    return _jwks_cache["keys"].get(kid)


async def decode_token(token: str) -> Dict[str, Any]:
    if not settings.oidc_enabled:
        raise ValueError("OIDC not enabled")

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise ValueError(f"Invalid token header: {e}")

    kid = unverified_header.get("kid")
    if not kid:
        raise ValueError("Token missing 'kid' header")

    jwks = await fetch_jwks()
    key = jwks.get(kid)
    if not key:
        jwks = await fetch_jwks()
        key = jwks.get(kid)
        if not key:
            raise ValueError(f"Key not found for kid: {kid}")

    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=[settings.algorithm],
            audience=settings.oidc_audience,
            issuer=settings.oidc_issuer_url,
            options={"verify_at_hash": False},
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Token validation failed: {e}")


def extract_roles(payload: Dict[str, Any]) -> list[str]:
    realm_access = payload.get("realm_access", {})
    return realm_access.get("roles", [])


def has_role(payload: Dict[str, Any], required_role: str) -> bool:
    roles = extract_roles(payload)
    return required_role in roles or "admin" in roles