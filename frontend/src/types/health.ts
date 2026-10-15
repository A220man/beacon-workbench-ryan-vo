export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  database: string;
}

export interface DetailedHealthResponse extends HealthResponse {
  checks: Record<string, string>;
}

export interface UserInfo {
  sub: string;
  email: string | null;
  name: string | null;
  roles: string[];
}