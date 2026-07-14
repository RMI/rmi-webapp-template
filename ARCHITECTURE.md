# Architecture

This template is a monorepo containing one deployable API, one deployable frontend, a Postgres bootstrap layer, and a shared auth package.

```
.
├── deployments/
│   ├── api/                FastAPI service, Alembic migrations, Dockerfile
│   ├── frontend/           Vite + React SPA, Dockerfile, nginx serve config
│   ├── db/                 Postgres init scripts (role creation)
│   └── otel-collector/     Optional OpenTelemetry collector config
├── packages/
│   └── auth/               OIDC JWT validator + permission helpers, shared by any Python service that needs to accept bearer tokens
├── .github/workflows/      CI (lint/format/test) + CD (Azure Container Apps / Azure Static Web Apps)
├── tools/                  Local dev helpers
├── docker-compose.yml      Base compose stack (db, api, frontend, alembic)
├── docker-compose.local.yml  Local dev overrides (adminer, alembic-generate)
├── docker-compose.otel.yml   Adds otel-collector + jaeger
├── Makefile                Common dev commands
└── pyproject.toml          uv workspace root (Python)
```

## Python namespace

Both the API and the auth package publish under the shared `app.` namespace:

- `deployments/api/src/app/api/` → `app.api.*` (FastAPI app, routers, models, settings)
- `packages/auth/src/app/auth/` → `app.auth.*` (JWT validator, `TokenClaims`, permission helpers)

The API depends on `auth` via `[tool.uv.sources]` workspace resolution. Adding a new shared Python package means dropping it in `packages/<name>/` and adding it to `[tool.uv.workspace].members` in the root `pyproject.toml`.

## Request lifecycle

1. Browser hits the Vite dev server (or the built assets in production). `main.jsx` loads `config.json` at boot before mounting React.
2. `<AuthGate>` uses Auth0's React SDK to gate the app on a valid session (or lets the request through if `AUTH_DISABLED=true` upstream).
3. Authenticated fetchers (`useAuthenticatedQuery`, `createAuthenticatedFetcher`) inject the Auth0 access token as a bearer header.
4. FastAPI's `get_token_claims` dependency validates the JWT via `app.auth.JWTValidator` (JWKS fetch + expiry check). When auth is disabled it substitutes a dev claims object.
5. Routers use `Claims` (typed alias for the validated token) and `UnitOfWork` (an SQLAlchemy session context manager) for their DB reads/writes.

## Where to add things

- **New API resource** → add a model in `deployments/api/src/app/api/db/model/`, register it in `db/model/__init__.py`, add a router in `routers/`, include it in `main.py`. Run `make alembic-autogenerate` for the migration.
- **New shared Python code** → new package under `packages/<name>/` with its own `pyproject.toml`; add to the root workspace members list.
- **New frontend page** → add under `deployments/frontend/src/pages/`, wire into `App.jsx` Routes.
- **New env var** → add to `env.example`, read via `app.api.settings.Settings` (Pydantic Settings).
