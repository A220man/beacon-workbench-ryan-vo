import { Outlet, Link, useLocation, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserInfo, fetchLogout } from "@/api/auth";
import { clearAuthToken, getAuthToken } from "@/api/client";

interface UserInfo {
  sub: string;
  email: string | null;
  name: string | null;
  roles: string[];
}

export function Layout() {
  const location = useLocation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/analysis", label: "Analysis" },
    { path: "/settings", label: "Settings" },
  ];

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const userInfo = await fetchUserInfo();
        if (mounted) setUser(userInfo);
      } catch {
        // Token invalid or expired
        if (mounted) {
          clearAuthToken();
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await fetchLogout();
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  if (loading) {
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
          </div>
        </header>
        <main className="flex-1 container py-6 w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent" aria-hidden="true" />
        </main>
      </div>
    );
  }

  const isAuthenticated = !!user;

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
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-muted hover:text-text hover:bg-bg"
                  }`
                }
                aria-current={location.pathname === link.path ? "page" : undefined}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">v1.0.0</span>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">
                  {user?.name || user?.email || user?.sub}
                </span>
                <span className="px-2 py-1 text-xs rounded bg-primary-light text-primary font-medium">
                  {user?.roles?.includes("admin") ? "Admin" : user?.roles?.includes("operator") ? "Operator" : "Viewer"}
                </span>
                <button onClick={handleLogout} className="btn btn-secondary text-sm">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary text-sm">
                Sign In
              </Link>
            )}
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