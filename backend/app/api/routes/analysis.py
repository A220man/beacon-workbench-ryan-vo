"""
Flutter project analysis API routes.
"""

import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.services.analysis import (
    AnalysisReport,
    AnalysisStatus,
    FindingCategory,
    FindingSeverity,
    analyze_flutter_project,
    analyze_flutter_zip,
)
from app.schemas.analysis import (
    AnalysisCreate,
    AnalysisResponse,
    AnalysisListResponse,
    FindingResponse,
    FindingFilter,
)

router = APIRouter()
settings = get_settings()

# In-memory storage for analyses (replace with DB in production)
_analyses: dict[str, AnalysisReport] = {}


class UploadProjectRequest(BaseModel):
    """Request model for uploading a Flutter project."""

    project_name: Optional[str] = None


class GitImportRequest(BaseModel):
    """Request model for importing from git URL."""

    git_url: HttpUrl
    git_branch: str = "main"
    project_name: Optional[str] = None


@router.post("/upload", response_model=AnalysisResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_project(
    file: UploadFile = File(...),
    project_name: Optional[str] = Form(None),
    current_user=Depends(get_current_user),
) -> AnalysisResponse:
    """
    Upload and analyze a Flutter project (zip file).

    Accepts a .zip file containing a Flutter project with pubspec.yaml.
    """
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .zip files are supported",
        )

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Analyze the zip file
        report = analyze_flutter_zip(tmp_path)

        # Generate analysis ID
        analysis_id = f"analysis_{len(_analyses) + 1}"
        report.project_name = project_name or report.project_name
        _analyses[analysis_id] = report

        return AnalysisResponse(
            id=analysis_id,
            project_name=report.project_name,
            status=report.status.value,
            total_files_analyzed=report.total_files_analyzed,
            total_lines_of_code=report.total_lines_of_code,
            widgets_count=len(report.widgets),
            state_patterns_count=len(report.state_patterns),
            dependencies_count=len(report.dependencies),
            findings_count=len(report.findings),
            findings_by_severity={
                sev.value: sum(1 for f in report.findings if f.severity == sev)
                for sev in FindingSeverity
            },
            findings_by_category={
                cat.value: sum(1 for f in report.findings if f.category == cat)
                for cat in FindingCategory
            },
            error_message=report.error_message,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.post("/import/git", response_model=AnalysisResponse, status_code=status.HTTP_202_ACCEPTED)
async def import_from_git(
    request: GitImportRequest,
    current_user=Depends(get_current_user),
) -> AnalysisResponse:
    """
    Import and analyze a Flutter project from a git repository.

    Clones the repository and runs analysis.
    """
    # TODO: Implement git clone and analysis
    # For now, return not implemented
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Git import not yet implemented",
    )


@router.get("", response_model=AnalysisListResponse)
async def list_analyses(
    current_user=Depends(get_current_user),
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> AnalysisListResponse:
    """
    List all analyses for the current user.
    """
    analyses_list = []
    for analysis_id, report in list(_analyses.items())[offset : offset + limit]:
        if status_filter and report.status.value != status_filter:
            continue
        analyses_list.append(
            AnalysisResponse(
                id=analysis_id,
                project_name=report.project_name,
                status=report.status.value,
                total_files_analyzed=report.total_files_analyzed,
                total_lines_of_code=report.total_lines_of_code,
                widgets_count=len(report.widgets),
                state_patterns_count=len(report.state_patterns),
                dependencies_count=len(report.dependencies),
                findings_count=len(report.findings),
                findings_by_severity={
                    sev.value: sum(1 for f in report.findings if f.severity == sev)
                    for sev in FindingSeverity
                },
                findings_by_category={
                    cat.value: sum(1 for f in report.findings if f.category == cat)
                    for cat in FindingCategory
                },
                error_message=report.error_message,
            )
        )

    return AnalysisListResponse(
        analyses=analyses_list,
        total=len(_analyses),
        limit=limit,
        offset=offset,
    )


@router.get("/{analysis_id}", response_model=AnalysisReport)
async def get_analysis(
    analysis_id: str,
    current_user=Depends(get_current_user),
) -> AnalysisReport:
    """
    Get full analysis report by ID.
    """
    if analysis_id not in _analyses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    return _analyses[analysis_id]


@router.get("/{analysis_id}/findings", response_model=list[FindingResponse])
async def get_analysis_findings(
    analysis_id: str,
    current_user=Depends(get_current_user),
    severity: Optional[FindingSeverity] = None,
    category: Optional[FindingCategory] = None,
    file_path: Optional[str] = None,
) -> list[FindingResponse]:
    """
    Get findings for an analysis with optional filters.
    """
    if analysis_id not in _analyses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    report = _analyses[analysis_id]
    findings = report.findings

    if severity:
        findings = [f for f in findings if f.severity == severity]
    if category:
        findings = [f for f in findings if f.category == category]
    if file_path:
        findings = [f for f in findings if f.file_path and file_path in f.file_path]

    return [FindingResponse(**f.to_dict()) for f in findings]


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: str,
    current_user=Depends(get_current_user),
) -> None:
    """
    Delete an analysis.
    """
    if analysis_id not in _analyses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    del _analyses[analysis_id]


@router.post("/{analysis_id}/export")
async def export_analysis(
    analysis_id: str,
    current_user=Depends(get_current_user),
    format: str = "json",
) -> JSONResponse:
    """
    Export analysis report as JSON or PDF.
    """
    if analysis_id not in _analyses:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found",
        )

    report = _analyses[analysis_id]

    if format.lower() == "json":
        return JSONResponse(
            content=report.to_dict(),
            headers={"Content-Disposition": f'attachment; filename="{report.project_name}_analysis.json"'},
        )
    elif format.lower() == "pdf":
        # TODO: Implement PDF export
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="PDF export not yet implemented",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Use 'json' or 'pdf'",
        )
