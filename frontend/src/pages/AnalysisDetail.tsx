import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getAnalysis, getAnalysisFindings, exportAnalysis, deleteAnalysis } from "@/api/analysis";
import { FindingCard } from "@/components/FindingCard";
import type { AnalysisSummary, Finding, FindingFilter } from "@/types/analysis";
import { FindingSeverity, FindingCategory } from "@/types/analysis";

export function AnalysisDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingsLoading, setFindingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState<FindingSeverity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | "all">("all");
  const [filePathFilter, setFilePathFilter] = useState("");
  const [exporting, setExporting] = useState<"json" | "pdf" | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnalysis();
      fetchFindings();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getAnalysis(id);
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  const fetchFindings = async () => {
    if (!id) return;
    setFindingsLoading(true);
    try {
      const filter: FindingFilter = {};
      if (severityFilter !== "all") filter.severity = severityFilter;
      if (categoryFilter !== "all") filter.category = categoryFilter;
      if (filePathFilter) filter.file_path = filePathFilter;

      const data = await getAnalysisFindings(id, filter);
      setFindings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load findings");
    } finally {
      setFindingsLoading(false);
    }
  };

  const handleExport = async (format: "json" | "pdf") => {
    if (!id) return;
    setExporting(format);
    try {
      const blob = await exportAnalysis(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${analysis?.project_name || "analysis"}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;

    try {
      await deleteAnalysis(id);
      navigate("/analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Analysis not found</h2>
        <Link to="/analysis" className="btn btn-primary mt-4">
          Back to Analyses
        </Link>
      </div>
    );
  }

  const filteredFindings = findings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/analysis" className="text-primary hover:underline text-sm mb-2 inline-block">
            ← Back to Analyses
          </Link>
          <h1 className="text-2xl font-bold">{analysis.project_name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as FindingSeverity | "all")}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">All Severities</option>
            <option value={FindingSeverity.ERROR}>Error</option>
            <option value={FindingSeverity.WARNING}>Warning</option>
            <option value={FindingSeverity.INFO}>Info</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as FindingCategory | "all")}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">All Categories</option>
            <option value={FindingCategory.STATE_REUSE}>State Reuse</option>
            <option value={FindingCategory.PERFORMANCE}>Performance</option>
            <option value={FindingCategory.ARCHITECTURE}>Architecture</option>
            <option value={FindingCategory.BEST_PRACTICE}>Best Practice</option>
          </select>
          <input
            type="text"
            value={filePathFilter}
            onChange={(e) => setFilePathFilter(e.target.value)}
            placeholder="Filter by file path..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm max-w-xs"
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Files Analyzed</div>
          <div className="text-3xl font-bold text-gray-900">{analysis.total_files_analyzed}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Lines of Code</div>
          <div className="text-3xl font-bold text-gray-900">{analysis.total_lines_of_code.toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Widgets</div>
          <div className="text-3xl font-bold text-gray-900">{analysis.widgets_count}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">State Patterns</div>
          <div className="text-3xl font-bold text-gray-900">{analysis.state_patterns_count}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Dependencies</div>
          <div className="text-3xl font-bold text-gray-900">{analysis.dependencies_count}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Total Findings</div>
          <div className="text-3xl font-bold text-gray-900">{analysis.findings_count}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Errors</div>
          <div className="text-3xl font-bold text-red-600">{analysis.findings_by_severity[FindingSeverity.ERROR] || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-sm text-gray-500">Warnings</div>
          <div className="text-3xl font-bold text-yellow-600">{analysis.findings_by_severity[FindingSeverity.WARNING] || 0}</div>
        </div>
      </div>

      {analysis.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-1">Analysis Error</h3>
          <p className="text-red-700 text-sm">{analysis.error_message}</p>
        </div>
      )}

      {/* Findings */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Findings ({filteredFindings.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("json")}
              disabled={exporting !== null}
              className="btn btn-secondary btn-sm"
            >
              {exporting === "json" ? "Exporting..." : "Export JSON"}
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="btn btn-secondary btn-sm"
            >
              {exporting === "pdf" ? "Exporting..." : "Export PDF"}
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
            >
              Delete Analysis
            </button>
          </div>
        </div>

        {findingsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No findings match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredFindings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
