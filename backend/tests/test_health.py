import pytest
from httpx import ASGITransport, AsyncClient

from app.api.deps import get_db
from app.main import create_app


class BrokenSession:
    """Mock session that always fails on execute to simulate DB failure."""

    async def execute(self, *args, **kwargs):
        raise RuntimeError("Database connection failed")

    async def close(self):
        pass

    async def commit(self):
        pass

    async def rollback(self):
        pass


class TestHealthEndpoints:
    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "environment" in data
        assert data["database"] == "connected"

    @pytest.mark.asyncio
    async def test_detailed_health_check(self, client: AsyncClient):
        response = await client.get("/api/v1/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("healthy", "degraded")
        assert "version" in data
        assert "environment" in data
        assert "checks" in data
        assert "database" in data["checks"]
        assert "config" in data["checks"]

    @pytest.mark.asyncio
    async def test_health_check_degraded_on_db_failure(self):
        app = create_app()

        async def broken_session():
            yield BrokenSession()

        app.dependency_overrides[get_db] = broken_session
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"

    @pytest.mark.asyncio
    async def test_detailed_health_check_degraded_on_db_failure(self):
        app = create_app()

        async def broken_session():
            yield BrokenSession()

        app.dependency_overrides[get_db] = broken_session
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            response = await ac.get("/api/v1/health/detailed")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"
        assert data["checks"]["database"] == "disconnected"
