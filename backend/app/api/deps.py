from typing import Annotated, AsyncGenerator, Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import (
    AuthenticationError,
    AuthorizationError,
    decode_token,
    extract_roles,
    get_session,
    has_role,
)
from app.core.config import get_settings

settings = get_settings()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_session():
        yield session


DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None,
) -> dict:
    if not settings.oidc_enabled:
        return {"sub": "dev-user", "roles": ["admin", "operator", "viewer"]}

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTHENTICATION_ERROR", "message": "Authorization header required"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        scheme, token = authorization.split(" ", 1)
        if scheme.lower() != "bearer":
            raise ValueError("Invalid auth scheme")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTHENTICATION_ERROR", "message": "Invalid authorization header format"},
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = await decode_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTHENTICATION_ERROR", "message": str(e)},
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


CurrentUser = Annotated[dict, Depends(get_current_user)]


def require_role(required_role: str):
    def role_checker(user: CurrentUser) -> dict:
        if not has_role(user, required_role):
            roles = extract_roles(user)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "AUTHORIZATION_ERROR",
                    "message": f"Required role: {required_role}, user roles: {roles}",
                },
            )
        return user

    return role_checker


RequireViewer = Annotated[dict, Depends(require_role("viewer"))]
RequireOperator = Annotated[dict, Depends(require_role("operator"))]
RequireAdmin = Annotated[dict, Depends(require_role("admin"))]