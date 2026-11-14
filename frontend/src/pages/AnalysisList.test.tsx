import { render, screen } from "@testing-library/react";
import { AnalysisList } from "./AnalysisList";
import { vi } from "vitest";

// Mock the api/analysis module
vi.mock("@/api/analysis", () => ({
  listAnalyses: vi.fn(() => Promise.resolve({ analyses: [], total: 0, limit: 20, offset: 0 })),
  deleteAnalysis: vi.fn(),
  uploadProject: vi.fn(),
  importFromGit: vi.fn(),
}));

describe("AnalysisList", () => {
  it("renders the analysis dashboard heading", () => {
    render(<AnalysisList />);
    expect(screen.getByRole("heading", { name: /Analysis Dashboard/i })).toBeInTheDocument();
  });

  it("shows empty state when no analyses", async () => {
    (listAnalyses as jest.Mock).mockResolvedValueOnce({ analyses: [], total: 0, limit: 20, offset: 0 });
    render(<AnalysisList />);
    expect(await screen.findByText(/No analyses yet/i)).toBeInTheDocument();
  });
});
