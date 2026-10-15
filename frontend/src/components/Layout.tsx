import { Outlet, Link, useLocation } from "react-router-dom";

export function Layout() {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/analysis", label: "Analysis" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-bg-card sticky top-0 z-10">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg" aria-label="Beacon Workbench Home">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="6" fill="var(--color-primary)" />
              <path d="M14 7v14M7 14h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span>Beacon Workbench</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "bg-primary-light text-primary"
                    : "text-muted hover:text-text hover:bg-bg"
                }`}
                aria-current={location.pathname === link.path ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">v1.0.0</span>
            <button className="btn btn-secondary text-sm" disabled>
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 w-full">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-bg-card py-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
          <p>
            Beacon Workbench \u00A9 2025 Ryan Vo {" "}<a href="mailto:ryandtvo@gmail.com">ryandtvo@gmail.com</a>
          </p>
          <p>
            MIT License · <a href="https://github.com/A220man/beacon-workbench-ryan-vo" target="_blank" rel="noopener">GitHub</a>
          </p>
        </div>
      </footer>
    </div>
  );
}