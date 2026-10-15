import pytest
from httpx import AsyncClient


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