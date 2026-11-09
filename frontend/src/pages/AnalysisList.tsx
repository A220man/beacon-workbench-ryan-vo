import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  uploadProject,
  importFromGit,
  listAnalyses,
  deleteAnalysis,
} from "@/api/analysis";
import type {
  AnalysisSummary,
  AnalysisListResponse,
  UploadProjectRequest,
  GitImportRequest,
} from "@/types/analysis";
import { FindingSeverity } from "@/types/analysis";

export function AnalysisList() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProjectName, setUploadProjectName] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [gitProjectName, setGitProjectName] = useState("");

  useEffect(() => {
    fetchAnalyses();
  }, [offset]);

  const fetchAnalyses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: AnalysisListResponse = await listAnalyses(limit, offset);
      setAnalyses(response.analyses);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analyses");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const request: UploadProjectRequest = {};
      if (uploadProjectName) request.project_name = uploadProjectName;

      await uploadProject(uploadFile, request.project_name);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadProjectName("");
      fetchAnalyses();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleGitImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitUrl) {
      setUploadError("Please enter a Git URL");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const request: GitImportRequest = {
        git_url: gitUrl,
        git_branch: gitBranch,
      };
      if (gitProjectName) request.project_name = gitProjectName;

      await importFromGit(request);
      setShowGitModal(false);
      setGitUrl("");
      setGitBranch("main");
      setGitProjectName("");
      fetchAnalyses();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Git import failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;

    try {
      await deleteAnalysis(id);
      fetchAnalyses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      running: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (loading && analyses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analysis Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGitModal(true)}
            className="btn btn-secondary"
          >
            Import from Git
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            Upload Project
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {analyses.length === 0 && !loading ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No analyses yet</h3>
          <p className="mt-1 text-gray-500">
            Upload a Flutter project or import from Git to get started.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              Upload Project
            </button>
            <button
              onClick={() => setShowGitModal(true)}
              className="btn btn-secondary"
            >
              Import from Git
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Widgets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Findings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {analysis.project_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {analysis.total_lines_of_code.toLocaleString()} LOC
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(analysis.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analysis.total_files_analyzed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {analysis.widgets_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">
                          {analysis.findings_count}
                        </span>
                        {analysis.findings_by_severity[FindingSeverity.ERROR] > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            {analysis.findings_by_severity[FindingSeverity.ERROR]} E
                          </span>
                        )}
                        {analysis.findings_by_severity[FindingSeverity.WARNING] > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {analysis.findings_by_severity[FindingSeverity.WARNING]} W
                          </span>
                        )}
                        {analysis.findings_by_severity[FindingSeverity.INFO] > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {analysis.findings_by_severity[FindingSeverity.INFO]} I
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/analysis/${analysis.id}`}
                        className="text-primary hover:text-primary/80 mr-3"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(analysis.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > limit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {offset + 1} to {Math.min(offset + analyses.length, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowUploadModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold mb-4">Upload Flutter Project</h2>
              <form onSubmit={handleFileUpload}>
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm" role="alert">
                    {uploadError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Zip File
                  </label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name (optional)
                  </label>
                  <input
                    type="text"
                    value={uploadProjectName}
                    onChange={(e) => setUploadProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Auto-detected from zip"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn btn-primary"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Git Import Modal */}
      {showGitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowGitModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold mb-4">Import from Git</h2>
              <form onSubmit={handleGitImport}>
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm" role="alert">
                    {uploadError}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Git Repository URL
                  </label>
                  <input
                    type="text"
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="https://github.com/user/repo.git"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue="main"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name (optional)
                  </label>
                  <input
                    type="text"
                    value={gitProjectName}
                    onChange={(e) => setGitProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Auto-detected from repo"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGitModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn btn-primary"
                  >
                    {uploading ? "Importing..." : "Import"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
