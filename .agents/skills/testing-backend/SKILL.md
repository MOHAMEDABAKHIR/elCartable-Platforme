---
name: testing-elcartable-backend
description: How to run and HTTP-test the elCartable NestJS backend locally (setup, base path, error-shape testing).
---

# Testing the elCartable backend

## Setup
1. `npm install` at repo root (npm workspaces).
2. `cd apps/backend && npx prisma generate`.
3. Create `apps/backend/.env` from `.env.example`. Set `DATABASE_URL` (Neon Postgres — repo-scoped secret, injected as env var `DATABASE_URL`), and dev values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `IP_HASH_SALT`. Avoid `sed` for `DATABASE_URL` (contains `&`, `?`, `/`) — use a Python regex rewrite.
4. Apply schema: `cd apps/backend && npx prisma db push` (there is NO `prisma/migrations` dir, so `migrate deploy` does nothing).
5. Start: `npm run dev:backend`. Success log: `elCartable API démarrée`. Swagger at `http://localhost:3000/docs`.

## IMPORTANT: real route base path is `/api/v1/v1`
Global prefix is `api/v1` AND URI versioning adds a `v1` segment, so real paths are `http://localhost:3000/api/v1/v1/<route>` (e.g. `/api/v1/v1/orders`). `/api/v1/orders` returns a route-not-found 404.

## Public (unauthenticated) routes useful for testing
- `POST /orders` (create, free-text item ok), `POST /orders/track` (orderNumber + phone).
- `GET /schools/{id}`, `GET /products/{id}` → 404 `NotFoundException` when missing.
- `POST /visitors/sessions` then `POST /analytics/events` (needs valid sessionId).
- `POST /uploads` (multipart; Swagger renders NO file-picker for it — test via `curl -F "file=@f.png;type=image/png"`).
- Back-office routes (list orders, categories/products/schools create, dashboard, visitors list) are JWT+role guarded — need a seed admin (no default password provided).

## Error-handling filter facts (AllExceptionsFilter)
- Shape: `{ statusCode, path, timestamp, code, message }`. `code` = HttpException class name, or Prisma-mapped code.
- Trigger P2003 FK 400 publicly: `POST /orders` with a non-existent `schoolId`.
- P2002 (409 UNIQUE) is NOT reachable via public routes (order create retries it; visitor uses upsert) — needs an auth'd back-office create on a unique field (categories.slug, products.sku, users.email).
- Bootstrap `.catch()` test: run compiled `node dist/src/main.js` with an unreachable `DATABASE_URL` → logs `Échec du démarrage` + exits code 1.

## Full-stack (UI) E2E testing
- No `DATABASE_URL` secret is required to test locally: a **local docker Postgres** works fine (point `DATABASE_URL` at it, then `npx prisma db push`).
- The seed (`npm run prisma:seed`) only creates the **super admin** — it does NOT create catalogue/school data. To exercise the full golden path you must manually create: schools, grades, categories, products, at least one **official school list** (school+grade → items), and a **COMMERCIAL** user. Create them via the authenticated back-office API (`/api/v1/v1/...`) or by inserting directly in the DB.
- Frontend: `npm run dev --workspace=apps/frontend` (Vite on `:5173`, proxy `/api` → `http://localhost:3000`). Client axios base is `VITE_API_URL` (default `/api/v1/v1`).
- Golden path to verify: landing (school+grade) → official list → cart → checkout → **confirmation page shows orderNumber** → tracking (number+phone). Back-office: login → dashboard → orders (status/items/assign/PDF) → product/school CRUD (create + deactivate/reactivate via admin endpoints).

## Devin Secrets Needed
- `DATABASE_URL` (Neon Postgres connection string), repo-scoped. Optional for local testing — a local docker Postgres is sufficient.
