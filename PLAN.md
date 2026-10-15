# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

auth-oidc

## Roadmap

### project-skeleton — Project skeleton with FastAPI backend and React frontend

Status: done

Acceptance:
- FastAPI app starts and serves health endpoint
- React + TypeScript + Vite frontend builds and serves
- Docker compose starts both services with Keycloak
- Backend tests pass with pytest
- Frontend typecheck and build pass

Implementation: `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/core/security.py`, `backend/app/core/exceptions.py`, `backend/app/api/deps.py`, `backend/app/api/routes/health.py`, `backend/app/api/routes/auth.py`, `backend/app/models/base.py`, `backend/app/schemas/health.py`, `backend/requirements.txt`, `backend/Dockerfile`, `backend/.dockerignore`, `backend/tests/conftest.py`, `backend/tests/test_health.py`, `backend/tests/test_auth.py`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/components/HealthStatus.tsx`, `frontend/src/pages/Dashboard.tsx`, `frontend/src/api/client.ts`, `frontend/src/api/health.ts`, `frontend/src/types/health.ts`, `frontend/src/styles/index.css`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/vitest.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.node.json`, `frontend/index.html`, `frontend/nginx.conf`, `frontend/Dockerfile`, `frontend/.dockerignore`, `compose.yaml`, `keycloak/realm-export.json`, `.env.example`, `.gitignore`

Tests: `backend/tests/test_health.py`, `backend/tests/test_auth.py`, `frontend/src/components/HealthStatus.test.tsx`, `frontend/src/App.test.tsx`

### auth-oidc — OIDC authentication with Keycloak

Status: in_progress

Acceptance:
- Login/logout flow works via Keycloak
- Protected API endpoints require valid token
- Frontend redirects to Keycloak and handles callback
- Roles (viewer, operator, admin) enforced on endpoints

### flutter-project-analysis — Flutter project analysis engine (core domain)

Status: planned

Acceptance:
- Upload/import Flutter project (zip or git URL)
- Static analysis extracts widgets, state patterns, dependencies
- Detects state reuse issues (Issue 51752 patterns)
- Detects performance anti-patterns (Issue 101227)
- Generates analysis report with findings and recommendations

### analysis-dashboard — Analysis dashboard UI with three workflows

Status: planned

Acceptance:
- Workflow 1: Create new analysis from uploaded project
- Workflow 2: View analysis results with filtering/sorting
- Workflow 3: Export analysis report (JSON/PDF)
- Loading, error, and empty states for all views

### ci-cd-pipeline — CI/CD pipeline with GitHub Actions

Status: done

Acceptance:
- Backend pytest runs in CI
- Frontend npm ci/build/test runs in CI
- Both Dockerfiles build in CI
- Workflow passes on ubuntu-latest

Implementation: `.github/workflows/ci.yml`

### documentation-packaging — Documentation, packaging, and portfolio.json

Status: done

Acceptance:
- README with install/run/test steps and architecture diagram
- CHANGELOG.md with actual changes
- portfolio.json at root with required schema
- LICENSE MIT with author info
- .env.example with blank credentials

Implementation: `README.md`, `CHANGELOG.md`, `portfolio.json`, `LICENSE`, `.env.example`

