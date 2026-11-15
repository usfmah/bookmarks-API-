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

Requirements: Node.js ≥ 22, Docker, npm.

```bash
cd backend
npm install
cp .env.example .env       # then edit .env — see below
npx prisma generate        # generated client is not committed
npm run db:dev:restart     # start Postgres (port 5432) + apply migrations
npm run start:dev          # http://localhost:PORT (2296 in this workspace, 3000 by default)
```

`.env` values:

| Variable | Purpose |
|----------|---------|
| `DB_*` / `DATABASE_URL` | Postgres container credentials / connection string |
| `PORT` | HTTP port the API listens on |
| `JWT_SECRET` | JWT signing secret — keep it out of git |
| `FRONTEND_URL` | allowed browser origin(s), comma-separated (e.g. `http://localhost:4200`) |

Then try it:

```bash
curl -X POST localhost:2296/auth/signup -H 'Content-Type: application/json' \
  -d '{"email":"me@example.com","password":"choose-something-long"}'
```

Tests: `npm run db:test:restart && npm run test:e2e` (uses `.test.env`, test DB on port 5441).

Frontend (optional): `cd frontend && npm install && npm start` → http://localhost:4200. Its dev API URL is set in `frontend/src/environments/environment.development.ts` (match your backend `PORT`).

MIT — see [LICENSE](LICENSE).
