# Fraud Shield Debug Report

## Executive Summary
A comprehensive audit of the **Fraud Shield** codebase was performed across the Frontend, Backend, ML Pipeline, Twilio Integration, WebSockets, Database, and Deployment configurations. The architecture is sound, backend tests pass at 100%, and the frontend bundle compiles successfully. This report identifies potential production runtime friction points, environment variable bindings for cross-platform deployments (Vercel & Render), CORS constraints with credentials, and library deprecation warnings.

---

## Critical Errors (P0 / P1)

*None — Zero P0 (blocking startup) or P1 (broken core features) errors detected.*

---

## Potential Runtime Issues (P2)

| ID | Component | Problem | Evidence | Fix | Priority |
|---|---|---|---|---|---|
| ERR-01 | Frontend API Client | `API_BASE` hardcoded to relative `'/api'`, which fails on independent Vercel + Render deployments | `frontend/src/services/api.ts:14` | Support `import.meta.env.VITE_API_URL` with clean `/api` fallback | P2 |
| ERR-02 | WebSocket Hook | `wsUrl` exclusively derives from `window.location.host`, causing WebSocket disconnects when frontend is hosted on Vercel | `frontend/src/hooks/useWebSocket.ts:14-16` | Support `import.meta.env.VITE_WS_URL` and auto-derive from `VITE_API_URL` | P2 |
| ERR-03 | Backend CORS | `allow_origins=["*"]` used alongside `allow_credentials=True`, which modern browsers reject on credentialed cross-origin requests | `backend/app/main.py:53-57` | Configure explicit origins via `BACKEND_CORS_ORIGINS` with Vercel & Render regex support | P2 |
| ERR-04 | Backend Cloud Port Binding | Port hardcoded to default `8000` without dynamic `PORT` environment variable binding for Render/PaaS | `backend/app/core/config.py` | Add `PORT` setting defaulting to `os.getenv("PORT", 8000)` | P2 |

---

## Warnings (P3 / P4)

| ID | Layer | Warning | Impact | Recommendation | Priority |
|---|---|---|---|---|---|
| WRN-01 | Backend Config | `PydanticDeprecatedSince20`: Class-based `Config` is deprecated in Pydantic v2 | Python console warnings during test execution | Migrate to `SettingsConfigDict` | P3 |
| WRN-02 | Backend Database | `MovedIn20Warning`: `declarative_base()` from `sqlalchemy.ext.declarative` | Warning on engine startup | Import from `sqlalchemy.orm` | P3 |
| WRN-03 | Frontend Vite | Large chunk warning (>500 kB) on `index.js` bundle | Suboptimal bundle download time | Configure Rollup `manualChunks` in `vite.config.ts` | P4 |
| WRN-04 | Frontend Scripts | Missing `npm run typecheck` script | Unable to run isolated TypeScript type audits | Add `"typecheck": "tsc --noEmit"` to `package.json` | P4 |
| WRN-05 | Cloud Infra | Missing Render blueprint specification | Manual configuration required on Render | Create `render.yaml` with FastAPI + PostgreSQL definitions | P4 |

---

## Verification Plan
1. Apply fixes to `config.py`, `database.py`, `main.py`, `api.ts`, `useWebSocket.ts`, `vite.config.ts`, `package.json`, and create `render.yaml`.
2. Run `npm run typecheck` and `npm run build` in `frontend/`.
3. Run `python -m pytest backend/tests -v`.
4. Test live backend endpoints (`/health`, `/api/risk/transaction`, `/api/risk/message`, `/api/risk/voice`, `/api/dashboard/stats`, `/api/ml/metadata`).
