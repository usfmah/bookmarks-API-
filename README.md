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

## Run it

```bash
cp .env.example .env   # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build
```

That single command starts the whole stack: PostgreSQL, the NestJS backend (applies Prisma migrations, then starts with hot reload), and the Angular frontend.

- Frontend → http://localhost:4200
- Backend → http://localhost:2296 (also reachable from the compose network as `backend:3000`)

Useful commands: `docker compose ps` · `docker compose logs -f` · `docker compose stop backend` / `docker compose stop frontend` (independent) · `docker compose down` (keep DB) · `docker compose down -v` (wipe DB).

## Project structure (Docker)

```text
.
├── compose.yaml            # single Compose file orchestrating all three services
├── db/Dockerfile           # PostgreSQL (FROM postgres:17-alpine)
├── backend/Dockerfile      # NestJS API (node:22-bookworm-slim + openssl for Prisma)
├── frontend/Dockerfile     # Angular SPA (node:22-alpine, ng serve)
├── .env.example            # configuration template (copy to .env)
├── backend/                # NestJS source, Prisma schema & migrations
└── frontend/               # Angular source
```

How the pieces fit together:

- **`compose.yaml`** orchestrates all three services on one Docker network. Service names become hostnames, so the backend reaches the database at `db:5432`. A single `docker compose up --build` builds and starts everything.
- **`db/Dockerfile`** — minimal image based on the official Postgres image. The database files live in a **named volume** (`postgres_data`), so they survive container recreation. The DB port is *not* published to the host; only the app services can reach it. A `pg_isready` healthcheck gates backend startup.
- **`backend/Dockerfile`** — installs dependencies (`npm ci`), generates the Prisma client, applies migrations (`prisma migrate deploy`) and starts the dev server (`nest start --watch`). The source directory is **bind-mounted** into the container (`./backend:/app`) so edits on the host are picked up instantly; an **anonymous volume** (`/app/node_modules`) shields the image's installed `node_modules` from the bind mount.
- **`frontend/Dockerfile`** — installs dependencies (`npm ci`) and serves the Angular app with `ng serve --host 0.0.0.0`. Same bind-mount + anonymous-volume pattern as the backend (`CHOKIDAR_USEPOLLING=true` ensures file-change detection works on bind mounts).
- **Volumes summary** — named volume for persistent database data, bind mounts for live source code, anonymous volumes for `node_modules`.

Docker concepts demonstrated: Dockerfiles (one per component), image layers & cache-friendly `npm ci`, Docker Compose orchestration, service discovery via Docker DNS, healthchecks + `depends_on` ordering, bind mounts (hot reload), named volumes (persistence), anonymous volumes (dependency isolation), environment-based configuration via `.env`, and port publishing (`FRONTEND_PORT`, `BACKEND_PORT`).

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
