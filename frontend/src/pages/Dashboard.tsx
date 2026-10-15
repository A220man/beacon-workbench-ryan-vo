import { HealthStatus } from "@/components/HealthStatus";

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted mt-1">Welcome to Beacon Workbench - Flutter Developer Tools Platform</p>
      </div>

      <section aria-labelledby="health-heading" className="space-y-4">
        <h2 id="health-heading" className="text-lg font-medium">System Health</h2>
        <HealthStatus />
      </section>

      <section aria-labelledby="features-heading" className="space-y-4">
        <h2 id="features-heading" className="text-lg font-medium">Available Workflows</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">Flutter Project Analysis</h3>
            <p className="text-sm text-muted mb-3">Upload a Flutter project for static analysis of state management, performance patterns, and architecture.</p>
            <button className="btn btn-primary text-sm" disabled>Coming Soon</button>
          </article>

          <article className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">State Reuse Detection</h3>
            <p className="text-sm text-muted mb-3">Identifies duplicated state logic patterns (Issue #51752) and recommends hooks or provider extraction.</p>
            <button className="btn btn-primary text-sm" disabled>Coming Soon</button>
          </article>

          <article className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">Performance Profiling</h3>
            <p className="text-sm text-muted mb-3">Detects render jank, heavy widgets, and animation frame drops (Issue #101227) with fiber-like scheduling suggestions.</p>
            <button className="btn btn-primary text-sm" disabled>Coming Soon</button>
          </article>

          <article className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">Web SEO Readiness</h3>
            <p className="text-sm text-muted mb-3">Checks Flutter web apps for indexability, semantic HTML, and initial paint performance (Issue #46789).</p>
            <button className="btn btn-primary text-sm" disabled>Coming Soon</button>
          </article>

          <article className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">Code Push Readiness</h3>
            <p className="text-sm text-muted mb-3">Evaluates app structure for over-the-air update compatibility (Issue #14330) with Shorebird integration guidance.</p>
            <button className="btn btn-primary text-sm" disabled>Coming Soon</button>
          </article>

          <article className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium mb-2">Multi-Window Support</h3>
            <p className="text-sm text-muted mb-3">Analyzes desktop apps for multi-window coordination patterns (Issue #30701) and embedding API readiness.</p>
            <button className="btn btn-primary text-sm" disabled>Coming Soon</button>
          </article>
        </div>
      </section>

      <section aria-labelledby="quick-start-heading" className="space-y-4">
        <h2 id="quick-start-heading" className="text-lg font-medium">Quick Start</h2>
        <div className="card p-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-light text-primary text-center text-xs leading-6 font-medium">1</span>
              <div>
                <strong>Configure Keycloak:</strong> Run <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">docker compose up -d keycloak</code> and import the realm.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-light text-primary text-center text-xs leading-6 font-medium">2</span>
              <div>
                <strong>Start Backend:</strong> <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">cd backend && .venv/bin/uvicorn app.main:app --reload</code>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-light text-primary text-center text-xs leading-6 font-medium">3</span>
              <div>
                <strong>Start Frontend:</strong> <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">cd frontend && npm run dev</code>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-light text-primary text-center text-xs leading-6 font-medium">4</span>
              <div>
                <strong>Open App:</strong> Navigate to <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">http://127.0.0.1:5173</code>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}