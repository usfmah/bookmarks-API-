# FOLIO

A private bookmark manager: an **Angular** frontend, a **NestJS** REST API, and a **PostgreSQL** database, orchestrated with Docker.

## Features

- Bookmarks CRUD with server-side ownership checks
- JWT authentication (Passport + argon2)
- PostgreSQL persistence via Prisma
- Angular SPA frontend

## Backend endpoints

`Authorization: Bearer <access_token>` is required on everything except the auth routes.

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

Endpoints are hosted at `http://localhost:2296` (the Angular dev frontend calls this directly — browsers can't use the internal Docker network names). Only the backend's own container can reach the database, at `db:5432`.

## Run it

Requires Docker with the Compose plugin.

```bash
cp .env.example .env   # set POSTGRES_PASSWORD and JWT_SECRET
docker compose up --build
```

- Frontend → http://localhost:4200
- Backend → http://localhost:2296

Useful commands: `docker compose ps` · `docker compose logs -f` · `docker compose stop backend` · `docker compose stop frontend` · `docker compose down` (keep DB) · `docker compose down -v` (wipe DB).

## Docker features

- **One Dockerfile per component** — `db/` (PostgreSQL), `backend/` (NestJS), `frontend/` (Angular)
- **Docker Compose orchestration** — the whole stack starts with a single `docker compose up`
- **Bind mounts** — host source code (`./backend`, `./frontend`) is mounted into the containers for hot reload
- **Named volume** (`postgres_data`) — database files survive container recreation
- **Anonymous volumes** (`/app/node_modules`) — isolate container dependencies from the bind mounts
- **Healthcheck + `depends_on`** — the backend waits for PostgreSQL to be ready
- **Docker DNS service discovery** — the backend reaches the database at `db:5432`
- **Environment-based configuration** — via `.env` (see `.env.example`), with published ports `FRONTEND_PORT` (4200) and `BACKEND_PORT` (2296)

MIT — see [LICENSE](LICENSE).
