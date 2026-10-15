import pytest
from httpx import AsyncClient


class TestAuthEndpoints:
    @pytest.mark.asyncio
    async def test_auth_me_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
        data = response.json()
        assert data["detail"]["code"] == "AUTHENTICATION_ERROR"

    @pytest.mark.asyncio
    async def test_auth_token_not_implemented(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/token")
        assert response.status_code == 401