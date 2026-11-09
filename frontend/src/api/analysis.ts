import { api, ApiError } from "@/api/client";
import type {
  AnalysisSummary,
  AnalysisListResponse,
  Finding,
  FindingFilter,
  GitImportRequest,
} from "@/types/analysis";

export async function uploadProject(
  file: File,
  projectName?: string
): Promise<AnalysisSummary> {
  const formData = new FormData();
  formData.append("file", file);
  if (projectName) {
    formData.append("project_name", projectName);
  }

  const token = sessionStorage.getItem("access_token");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/v1/analysis/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;
    let details: unknown;

    try {
      const errorData = await response.json();
      code = errorData.detail?.code || code;
      message = errorData.detail?.message || message;
      details = errorData.detail;
    } catch {
      message = await response.text();
    }

    throw new ApiError(response.status, code, message, details);
  }

  return response.json();
}

export async function importFromGit(
  request: GitImportRequest
): Promise<AnalysisSummary> {
  return api.post<AnalysisSummary>("/analysis/import/git", request);
}

export async function listAnalyses(
  limit = 20,
  offset = 0
): Promise<AnalysisListResponse> {
  return api.get<AnalysisListResponse>(
    `/analysis?limit=${limit}&offset=${offset}`
  );
}

export async function getAnalysis(id: string): Promise<AnalysisSummary> {
  return api.get<AnalysisSummary>(`/analysis/${id}`);
}

export async function getAnalysisFindings(
  id: string,
  filter?: FindingFilter
): Promise<Finding[]> {
  const params = new URLSearchParams();
  if (filter?.severity) params.append("severity", filter.severity);
  if (filter?.category) params.append("category", filter.category);
  if (filter?.file_path) params.append("file_path", filter.file_path);

  const query = params.toString();
  return api.get<Finding[]>(`/analysis/${id}/findings${query ? `?${query}` : ""}`);
}

export async function deleteAnalysis(id: string): Promise<void> {
  return api.delete<void>(`/analysis/${id}`);
}

export async function exportAnalysis(id: string, format: "json" | "pdf" = "json"): Promise<Blob> {
  const token = sessionStorage.getItem("access_token");
  const headers: Record<string, string> = {
    Accept: format === "json" ? "application/json" : "application/pdf",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/v1/analysis/${id}/export?format=${format}`, {
    method: "POST",
    headers,
  });

  if (!response.ok) {
    let code = "UNKNOWN_ERROR";
    let message = `HTTP ${response.status}`;
    let details: unknown;

    try {
      const errorData = await response.json();
      code = errorData.detail?.code || code;
      message = errorData.detail?.message || message;
      details = errorData.detail;
    } catch {
      message = await response.text();
    }

    throw new ApiError(response.status, code, message, details);
  }

  return response.blob();
}
