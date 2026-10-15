from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import CurrentUser, RequireOperator

router = APIRouter(prefix="/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserInfo(BaseModel):
    sub: str
    email: str | None = None
    name: str | None = None
    roles: list[str]


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