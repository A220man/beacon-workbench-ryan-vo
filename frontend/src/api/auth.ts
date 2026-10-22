import { api } from "./client";

export interface LoginResponse {
  auth_url: string;
  state: string;
  code_verifier: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserInfo {
  sub: string;
  email: string | null;
  name: string | null;
  roles: string[];
}

export async function fetchLogin(redirectUri: string = "http://127.0.0.1:5173/callback"): Promise<LoginResponse> {
  return api.get<LoginResponse>(`/auth/login?redirect_uri=${encodeURIComponent(redirectUri)}`);
}

export async function fetchCallback(
  code: string,
  state: string,
  redirectUri: string,
  codeVerifier: string
): Promise<TokenResponse> {
  return api.post<TokenResponse>("/auth/callback", { code, state, redirect_uri: redirectUri, code_verifier: codeVerifier });
}

export async function fetchUserInfo(): Promise<UserInfo> {
  return api.get<UserInfo>("/auth/me");
}

export async function fetchLogout(): Promise<{ message: string }> {
  return api.post<{ message: string }>("/auth/logout", {});
}