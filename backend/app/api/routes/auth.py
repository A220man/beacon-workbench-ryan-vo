from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from urllib.parse import urlencode
import secrets
import hashlib
import base64
import httpx

from app.api.deps import CurrentUser, RequireOperator
from app.core.config import get_settings
from app.core.security import decode_token

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    sub: str
    email: str | None = None
    name: str | None = None
    roles: list[str]


class LoginRequest(BaseModel):
    redirect_uri: str


class CallbackRequest(BaseModel):
    code: str
    state: str
    redirect_uri: str
    code_verifier: str


@router.get("/login")
async def login(redirect_uri: str = "http://127.0.0.1:5173/callback") -> dict:
    """Initiate OIDC authorization code flow with PKCE."""
    code_verifier = secrets.token_urlsafe(32)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip("=")

    state = secrets.token_urlsafe(16)

    params = {
        "client_id": settings.oidc_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email roles",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    auth_url = f"{settings.oidc_issuer_url}/protocol/openid-connect/auth?{urlencode(params)}"

    return {
        "auth_url": auth_url,
        "state": state,
        "code_verifier": code_verifier,
    }


@router.post("/callback", response_model=TokenResponse)
async def callback(request: CallbackRequest) -> TokenResponse:
    """Exchange authorization code for tokens."""
    token_url = f"{settings.oidc_issuer_url}/protocol/openid-connect/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.oidc_client_id,
        "client_secret": settings.oidc_client_secret,
        "code": request.code,
        "redirect_uri": request.redirect_uri,
        "code_verifier": request.code_verifier,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(token_url, data=data)

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "TOKEN_EXCHANGE_FAILED", "message": response.text},
        )

    tokens = response.json()
    access_token = tokens.get("access_token")
    expires_in = tokens.get("expires_in", 300)

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "NO_ACCESS_TOKEN", "message": "Token response missing access_token"},
        )

    # Verify the token
    try:
        await decode_token(access_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN", "message": str(e)},
        )

    return TokenResponse(access_token=access_token, expires_in=expires_in)


@router.post("/logout")
async def logout(user: CurrentUser) -> dict:
    """Logout endpoint - client should clear token."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(user: CurrentUser) -> UserInfo:
    from app.core import extract_roles

    return UserInfo(
        sub=user.get("sub", "unknown"),
        email=user.get("email"),
        name=user.get("name") or user.get("preferred_username"),
        roles=extract_roles(user),
    )


@router.post("/token", response_model=TokenResponse)
async def get_token(user: RequireOperator) -> TokenResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token exchange not implemented - use Keycloak directly",
    )