import { render, screen, fireEvent } from "@testing-library/react";
import { FindingCard } from "./FindingCard";
import { FindingSeverity, FindingCategory } from "@/types/analysis";

const mockFinding = {
  id: "test-1",
  title: "Test Finding",
  description: "This is a test finding description",
  severity: FindingSeverity.WARNING,
  category: FindingCategory.PERFORMANCE,
  file_path: "lib/main.dart",
  line_number: 42,
  recommendation: "Fix this issue",
  code_snippet: "const x = 1;",
};

describe("FindingCard", () => {
  it("renders finding title and description", () => {
    render(<FindingCard finding={mockFinding} />);
    expect(screen.getByText("Test Finding")).toBeInTheDocument();
    expect(screen.getByText("This is a test finding description")).toBeInTheDocument();
  });

  it("renders severity badge", () => {
    render(<FindingCard finding={mockFinding} />);
    expect(screen.getByText("WARNING")).toBeInTheDocument();
  });

  it("renders category badge", () => {
    render(<FindingCard finding={mockFinding} />);
    expect(screen.getByText("Performance")).toBeInTheDocument();
  });

  it("renders file path and line number", () => {
    render(<FindingCard finding={mockFinding} />);
    expect(screen.getByText("lib/main.dart:42")).toBeInTheDocument();
  });

  it("renders recommendation", () => {
    render(<FindingCard finding={mockFinding} />);
    expect(screen.getByText("Recommendation:")).toBeInTheDocument();
    expect(screen.getByText("Fix this issue")).toBeInTheDocument();
  });

  it("renders code snippet in details", () => {
    render(<FindingCard finding={mockFinding} />);
    const summary = screen.getByText("Show code snippet");
    fireEvent.click(summary);
    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<FindingCard finding={mockFinding} onClick={handleClick} />);
    fireEvent.click(screen.getByText("Test Finding"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles missing optional fields", () => {
    const minimalFinding = {
      id: "test-2",
      title: "Minimal Finding",
      description: "No optional fields",
      severity: FindingSeverity.INFO,
      category: FindingCategory.BEST_PRACTICE,
    };
    render(<FindingCard finding={minimalFinding} />);
    expect(screen.getByText("Minimal Finding")).toBeInTheDocument();
    expect(screen.getByText("INFO")).toBeInTheDocument();
    expect(screen.getByText("Best Practice")).toBeInTheDocument();
    expect(screen.queryByText("Recommendation:")).not.toBeInTheDocument();
  });
});
