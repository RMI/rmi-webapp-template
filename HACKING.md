# Hacking

Day-to-day dev workflow.

## Layout

- `deployments/api/` — FastAPI service (`webapp-api`)
- `deployments/frontend/` — Vite + React
- `deployments/db/` — Postgres role bootstrap
- `packages/` — shared Python packages (currently just `auth`)

## Prerequisites

- Docker Desktop
- [`uv`](https://docs.astral.sh/uv/) for Python
- Node.js + npm for the frontend

## First-time setup

```bash
cp env.example .env
make uv-sync-dev          # installs Python deps into .venv
```

## The three entrypoints

Pick whichever matches what you're touching:

| Command | Use when… | What runs where |
| --- | --- | --- |
| `make frontend-dev` | You're editing React/UI code | Vite on the host, API + DB in Docker |
| `make api-dev` | You're editing FastAPI/backend code | Uvicorn on the host with reload, DB in Docker |
| `make dev-docker` | You want the full production-like stack | Everything in Docker |

All three expose:

- **App** — http://localhost:3000
- **API docs (Swagger)** — http://localhost:8000/docs
- **DB browser (Adminer)** — http://localhost:8081

## The widget demo

`deployments/api/src/app/api/routers/widgets.py` + `db/model/widget.py` + `deployments/frontend/src/pages/HomePage.jsx` + `queries/widgets.js` are a working end-to-end example: DB model → migration → FastAPI router → React Query hook → page. When adding your own resource, follow that shape.

## Common quality commands

```bash
make lint            # ruff + eslint
make test            # pytest + vitest
make format          # apply formatters
make check           # lint + test + format-check + lock-check (pre-push sanity)
```

## Docker & DB

- `make reboot-docker` — clean Docker reset + rebuild + up. First-line fix for weird state.
- `make reboot-docker-heavy` — same, plus the OpenTelemetry collector + Jaeger (UI at http://localhost:16686).
- `make follow-stack-logs` — tail logs from every service.
- `make clean` — wipes build artifacts, caches, **and Docker volumes** (deletes your local DB).

To generate a new Alembic revision after changing a SQLAlchemy model:

```bash
make alembic-autogenerate
```

## When things get weird

```bash
make check           # find the actual failure
make reboot-docker   # if it looks like stale Docker state
make clean           # nuclear option — deletes DB
```
