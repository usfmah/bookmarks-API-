# FOLIO

A private REST API for managing bookmarks, with an Angular frontend in `frontend/`. This document focuses on the **backend**.

- **NestJS 12** · **PostgreSQL + Prisma 7** (driver adapter `@prisma/adapter-pg`)
- **JWT auth** (Passport + argon2), 15-minute tokens
- **Pactum e2e tests** against a real test database — 38 passing

## Backend features

- **Auth** — `POST /auth/signup`, `POST /auth/signin` → stateless JWT (argon2-hashed passwords)
- **Users** — `GET /users/me` (never returns the hash), `PATCH /users` (email, firstName, lastName)
- **Bookmarks** — full CRUD under `/bookmarks`. Ownership is enforced server-side on every id endpoint: `403` if it's not yours, `404` if it doesn't exist, and deleting a user cascades to their bookmarks.
- **Validation** — DTO validation via `class-validator`, global `ValidationPipe` with `whitelist`
- **CORS** — explicit `FRONTEND_URL` allowlist (comma-separated), methods `GET,POST,PATCH,DELETE,OPTIONS`, headers `Content-Type,Authorization`, `credentials: false`, 204 preflight

`Authorization: Bearer <access_token>` is required on everything except auth.

```text
POST   /auth/signup     { email, password } → 201 { access_token } | 400 | 409
POST   /auth/signin     { email, password } → 200 { access_token } | 403
GET    /users/me                            → 200 user | 401
PATCH  /users           { email?, firstName?, lastName? } → 200 | 401
GET    /bookmarks                           → 200 [bookmark]
POST   /bookmarks       { title, link, description? } → 201 | 400
GET    /bookmarks/:id                       → 200 | 403 | 404
PATCH  /bookmarks/:id   { title?, link?, description? } → 200 | 403 | 404
DELETE /bookmarks/:id                       → 204 | 403 | 404
```

## Run it locally

### Everything with Docker (recommended)

```bash
cp .env.example .env   # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build
```

Then open http://localhost:4200. The entire stack — Angular frontend (nginx), NestJS backend, PostgreSQL — starts with health-checked ordering; the API and database are internal to the Compose network.

Useful commands: `docker compose ps` · `docker compose logs -f` · `docker compose down` (keep DB) · `docker compose down -v` (wipe DB).

Development mode with bind mounts and hot reload:

```bash
docker compose -f compose.dev.yaml up --build
```

### Backend without Docker

Requires Node.js ≥ 22 and Docker (for the Postgres container only).

```bash
cd backend
npm install
npx prisma generate       # generated client is not committed
npm run db:dev:restart    # start Postgres (port 5432) + apply migrations
npm run start:dev         # http://localhost:PORT (2296 in this workspace, 3000 default)
```

Backend `.env` (from `.env.example`): `DB_*` / `DATABASE_URL` (container credentials), `PORT`, `JWT_SECRET`, `FRONTEND_URL` (allowed browser origin, e.g. `http://localhost:4200`).

Frontend without Docker: `cd frontend && npm install && npm start` → http://localhost:4200 (dev API URL in `environment.development.ts` — match your backend `PORT`).

Tests: `npm run db:test:restart && npm run test:e2e` in `backend/` (uses `.test.env`, test DB on port 5441).

MIT — see [LICENSE](LICENSE).
