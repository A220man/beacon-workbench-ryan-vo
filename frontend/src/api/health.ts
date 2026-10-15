import { api } from "./client";

export interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  database: string;
}

export interface DetailedHealthResponse extends HealthResponse {
  checks: Record<string, string>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>("/health");
}

export async function fetchDetailedHealth(): Promise<DetailedHealthResponse> {
  return api.get<DetailedHealthResponse>("/health/detailed");
}