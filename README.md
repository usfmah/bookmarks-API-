# Bookmarks API

A small REST API for saving bookmarks. Users sign up, sign in, and manage their own list of links — nobody sees or touches anyone else's bookmarks.

- **NestJS 12** with Postgres + Prisma 7 (driver adapter `@prisma/adapter-pg`)
- **JWT auth** (Passport + argon2), tokens expire after 15 minutes
- **Pactum e2e tests** against a real test database — 38 and counting

## Quick start

Requires Node.js ≥ 22 and Docker.

```bash
npm install

cp .env.example .env      # or write your own (see variants below)
npm run db:dev:restart    # start the dev Postgres + apply migrations
npm run start:dev         # http://localhost:3000
```

## Environment

| Variable         | What it's for                                        |
|------------------|------------------------------------------------------|
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | credentials used by the Postgres container |
| `DATABASE_URL`   | connection string used by the app + Prisma CLI        |
| `PORT`           | HTTP port (default `3000`)                            |
| `JWT_SECRET`     | secret for signing tokens                             |

`.env` is for development. `.test.env` (same variables, test database on port `5441`) is loaded automatically by the test scripts.

## The API

Everything except auth requires `Authorization: Bearer <access_token>`.

**Auth**

```
POST /auth/signup   { email, password }          → 201 { access_token } | 400 | 409 email taken
POST /auth/signin   { email, password }          → 200 { access_token } | 403 wrong credentials
```

**Users**

```
GET   /users/me     → 200 the user (never the password hash) | 401
PATCH /users       { email?, firstName?, lastName? } — all optional
                   → 200 updated user | 401
```

**Bookmarks** — every bookmark belongs to one user, and the API enforces ownership on every id endpoint.

```
GET    /bookmarks           → 200 [] or user's bookmarks
POST   /bookmarks           { title, link, description? } → 201 | 400
GET    /bookmarks/:id       → 200 | 403 not yours | 404 doesn't exist
PATCH  /bookmarks/:id       { title?, description?, link? } → 200 | 403 | 404
DELETE /bookmarks/:id       → 204 no content | 403 | 404
```

Example:

```bash
TOKEN=$(curl -s localhost:3000/auth/signup -H "Content-Type: application/json" \
  -d '{"email": "me@example.com", "password": "0000"}' | jq -r .access_token)

curl localhost:3000/bookmarks -H "Authorization: Bearer $TOKEN"
```

## Testing

```bash
npm run db:test:restart   # once, or whenever migrations changed
npm run test:e2e          # 38 e2e tests against the test database
```

The suite is stateful on purpose: one signup at the start, then it flows signup → signin → user → bookmark CRUD → delete, reusing pactum stores (`$S{userAt}`, `$S{bookmarkId}`). It also covers the unhappy paths: 401 without a token, 403 on another user's bookmark, 404 for a missing id, and 400s from validation and bad path params.

## Handbook scripts

| Script | What it does |
|---|---|
| `db:dev:up` / `db:dev:rm` / `db:dev:restart` | start / remove / reset the dev container |
| `prisma:dev:deploy` | apply migrations to dev |
| `db:test:up` / `db:test:rm` / `db:test:restart` | same for the test container |
| `prisma:test:deploy` | apply migrations to test (loads `.test.env`) |
| `start:dev`, `build`, `start:prod` | compile, compile, execute |
| `test` / `test:e2e` / `test:cov` | Vitest |
| `lint` | oxlint |

## Structure

```
src/
  auth/       signup, signin, JWT strategy/guard, @GetUser decorator
  users/      GET /users/me, PATCH /users
  bookmark/   the REST endpoints + service
  prisma/     @Global PrismaService, cleanDb()
prisma/
  schema.prisma
  migrations/
```

Data model: `User` has many `Bookmark`s (ownership is enforced by a foreign key, and deleting a user cascades to their bookmarks).

MIT — see [LICENSE](LICENSE).
