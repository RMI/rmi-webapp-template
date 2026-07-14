# RMI Webapp Template

A starting point for internal web applications at RMI:

**React + FastAPI + PostgreSQL**, with Docker Compose for local dev, Alembic migrations, optional Auth0 sign-in, OpenTelemetry, and end-to-end CI/CD to Azure.

The template ships a minimal **widget CRUD demo** so `make dev-docker` boots into a working app end-to-end. Replace it with your own resource once you get going.

## Quick start

```bash
cp env.example .env
make dev-docker
```

Then open:

- **App** — http://localhost:3000
- **API docs** — http://localhost:8000/docs
- **DB browser (Adminer)** — http://localhost:8081

Auth is disabled by default, so you can poke around without any Auth0 setup.

## What's in the box

| Path | What's there |
| --- | --- |
| `deployments/api/` | FastAPI + Alembic + OpenTelemetry, JWT bearer auth, `/widgets` demo router |
| `deployments/frontend/` | Vite + React + React Query, Auth0 login gate, widget list/create page |
| `deployments/db/` | PostgreSQL role bootstrap (`app_user` + `app_migrator`) |
| `deployments/otel-collector/` | Optional OTLP → Jaeger sidecar for local trace inspection |
| `packages/auth/` | OIDC JWT validator + permission-check helpers |
| `.github/workflows/` | CI (lint, format, test) + CD (Azure Container Apps + Static Web Apps) |

Deeper reading: [ARCHITECTURE.md](ARCHITECTURE.md) (layout + request flow), [HACKING.md](HACKING.md) (day-to-day dev commands).

## Going from template to your app

After clicking **"Use this template"**:

1. **Rename.** The template uses `webapp`, `app`, and `webapp-api` as placeholder names — do a repo-wide find-and-replace before your first commit.
2. **Follow the widget demo** as a working example when adding your own resource. It touches every layer: `db/model/widget.py`, `routers/widgets.py`, an Alembic migration under `alembic/versions/`, `queries/widgets.js`, and `pages/HomePage.jsx`.
3. **Delete the widget demo** once you have your own resource. Search for `widget` / `widgets` — every file with a match is either a widget file (delete) or a place to swap in your resource name.
4. **Wire up auth** if you need it — see [Enabling auth](#enabling-auth).
5. **Update this README** to describe your app.

## Enabling auth

The template ships with `AUTH_DISABLED=true` so it boots without any Auth0 tenant. To turn on real auth:

1. In your Auth0 tenant, create a Single Page Application and an API. Note the domain, client ID, and audience.
2. In `deployments/frontend/public/config.json`, set `authDisabled: false` and fill in the Auth0 fields.
3. In `.env`:
   ```
   AUTH_DISABLED=false
   AUTH_ISSUER="https://YOUR_TENANT.auth0.com/"
   AUTH_AUDIENCE="https://your-api-identifier"
   AUTH_JWKS_URI="https://YOUR_TENANT.auth0.com/.well-known/jwks.json"
   ```
4. `make reboot-docker`. The frontend now redirects to Auth0; the API validates bearer tokens.

## Reset the local DB

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
make dev-docker
```

The `-v` drops the Postgres volume so migrations re-apply from scratch.

## Common make targets

| Target | Purpose |
| --- | --- |
| `make dev-docker` | Full local stack in Docker (DB + API + frontend) |
| `make api-dev` | API on the host (against dockerized DB), hot-reload |
| `make frontend-dev` | Vite dev server on the host |
| `make test` | All Python + Node tests |
| `make alembic-autogenerate` | New Alembic revision after model changes |
| `make reboot-docker` | Rebuild and restart the full stack |
| `make check` | Lint + test + format-check + lock-check (pre-push sanity) |

Full list in `Makefile`.
