export enum FindingSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

export enum FindingCategory {
  STATE_REUSE = "state_reuse",
  PERFORMANCE = "performance",
  ARCHITECTURE = "architecture",
  BEST_PRACTICE = "best_practice",
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category: FindingCategory;
  file_path?: string;
  line_number?: number;
  recommendation?: string;
  code_snippet?: string;
}

export interface AnalysisSummary {
  id: string;
  project_name: string;
  status: string;
  total_files_analyzed: number;
  total_lines_of_code: number;
  widgets_count: number;
  state_patterns_count: number;
  dependencies_count: number;
  findings_count: number;
  findings_by_severity: Record<string, number>;
  findings_by_category: Record<string, number>;
  error_message?: string;
}

export interface AnalysisListResponse {
  analyses: AnalysisSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface FindingFilter {
  severity?: FindingSeverity;
  category?: FindingCategory;
  file_path?: string;
}

export interface UploadProjectRequest {
  project_name?: string;
}

export interface GitImportRequest {
  git_url: string;
  git_branch?: string;
  project_name?: string;
}
