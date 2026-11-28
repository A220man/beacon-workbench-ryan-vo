import pytest
from httpx import AsyncClient
from unittest.mock import patch


class TestUploadValidation:
    """Tests for upload endpoint validation."""

    @pytest.mark.asyncio
    async def test_upload_file_too_large(self, client: AsyncClient):
        """Test that uploading a file exceeding the size limit is rejected."""
        # Generate a file content larger than MAX_UPLOAD_SIZE (10MB)
        large_content = b"x" * (11 * 1024 * 1024)  # 11MB
        
        # Create a multipart form data request with a large file
        files = {"file": ("large.zip", large_content, "application/zip")}
        data = {"project_name": "test_project"}
        
        response = await client.post(
            "/api/v1/analysis/upload",
            files=files,
            data=data,
        )
        
        assert response.status_code == 413
        error_data = response.json()
        assert "too large" in error_data["detail"].lower() or "maximum" in error_data["detail"].lower()

    @pytest.mark.asyncio
    async def test_upload_valid_file_passes_size_check(self, client: AsyncClient):
        """Test that a file within the size limit passes the size check."""
        # Generate a file content smaller than MAX_UPLOAD_SIZE (10MB)
        small_content = b"y" * (5 * 1024 * 1024)  # 5MB - within limit
        
        files = {"file": ("small.zip", small_content, "application/zip")}
        data = {"project_name": "test_project"}
        
        response = await client.post(
            "/api/v1/analysis/upload",
            files=files,
            data=data,
        )
        
        # The endpoint may fail for other reasons (e.g., no pubspec.yaml in zip),
        # but should not fail due to size limit
        assert response.status_code != 413
