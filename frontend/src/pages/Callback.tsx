import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchCallback } from "@/api/auth";
import { setAuthToken } from "@/api/client";

export function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        if (mounted) {
          setError(errorDescription || error);
          setLoading(false);
        }
        return;
      }

      if (!code || !state) {
        if (mounted) {
          setError("Missing authorization code or state");
          setLoading(false);
        }
        return;
      }

      // Retrieve stored PKCE verifier and expected state
      const storedVerifier = sessionStorage.getItem("pkce_verifier");
      const storedState = sessionStorage.getItem("oauth_state");
      const redirectUri = sessionStorage.getItem("redirect_uri") || "http://127.0.0.1:5173/callback";

      if (!storedVerifier || !storedState) {
        if (mounted) {
          setError("Missing PKCE verifier or state in session storage");
          setLoading(false);
        }
        return;
      }

      if (state !== storedState) {
        if (mounted) {
          setError("State mismatch - possible CSRF attack");
          setLoading(false);
        }
        return;
      }

      try {
        const tokens = await fetchCallback(code, state, redirectUri, storedVerifier);
        if (mounted) {
          setAuthToken(tokens.access_token);
          // Clean up session storage
          sessionStorage.removeItem("pkce_verifier");
          sessionStorage.removeItem("oauth_state");
          sessionStorage.removeItem("redirect_uri");
          navigate("/");
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Authentication failed");
          setLoading(false);
        }
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center" role="status" aria-live="polite">
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto" aria-hidden="true" />
          <p className="text-muted">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div className="max-w-md mx-auto p-6 card">
          <div className="text-error mb-4" role="alert">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-3" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Sign In Failed</h2>
            <p className="text-sm text-muted">{error}</p>
          </div>
          <a href="/" className="btn btn-primary">Return Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-center">
      <div className="space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto" aria-hidden="true" />
        <p className="text-muted">Redirecting...</p>
      </div>
    </div>
  );
}