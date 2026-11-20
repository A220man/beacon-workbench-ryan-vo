import { render, screen, waitFor } from "@testing-library/react";
import { AnalysisList } from "./AnalysisList";
import { vi } from "vitest";

vi.mock("@/api/analysis", () => ({
  listAnalyses: vi.fn(() => Promise.resolve({ analyses: [], total: 0, limit: 20, offset: 0 })),
  deleteAnalysis: vi.fn(),
  uploadProject: vi.fn(),
  importFromGit: vi.fn(),
}));

describe("AnalysisList", () => {
  it("renders the analysis dashboard heading", async () => {
    render(<AnalysisList />);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Analysis Dashboard/i })).toBeInTheDocument());
  });

  it("shows empty state when no analyses", async () => {
    render(<AnalysisList />);
    await waitFor(() => expect(screen.getByText(/No analyses yet/i)).toBeInTheDocument());
  });
});
