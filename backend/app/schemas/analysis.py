"""
Analysis schemas for API requests and responses.
"""

from typing import Dict, List, Optional

from pydantic import BaseModel

from app.services.analysis import FindingCategory, FindingSeverity


class AnalysisCreate(BaseModel):
    """Schema for creating a new analysis."""

    project_name: str
    project_path: Optional[str] = None
    git_url: Optional[str] = None
    git_branch: str = "main"


class AnalysisResponse(BaseModel):
    """Schema for analysis response (summary)."""

    id: str
    project_name: str
    status: str
    total_files_analyzed: int
    total_lines_of_code: int
    widgets_count: int
    state_patterns_count: int
    dependencies_count: int
    findings_count: int
    findings_by_severity: Dict[str, int]
    findings_by_category: Dict[str, int]
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class AnalysisListResponse(BaseModel):
    """Schema for paginated analysis list."""

    analyses: List[AnalysisResponse]
    total: int
    limit: int
    offset: int


class FindingResponse(BaseModel):
    """Schema for a finding response."""

    id: str
    title: str
    description: str
    severity: FindingSeverity
    category: FindingCategory
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    recommendation: Optional[str] = None
    code_snippet: Optional[str] = None

    class Config:
        from_attributes = True


class FindingFilter(BaseModel):
    """Schema for filtering findings."""

    severity: Optional[FindingSeverity] = None
    category: Optional[FindingCategory] = None
    file_path: Optional[str] = None
