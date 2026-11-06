
"""
Flutter project analysis engine.

Implements static analysis for:
- Widget extraction and categorization
- State management pattern detection
- Dependency analysis
- State reuse issues (Issue 51752 patterns)
- Performance anti-patterns (Issue 101227)
"""

import os
import re
import zipfile
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field
from enum import Enum
import json


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class FindingSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class FindingCategory(str, Enum):
    STATE_REUSE = "state_reuse"
    PERFORMANCE = "performance"
    ARCHITECTURE = "architecture"
    DEPENDENCY = "dependency"
    BEST_PRACTICE = "best_practice"


@dataclass
class Finding:
    id: str
    title: str
    description: str
    severity: FindingSeverity
    category: FindingCategory
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    recommendation: Optional[str] = None
    code_snippet: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "severity": self.severity.value,
            "category": self.category.value,
            "file_path": self.file_path,
            "line_number": self.line_number,
            "recommendation": self.recommendation,
            "code_snippet": self.code_snippet,
        }


@dataclass
class WidgetInfo:
    name: str
    file_path: str
    line_number: int
    is_stateless: bool
    is_stateful: bool
    parent_widgets: List[str] = field(default_factory=list)
    child_widgets: List[str] = field(default_factory=list)
    state_variables: List[str] = field(default_factory=list)
    build_method_lines: int = 0


@dataclass
class StatePattern:
    name: str
    pattern_type: str  # "provider", "riverpod", "bloc", "cubit", "getx", "mobx", "setstate", "inherited"
    files: List[str] = field(default_factory=list)
    confidence: float = 0.0


@dataclass
class DependencyInfo:
    name: str
    version: str
    is_dev: bool = False
    is_transitive: bool = False


@dataclass
class AnalysisReport:
    project_name: str
    project_path: str
    status: AnalysisStatus
    total_files_analyzed: int = 0
    total_lines_of_code: int = 0
    widgets: List[WidgetInfo] = field(default_factory=list)
    state_patterns: List[StatePattern] = field(default_factory=list)
    dependencies: List[DependencyInfo] = field(default_factory=list)
    findings: List[Finding] = field(default_factory=list)
    summary: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_name": self.project_name,
            "project_path": self.project_path,
            "status": self.status.value,
            "total_files_analyzed": self.total_files_analyzed,
            "total_lines_of_code": self.total_lines_of_code,
            "widgets": [w.__dict__ for w in self.widgets],
            "state_patterns": [s.__dict__ for s in self.state_patterns],
            "dependencies": [d.__dict__ for d in self.dependencies],
            "findings": [f.to_dict() for f in self.findings],
            "summary": self.summary,
            "error_message": self.error_message,
        }


