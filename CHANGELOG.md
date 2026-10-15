# Changelog

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-15

### Added
- **Project Skeleton**: FastAPI backend with health endpoints, React + TypeScript + Vite frontend
- **Authentication Foundation**: OIDC configuration with Keycloak, role definitions (viewer, operator, admin), realm export with demo users
- **Docker Infrastructure**: Multi-service Docker Compose (backend, frontend, Keycloak) with healthchecks
- **CI/CD Pipeline**: GitHub Actions workflow for backend tests, frontend typecheck/build/tests, Docker builds
- **Documentation**: README with architecture diagram, API reference, security model, deployment guide
- **Licensing**: MIT License with author attribution
- **Configuration**: `.env.example` with all required and optional settings

### Security
- RS256 JWT validation with JWKS caching
- PKCE support for SPA authentication
- HttpOnly SameSite cookie configuration
- No hardcoded secrets; production refuses demo mode

### Infrastructure
- SQLite for development (parameterized for PostgreSQL migration)
- Non-root Docker users
- .dockerignore files for both services
- Nginx reverse proxy config for frontend

## [Unreleased]

### Planned
- Flutter project analysis engine (static AST parsing, pattern detection)
- Analysis dashboard with three workflows (create, view, export)
- LLM-assisted explanations (opt-in, advisory only)
- Web SEO audit checks
- Performance profiling detection
- Code push readiness evaluation
- Multi-window coordination analysis