import { useState } from "react";
import { fetchLogin } from "@/api/auth";

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const redirectUri = "http://127.0.0.1:5173/callback";

    try {
      const { auth_url, state, code_verifier } = await fetchLogin(redirectUri);

      // Store PKCE verifier and state in sessionStorage
      sessionStorage.setItem("pkce_verifier", code_verifier);
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("redirect_uri", redirectUri);

      // Redirect to Keycloak
      window.location.href = auth_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initiate login");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md card p-8">
        <div className="text-center mb-8">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" className="mx-auto mb-4" aria-hidden="true">
            <rect width="28" height="28" rx="6" fill="var(--color-primary)" />
            <path d="M14 7v14M7 14h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <h1 className="text-2xl font-semibold">Sign in to Beacon Workbench</h1>
          <p className="text-muted mt-2">Authenticate with Keycloak to access the platform</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-error/10 border border-error/30 text-error text-sm" role="alert">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn btn-primary w-full py-3"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redirecting...
            </>
          ) : (
            "Continue with Keycloak"
          )}
        </button>

        <div className="mt-6 text-center text-sm text-muted">
          <p>Demo mode: OIDC enabled but using local Keycloak</p>
        </div>
      </div>
    </div>
  );
}