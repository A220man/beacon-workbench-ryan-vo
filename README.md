# Beacon Workbench | Ryan Vo | AI & Machine Learning

> Work in progress. This checkpoint may be incomplete or fail tests. See PLAN.md and STATUS.md before use.


**Beacon Workbench** is an AI/ML-powered Flutter developer tools platform that helps developers analyze, monitor, and improve their Flutter applications. It addresses common pain points from the Flutter ecosystem including state management complexity, performance optimization, web/SEO readiness, and code push preparedness.

## The Problem

Flutter developers face recurring challenges that slow down development and impact app quality:

- **State Reuse Difficulty** (Issue [#51752](https://github.com/flutter/flutter/issues/51752)): Reusing `State` logic across multiple `StatefulWidget`s requires verbose boilerplate or fragile mixins, leading to copy-paste errors and missed `dispose()` calls.
- **Performance Jank** (Issue [#101227](https://github.com/flutter/flutter/issues/101227)): Heavy widgets can block the main thread, causing dropped frames. A Fiber-like scheduling approach could help but doesn't exist in Flutter.
- **Web SEO & Indexability** (Issue [#46789](https://github.com/flutter/flutter/issues/46789)): Flutter web apps render to canvas, making them invisible to search engines and breaking browser scroll behaviors.
- **Code Push / Hot Updates** (Issue [#14330](https://github.com/flutter/flutter/issues/14330)): No official out-of-band update mechanism exists, though third-party solutions like Shorebird fill the gap.

## Implemented AI/ML Approach

Beacon Workbench uses **static analysis combined with pattern matching** to detect these issues in Flutter projects:

1. **AST Parsing**: Dart source files are parsed to extract widget trees, state lifecycles, and controller usage patterns.
2. **Pattern Detection**: Rule-based detectors identify anti-patterns (e.g., `TextEditingController` created in `initState` without `dispose`, deep widget nesting causing render overhead).
3. **ML-Assisted Recommendations** (opt-in): When an LLM provider is configured, findings are enriched with contextual explanations and refactoring suggestions grounded in the actual code.

The core analysis runs **deterministically offline** without any LLM key. LLM explanations are opt-in, labeled advisory, and never fabricate successful responses.

## Intended User

Flutter developers and teams who want automated code quality insights for:
- State management architecture reviews
- Performance profiling and optimization
- Web deployment readiness checks
- Code push / OTA update preparation

## Architecture

```mermaid
graph TB
    subgraph Client
        UI[React + TypeScript + Vite SPA]
    end

    subgraph Server
        API[FastAPI + Python 3.12]
        DB[(SQLite)]
        AUTH[Keycloak OIDC]
    end

    subgraph Analysis
        ENGINE[Flutter Analysis Engine]
        LLM[LLM Provider (Optional)]
    end

    UI -->|HTTPS| API
    API --> DB
    API --> AUTH
    API --> ENGINE
    ENGINE -.->|Optional| LLM
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, SQLAlchemy, SQLite, python-jose |
| Frontend | React 18, TypeScript, Vite, React Router |
| Auth | Keycloak (OIDC + PKCE), realm import included |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions (ubuntu-latest) |

## Features

| Workflow | Description |
|----------|-------------|
| **Project Analysis** | Upload a Flutter project (zip or git URL) for static analysis |
| **State Reuse Detection** | Finds duplicated controller/initState/dispose patterns (Issue #51752) |
| **Performance Profiling** | Identifies heavy widgets, deep trees, and animation frame risks (Issue #101227) |
| **Web SEO Audit** | Checks for semantic HTML, meta tags, and initial paint metrics (Issue #46789) |
| **Code Push Readiness** | Evaluates Shorebird compatibility and Dart-to-JS compilation options (Issue #14330) |
| **Multi-Window Analysis** | Detects desktop embedding patterns for multi-window coordination (Issue #30701) |
| **Export Reports** | JSON/PDF reports with findings, severity, and remediation steps |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Or: Python 3.12 + Node 24 for local development

### Using Docker Compose (Recommended)

```bash
# Clone and enter the repository
git clone https://github.com/A220man/beacon-workbench-ryan-vo.git
cd beacon-workbench-ryan-vo

# Start all services (backend, frontend, Keycloak)
docker compose up -d --build

# Wait for services to be healthy (~30s), then open:
# Frontend: http://127.0.0.1:5173
# Backend API: http://127.0.0.1:8000/docs
# Keycloak Admin: http://127.0.0.1:8080 (admin/admin)
```

### Local Development

**Backend:**
```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp ../.env.example .env  # Edit as needed
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Keycloak:**
```bash
docker run -d --name keycloak \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USER=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  -e KC_HEALTH_ENABLED=true \
  -v ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json:ro \
  quay.io/keycloak/keycloak:26.0 start-dev --import-realm
```

### Demo Credentials (Local Only)

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin |
| Operator | operator | operator |
| Viewer | viewer | viewer |

> **Security Note**: These credentials are for local development only. The startup script **refuses demo mode in production** (`ENVIRONMENT=production` requires real Keycloak configuration and `SECRET_KEY`).

## API Reference

### Health
- `GET /api/v1/health` — Basic health check
- `GET /api/v1/health/detailed` — Detailed health with dependency checks

### Authentication
- `GET /api/v1/auth/me` — Current user info (requires Bearer token)
- `POST /api/v1/auth/token` — Token exchange (not implemented; use Keycloak directly)

### Analysis (Planned)
- `POST /api/v1/analysis` — Create new analysis from uploaded project
- `GET /api/v1/analysis` — List analyses (paginated, filterable)
- `GET /api/v1/analysis/{id}` — Get analysis details
- `GET /api/v1/analysis/{id}/export` — Export report (JSON/PDF)

## Security

### Authentication & Authorization

- **OIDC Authorization Code Flow** with PKCE via Keycloak
- **Roles**: `viewer` (read), `operator` (write), `admin` (manage)
- **Token Validation**: RS256 signatures, issuer/audience verification, JWKS caching
- **Session Management**: HttpOnly SameSite cookies for backend; SPA stores tokens in memory (sessionStorage)

### Security Limitations

- SQLite is used for development; production should use PostgreSQL
- Demo credentials are embedded in Keycloak realm import — **change in production**
- LLM API keys are server-side only; never exposed to frontend
- No hardcoded bypass in production — `ENVIRONMENT=production` enforces real OIDC

### SAML / Enterprise SSO

Keycloak supports upstream SAML IdPs through **Identity Brokering**. Configure in Keycloak Admin Console:
1. Identity Providers → Add SAML v2.0 provider
2. Map SAML attributes to Keycloak roles
3. Update realm export or configure via Admin API

This project provides the realm import; SAML setup is operator responsibility.

## Provider Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `LLM_PROVIDER` | `openai-compatible`, `anthropic`, `gemini`, `ollama` | No |
| `LLM_MODEL` | Model identifier (e.g., `gpt-4o-mini`, `claude-3-haiku`) | No |
| `LLM_BASE_URL` | API base URL (for Ollama, LiteLLM, OpenRouter) | No |
| `LLM_API_KEY` | API key for the provider | No |

**Supported Adapters:**
- OpenAI-compatible (OpenAI, OpenRouter, LiteLLM, Ollama)
- Anthropic Messages API
- Gemini generateContent API

All adapters use bounded timeouts (30s) and redacted error messages. No real keys are committed.

## AI/ML Evaluation

### Reproducible Baseline

```bash
# Run analysis on a sample Flutter project
cd backend
.venv/bin/python -m beacon.analysis.cli analyze --path /path/to/flutter/project --output report.json
```

### Data Provenance

- Flutter source code: parsed via `dart:analyzer` or `libdart` bindings (planned)
- Patterns: hand-crafted rules based on Flutter GitHub issues
- Labels: manually curated from issue discussions and Flutter best practices

### Measured Results

*Not yet available — analysis engine implementation is in progress (Round 3).*

### Failure Cases

- False positives on generated code (e.g., `build_runner` output)
- Complex inheritance chains may obscure controller lifecycle
- Dart macros and code generation not yet supported

## Deployment

### Docker Production

```bash
# Build images
docker compose -f compose.yaml -f compose.prod.yaml build

# Run with production env
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

### TLS Reverse Proxy

Use nginx/Traefik/Caddy in front for TLS termination:

```nginx
server {
    listen 443 ssl;
    server_name beacon.example.com;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### Backup & Restore

```bash
# Backup SQLite database
docker compose exec backend cp /app/data/beacon.db /backups/beacon-$(date +%F).db

# Backup Keycloak
docker compose exec keycloak /opt/keycloak/bin/kc.sh export --dir /backups/keycloak --realm beacon
```

## Development

### Running Tests

**Backend:**
```bash
cd backend
.venv/bin/python -m pytest tests/ -v
```

**Frontend:**
```bash
cd frontend
npm test
npm run build  # includes typecheck
```

### Project Structure

```
beacon-workbench-ryan-vo/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # API endpoints
│   │   ├── core/             # Config, DB, security, exceptions
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── tests/                # Pytest tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/              # Typed API client
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── types/            # TypeScript types
│   │   └── styles/           # Global CSS
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── keycloak/
│   └── realm-export.json     # Keycloak realm with clients, roles, users
├── compose.yaml              # Docker Compose
├── .env.example
├── .github/workflows/ci.yml  # CI pipeline
├── portfolio.json
├── LICENSE
└── CHANGELOG.md
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

**Ryan Vo** — ryandtvo@gmail.com