class FlutterProjectAnalyzer:
    """Main analyzer for Flutter projects."""

    # Issue 51752: State reuse patterns that cause bugs
    STATE_REUSE_PATTERNS = [
        {
            "id": "SR001",
            "pattern": r"setState\s*\(\s*\)\s*\{[^}]*\.add\s*\(",
            "title": "setState with list mutation",
            "description": "Mutating a list inside setState without creating a new list reference can cause UI not to update properly.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.STATE_REUSE,
            "recommendation": "Use immutable patterns: create new list with [...list, newItem] or list.toList().add(item)",
        },
        {
            "id": "SR002",
            "pattern": r"setState\s*\(\s*\)\s*\{[^}]*\.remove\s*\(",
            "title": "setState with list removal mutation",
            "description": "Mutating a list by removing items inside setState without creating a new list reference.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.STATE_REUSE,
            "recommendation": "Use list.where((item) => condition).toList() or create new filtered list",
        },
        {
            "id": "SR003",
            "pattern": r"setState\s*\(\s*\)\s*\{[^}]*\.\w+\s*=\s*",
            "title": "setState with direct property mutation on nested object",
            "description": "Directly mutating properties of nested objects inside setState may not trigger rebuilds.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.STATE_REUSE,
            "recommendation": "Create new object instances with copyWith or {...obj, property: newValue}",
        },
        {
            "id": "SR004",
            "pattern": r"late\s+\w+\s+\w+;\s*\n\s*@override\s+void\s+initState\s*\(\s*\)\s*\{[^}]*\w+\s*=",
            "title": "Late initialization in initState with setState dependency",
            "description": "Late-initialized variables assigned in initState that are used in build may cause issues if accessed before init.",
            "severity": FindingSeverity.INFO,
            "category": FindingCategory.STATE_REUSE,
            "recommendation": "Initialize in declaration or use nullable type with proper null checks",
        },
        {
            "id": "SR005",
            "pattern": r"ChangeNotifier\s*\)\s*\{[^}]*notifyListeners\s*\(\s*\)",
            "title": "ChangeNotifier with notifyListeners in setter",
            "description": "Calling notifyListeners in setters without checking if value actually changed can cause unnecessary rebuilds.",
            "severity": FindingSeverity.INFO,
            "category": FindingCategory.STATE_REUSE,
            "recommendation": "Add equality check before calling notifyListeners",
        },
    ]

    # Issue 101227: Performance anti-patterns
    PERFORMANCE_PATTERNS = [
        {
            "id": "PERF001",
            "pattern": r"ListView\.builder\s*\(\s*[^)]*itemBuilder\s*:\s*\([^)]*\)\s*=>\s*\{[^}]*setState",
            "title": "setState inside ListView.builder itemBuilder",
            "description": "Calling setState inside itemBuilder causes full list rebuild on every frame.",
            "severity": FindingSeverity.ERROR,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Move state updates outside itemBuilder; use keys for list items",
        },
        {
            "id": "PERF002",
            "pattern": r"build\s*\(\s*\)\s*\{[^}]*\w+\s*=\s*\w+\(\)[^}]*return",
            "title": "Expensive computation in build method",
            "description": "Computing values in build method that don't depend on build context runs on every frame.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Move computation to initState, use memoization, or compute in didUpdateWidget",
        },
        {
            "id": "PERF003",
            "pattern": r"Opacity\s*\(\s*opacity\s*:\s*0\.0",
            "title": "Opacity(0.0) instead of Visibility/Offstage",
            "description": "Opacity(0.0) still renders the widget; use Visibility or Offstage for truly hidden widgets.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Replace Opacity(0.0) with Visibility(visible: false) or Offstage()",
        },
        {
            "id": "PERF004",
            "pattern": r"setState\s*\(\s*\)\s*\{[^}]*\.sort\s*\(",
            "title": "Sorting list inside setState",
            "description": "Sorting a list in-place inside setState triggers rebuild but may not work correctly with keys.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Create sorted copy: [...list].sort(...) or use List.from(list)..sort(...)",
        },
        {
            "id": "PERF005",
            "pattern": r"const\s+\w+\s*\(\s*\)\s*;",
            "title": "Missing const constructor",
            "description": "Widgets without const constructors rebuild unnecessarily.",
            "severity": FindingSeverity.INFO,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Add const constructor where possible",
        },
        {
            "id": "PERF006",
            "pattern": r"AnimatedBuilder\s*\(\s*[^)]*animation\s*:\s*\w+[^)]*builder\s*:\s*\([^)]*\)\s*\{[^}]*return\s+\w+\(",
            "title": "AnimatedBuilder rebuilding static widgets",
            "description": "AnimatedBuilder rebuilds entire subtree; extract static widgets as child parameter.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Pass static widgets as child parameter to AnimatedBuilder",
        },
        {
            "id": "PERF007",
            "pattern": r"FutureBuilder\s*\(\s*future\s*:\s*\w+\(\)",
            "title": "FutureBuilder with new Future in build",
            "description": "Creating new Future in build method restarts the future on every rebuild.",
            "severity": FindingSeverity.ERROR,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Store Future in state variable initialized in initState",
        },
        {
            "id": "PERF008",
            "pattern": r"StreamBuilder\s*\(\s*stream\s*:\s*\w+\(\)",
            "title": "StreamBuilder with new Stream in build",
            "description": "Creating new Stream in build method recreates stream on every rebuild.",
            "severity": FindingSeverity.ERROR,
            "category": FindingCategory.PERFORMANCE,
            "recommendation": "Store Stream in state variable initialized in initState",
        },
    ]

    ARCHITECTURE_PATTERNS = [
        {
            "id": "ARCH001",
            "pattern": r"class\s+\w+\s+extends\s+State<\w+>\s*\{[^}]*Widget\s+build\s*\(\s*\)\s*\{[^}]*if\s*\([^)]*\)\s*return\s+Container\s*\(\s*\)",
            "title": "Empty Container() as conditional return",
            "description": "Returning empty Container() for conditional rendering; use SizedBox.shrink() or null with conditional.",
            "severity": FindingSeverity.INFO,
            "category": FindingCategory.ARCHITECTURE,
            "recommendation": "Use SizedBox.shrink() or conditional widget rendering",
        },
        {
            "id": "ARCH002",
            "pattern": r"BuildContext\s+\w+\s*\)\s*\{[^}]*Navigator\.of\s*\(\s*\w+\s*\)",
            "title": "Using BuildContext across async gaps",
            "description": "Using BuildContext after async operations can cause crashes if widget is disposed.",
            "severity": FindingSeverity.WARNING,
            "category": FindingCategory.ARCHITECTURE,
            "recommendation": "Check mounted before using context after async, or use context.mounted (Flutter 3.7+)",
        },
    ]

    DEPENDENCY_PATTERNS = [
        {
            "id": "DEP001",
            "pattern": r"dependencies:\s*\n\s*flutter:\s*sdk:\s*flutter",
            "title": "Flutter SDK dependency declared explicitly",
            "description": "Flutter SDK is implicit; explicit declaration is redundant.",
            "severity": FindingSeverity.INFO,
            "category": FindingCategory.DEPENDENCY,
            "recommendation": "Remove explicit flutter: sdk: flutter from dependencies",
        },
    ]

    ALL_PATTERNS = STATE_REUSE_PATTERNS + PERFORMANCE_PATTERNS + ARCHITECTURE_PATTERNS + DEPENDENCY_PATTERNS

    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.report = AnalysisReport(
            project_name=self.project_path.name,
            project_path=str(self.project_path),
            status=AnalysisStatus.RUNNING,
        )

    def analyze(self) -> AnalysisReport:
        """Run full analysis on the Flutter project."""
        try:
            # Find pubspec.yaml
            pubspec_path = self.project_path / "pubspec.yaml"
            if not pubspec_path.exists():
                pubspec_path = self.project_path / "pubspec.yml"
            if not pubspec_path.exists():
                self.report.status = AnalysisStatus.FAILED
                self.report.error_message = "No pubspec.yaml found in project root"
                return self.report

            # Parse dependencies
            self._parse_dependencies(pubspec_path)

            # Find and analyze Dart files
            dart_files = list(self.project_path.rglob("*.dart"))
            self.report.total_files_analyzed = len(dart_files)

            for dart_file in dart_files:
                self._analyze_dart_file(dart_file)

            # Detect state management patterns
            self._detect_state_patterns(dart_files)

            # Generate summary
            self._generate_summary()

            self.report.status = AnalysisStatus.COMPLETED

        except Exception as e:
            self.report.status = AnalysisStatus.FAILED
            self.report.error_message = str(e)

        return self.report

    def _parse_dependencies(self, pubspec_path: Path) -> None:
        """Parse pubspec.yaml for dependencies."""
        try:
            import yaml
            with open(pubspec_path, "r") as f:
                data = yaml.safe_load(f)

            deps = data.get("dependencies", {})
            dev_deps = data.get("dev_dependencies", {})

            for name, info in deps.items():
                if name == "flutter":
                    continue
                if isinstance(info, str):
                    version = info
                elif isinstance(info, dict):
                    version = info.get("version", info.get("path", info.get("git", "unknown"))) or "unknown"
                else:
                    version = "unknown"
                self.report.dependencies.append(DependencyInfo(name=name, version=str(version), is_dev=False))

            for name, info in dev_deps.items():
                if isinstance(info, str):
                    version = info
                elif isinstance(info, dict):
                    version = info.get("version", info.get("path", info.get("git", "unknown"))) or "unknown"
                else:
                    version = "unknown"
                self.report.dependencies.append(DependencyInfo(name=name, version=str(version), is_dev=True))

        except Exception:
            pass  # Skip dependency parsing if yaml not available or parse fails

    def _analyze_dart_file(self, file_path: Path) -> None:
        """Analyze a single Dart file."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                lines = content.splitlines()

            self.report.total_lines_of_code += len(lines)

            # Extract widgets
            self._extract_widgets(file_path, content, lines)

            # Check for findings
            self._check_patterns(file_path, content, lines)

        except Exception:
            pass  # Skip files that can't be read

    def _extract_widgets(self, file_path: Path, content: str, lines: List[str]) -> None:
        """Extract widget classes from Dart file."""
        # Pattern for StatelessWidget
        stateless_pattern = re.compile(r"class\s+(\w+)\s+extends\s+StatelessWidget")
        # Pattern for StatefulWidget
        stateful_pattern = re.compile(r"class\s+(\w+)\s+extends\s+StatefulWidget")
        # Pattern for State class
        state_pattern = re.compile(r"class\s+_?(\w+State)\s+extends\s+State<(\w+)>")

        for match in stateless_pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            widget_name = match.group(1)
            self.report.widgets.append(
                WidgetInfo(
                    name=widget_name,
                    file_path=str(file_path.relative_to(self.project_path)),
                    line_number=line_num,
                    is_stateless=True,
                    is_stateful=False,
                )
            )

        for match in stateful_pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            widget_name = match.group(1)
            self.report.widgets.append(
                WidgetInfo(
                    name=widget_name,
                    file_path=str(file_path.relative_to(self.project_path)),
                    line_number=line_num,
                    is_stateless=False,
                    is_stateful=True,
                )
            )

        for match in state_pattern.finditer(content):
            line_num = content[: match.start()].count("\n") + 1
            state_name = match.group(1)
            widget_name = match.group(2)
            self.report.widgets.append(
                WidgetInfo(
                    name=f"{widget_name}State",
                    file_path=str(file_path.relative_to(self.project_path)),
                    line_number=line_num,
                    is_stateless=False,
                    is_stateful=True,
                )
            )

    def _check_patterns(self, file_path: Path, content: str, lines: List[str]) -> None:
        """Check content against all analysis patterns."""
        rel_path = str(file_path.relative_to(self.project_path))

        for pattern_def in self.ALL_PATTERNS:
            pattern = pattern_def["pattern"]
            matches = list(re.finditer(pattern, content, re.MULTILINE | re.DOTALL))

            for match in matches:
                line_num = content[: match.start()].count("\n") + 1
                # Get context lines
                start = max(0, line_num - 3)
                end = min(len(lines), line_num + 2)
                code_snippet = "\n".join(lines[start:end])

                finding = Finding(
                    id=pattern_def["id"],
                    title=pattern_def["title"],
                    file_path=rel_path,
                    line_number=line_num,
                    recommendation=pattern_def["recommendation"],
                    code_snippet=code_snippet,
                )
                self.report.findings.append(finding)

    def _detect_state_patterns(self, dart_files: List[Path]) -> None:
        """Detect state management patterns used in the project."""
        patterns_detected: Dict[str, StatePattern] = {}

        # Keywords for each pattern
        state_keywords = {
            "provider": ["ChangeNotifier", "ChangeNotifierProvider", "Consumer<", "Provider<", "MultiProvider"],
            "riverpod": ["ProviderScope", "StateProvider", "StateNotifierProvider", "FutureProvider", "StreamProvider", "ref.watch", "ref.read"],
            "bloc": ["BlocProvider", "BlocBuilder", "BlocListener", "BlocConsumer", "extends Bloc", "extends Cubit"],
            "cubit": ["Cubit", "emit(", "CubitProvider"],
            "getx": ["GetX", "GetBuilder", "Get.put", "Get.find", "GetxController", "Obx("],
            "mobx": ["Observer", "observable", "action", "computed", "Store", "ReactionDisposer"],
            "setstate": ["setState(", "State<"],
            "inherited": ["InheritedWidget", "InheritedNotifier", "dependOnInheritedWidgetOfExactType"],
        }

        for file_path in dart_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                for pattern_name, keywords in state_keywords.items():
                    matches = sum(1 for kw in keywords if kw in content)
                    if matches > 0:
                        if pattern_name not in patterns_detected:
                            patterns_detected[pattern_name] = StatePattern(
                                name=pattern_name.capitalize(),
                                pattern_type=pattern_name,
                            )
                        patterns_detected[pattern_name].files.append(str(file_path.relative_to(self.project_path)))
                        patterns_detected[pattern_name].confidence = min(1.0, matches * 0.15)

            except Exception:
                continue

        self.report.state_patterns = list(patterns_detected.values())

    def _generate_summary(self) -> None:
        """Generate analysis summary."""
        findings_by_severity: Dict[str, int] = {}
        findings_by_category: Dict[str, int] = {}

        for finding in self.report.findings:
            findings_by_severity[finding.severity.value] = findings_by_severity.get(finding.severity.value, 0) + 1
            findings_by_category[finding.category.value] = findings_by_category.get(finding.category.value, 0) + 1

        widget_count = len(self.report.widgets)
        stateless_count = sum(1 for w in self.report.widgets if w.is_stateless)
        stateful_count = sum(1 for w in self.report.widgets if w.is_stateful)

        self.report.summary = {
            "widgets": {
                "total": widget_count,
                "stateless": stateless_count,
                "stateful": stateful_count,
            },
            "state_patterns_detected": [p.name for p in self.report.state_patterns],
            "dependencies_count": len(self.report.dependencies),
            "findings_by_severity": findings_by_severity,
            "findings_by_category": findings_by_category,
            "total_findings": len(self.report.findings),
        }


def analyze_flutter_project(project_path: str) -> AnalysisReport:
    """Convenience function to analyze a Flutter project."""
    analyzer = FlutterProjectAnalyzer(project_path)
    return analyzer.analyze()


def analyze_flutter_zip(zip_path: str) -> AnalysisReport:
    """Analyze a Flutter project from a zip file."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        # Find the project root (directory containing pubspec.yaml)
        project_root = None
        for root, dirs, files in os.walk(tmpdir):
            if "pubspec.yaml" in files or "pubspec.yml" in files:
                project_root = root
                break

        if not project_root:
            raise ValueError("No pubspec.yaml found in zip archive")

        return analyze_flutter_project(project_root)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        path = sys.argv[1]
        if path.endswith(".zip"):
            report = analyze_flutter_zip(path)
        else:
            report = analyze_flutter_project(path)
        print(json.dumps(report.to_dict(), indent=2))
    else:
        print("Usage: python analysis.py <project_path_or_zip>")
