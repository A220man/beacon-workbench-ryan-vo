import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AnalysisDetail } from "./AnalysisDetail";
import { vi } from "vitest";

vi.mock("@/api/analysis", () => ({
  getAnalysis: vi.fn(() => Promise.resolve({
    id: "analysis_1",
    project_name: "Test Project",
    status: "completed",
    total_files_analyzed: 10,
    total_lines_of_code: 1000,
    widgets_count: 5,
    state_patterns_count: 2,
    dependencies_count: 3,
    findings_count: 4,
    findings_by_severity: {},
    findings_by_category: {},
    error_message: undefined,
  })),
  getAnalysisFindings: vi.fn(() => Promise.resolve([])),
  deleteAnalysis: vi.fn(),
  exportAnalysis: vi.fn(),
}));

describe("AnalysisDetail", () => {
  it("renders analysis details", async () => {
    render(
      <MemoryRouter initialEntries={["/analysis/analysis_1"]}>
        <AnalysisDetail />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("Test Project")).toBeInTheDocument());
  });

  it("shows findings section when findings exist", async () => {
    render(
      <MemoryRouter initialEntries={["/analysis/analysis_1"]}>
        <AnalysisDetail />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText("State reuse issue", { exact: false })).toBeInTheDocument());
  });
});
