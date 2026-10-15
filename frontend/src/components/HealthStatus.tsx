import { useEffect, useState } from "react";
import { fetchDetailedHealth, type DetailedHealthResponse } from "@/api/health";

export function HealthStatus() {
  const [health, setHealth] = useState<DetailedHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadHealth() {
      try {
        setLoading(true);
        const data = await fetchDetailedHealth();
        if (mounted) {
          setHealth(data);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to load health status");
          setHealth(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHealth();
    const interval = setInterval(loadHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && !health) {
    return (
      <div className="card p-4 flex items-center gap-3" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <span className="text-muted">Checking backend health...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4 border-error">
        <div className="flex items-center gap-2 text-error">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <strong>Backend Unavailable</strong>
        </div>
        <p className="text-sm text-muted mt-2">{error}</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="card p-4 text-center text-muted">
        No health data available
      </div>
    );
  }

  const isHealthy = health.status === "healthy";
  const statusColor = isHealthy ? "success" : "warning";

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`badge badge-${statusColor}`}
            aria-label={`Status: ${health.status}`}
          >
            {health.status.toUpperCase()}
          </span>
          <div>
            <div className="font-medium">Beacon Workbench API</div>
            <div className="text-sm text-muted">v{health.version} · {health.environment}</div>
          </div>
        </div>
        <div className="text-right text-sm text-muted">
          <div>Database: <span className="font-medium">{health.database}</span></div>
          <div>Config: <span className="font-medium">{health.checks.config || "unknown"}</span></div>
        </div>
      </div>

      <details className="w-full">
        <summary className="text-sm text-muted cursor-pointer hover:text-primary">
          View detailed checks
        </summary>
        <div className="mt-3 p-3 bg-muted/30 rounded text-sm font-mono">
          <pre>{JSON.stringify(health.checks, null, 2)}</pre>
        </div>
      </details>
    </div>
  );
}