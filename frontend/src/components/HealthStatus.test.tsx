import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HealthStatus } from "@/components/HealthStatus";
import { fetchDetailedHealth, type DetailedHealthResponse } from "@/api/health";

vi.mock("@/api/health", () => ({
  fetchDetailedHealth: vi.fn(),
}));

const mockFetchDetailedHealth = vi.mocked(fetchDetailedHealth);

function renderWithRouter(component: React.ReactNode) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe("HealthStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    let resolvePromise: (value: DetailedHealthResponse) => void;
    const promise = new Promise<DetailedHealthResponse>((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchDetailedHealth.mockReturnValue(promise);

    renderWithRouter(<HealthStatus />);

    expect(screen.getByText("Checking backend health...")).toBeInTheDocument();
    expect(screen.getByRole("status", { hidden: true })).toBeInTheDocument();

    resolvePromise!({
      status: "healthy",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      checks: { database: "connected", config: "loaded" },
    });
  });

  it("displays healthy status when API returns healthy", async () => {
    mockFetchDetailedHealth.mockResolvedValue({
      status: "healthy",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      checks: { database: "connected", config: "loaded" },
    });

    renderWithRouter(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText("HEALTHY")).toBeInTheDocument();
    });

    expect(screen.getByText("Beacon Workbench API")).toBeInTheDocument();
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
  });

  it("displays degraded status when API returns degraded", async () => {
    mockFetchDetailedHealth.mockResolvedValue({
      status: "degraded",
      version: "1.0.0",
      environment: "development",
      database: "disconnected",
      checks: { database: "disconnected", config: "loaded" },
    });

    renderWithRouter(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText("DEGRADED")).toBeInTheDocument();
    });
  });

  it("displays error state when API fails", async () => {
    mockFetchDetailedHealth.mockRejectedValue(new Error("Network error"));

    renderWithRouter(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText("Backend Unavailable")).toBeInTheDocument();
    });

    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows detailed checks when expanded", async () => {
    mockFetchDetailedHealth.mockResolvedValue({
      status: "healthy",
      version: "1.0.0",
      environment: "development",
      database: "connected",
      checks: { database: "connected", config: "loaded" },
    });

    renderWithRouter(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText("HEALTHY")).toBeInTheDocument();
    });

    const detailsSummary = screen.getByText("View detailed checks");
    detailsSummary.click();

    await waitFor(() => {
      expect(screen.getByText(/database.*connected/)).toBeInTheDocument();
      expect(screen.getByText(/config.*loaded/)).toBeInTheDocument();
    });
  });
});