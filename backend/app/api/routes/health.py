from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import get_settings
from app.schemas.health import DetailedHealthResponse, HealthResponse

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_status = "disconnected"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version=settings.app_version,
        environment=settings.environment,
        database=db_status,
    )


@router.get("/health/detailed", response_model=DetailedHealthResponse)
async def detailed_health_check(db: AsyncSession = Depends(get_db)) -> DetailedHealthResponse:
    db_status = "disconnected"
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass

    return DetailedHealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version=settings.app_version,
        environment=settings.environment,
        database=db_status,
        checks={"database": db_status, "config": "loaded"},
    )