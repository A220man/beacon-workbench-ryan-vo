import { Finding, FindingSeverity, FindingCategory } from "@/types/analysis";

interface FindingCardProps {
  finding: Finding;
  onClick?: () => void;
}

const severityStyles: Record<FindingSeverity, string> = {
  [FindingSeverity.INFO]: "bg-blue-100 text-blue-800 border-blue-200",
  [FindingSeverity.WARNING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
  [FindingSeverity.ERROR]: "bg-red-100 text-red-800 border-red-200",
};

const severityIcons: Record<FindingSeverity, string> = {
  [FindingSeverity.INFO]: "ℹ️",
  [FindingSeverity.WARNING]: "⚠️",
  [FindingSeverity.ERROR]: "❌",
};

const categoryLabels: Record<FindingCategory, string> = {
  [FindingCategory.STATE_REUSE]: "State Reuse",
  [FindingCategory.PERFORMANCE]: "Performance",
  [FindingCategory.ARCHITECTURE]: "Architecture",
  [FindingCategory.BEST_PRACTICE]: "Best Practice",
};

export function FindingCard({ finding, onClick }: FindingCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">
          {severityIcons[finding.severity]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 truncate">
              {finding.title}
            </h4>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                severityStyles[finding.severity]
              }`}
            >
              {finding.severity.toUpperCase()}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border-gray-200"
            >
              {categoryLabels[finding.category]}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{finding.description}</p>
          {(finding.file_path || finding.line_number) && (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              {finding.file_path && (
                <span className="font-mono truncate max-w-xs">
                  {finding.file_path}
                  {finding.line_number && `:${finding.line_number}`}
                </span>
              )}
            </div>
          )}
          {finding.recommendation && (
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
              <strong>Recommendation:</strong> {finding.recommendation}
            </div>
          )}
          {finding.code_snippet && (
            <details className="mt-3">
              <summary className="text-sm text-gray-500 cursor-pointer">
                Show code snippet
              </summary>
              <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                <code>{finding.code_snippet}</code>
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
