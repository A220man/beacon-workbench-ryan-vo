from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    version: str
    environment: str
    database: str = "connected"


class DetailedHealthResponse(HealthResponse):
    checks: dict