# FOLIO — Midnight Archive

FOLIO is a private, editorial-style archive for the links you rely on. It is a full-stack application: a **NestJS** REST API with Postgres + Prisma on the backend, and an **Angular** single-page app on the frontend, implemented from the *Midnight Archive* Figma direction.

- **Backend:** NestJS 12, Prisma 7 (driver adapter `@prisma/adapter-pg`), PostgreSQL, JWT auth (Passport + argon2)
- **Frontend:** Angular 22 (standalone components, signals), Tailwind CSS 4, TypeScript strict mode
- **Verification:** 38 Pactum e2e tests (backend), Vitest unit tests (frontend), Playwright-driven UI checks against a real Chromium

## Repository structure

```text
bookmarks-API-/
├── backend/          # NestJS application (formerly the repo root)
│   ├── src/
│   ├── prisma/
│   └── test/
├── frontend/         # Angular application
│   └── src/app/
│       ├── core/       # auth (session, interceptor, guards), services, models, utils
│       ├── shared/ui/  # icon set
│       ├── layouts/    # app shell (navigation rail) + split-screen auth layout
│       └── features/   # sign-in, sign-up, library (master–detail), bookmark form, account
├── README.md
└── LICENSE
```

## Prerequisites

- Node.js ≥ 22 and npm
- Docker (for the Postgres containers)

## Environment setup

### Backend — `backend/.env` (not committed)

Copy `backend/.env.example` and fill in your values:

| Variable         | What it's for |
|------------------|---------------|
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | credentials used by the Postgres container |
| `DATABASE_URL`   | connection string used by the app + Prisma CLI |
| `PORT`           | HTTP port (`backend/.env` in this workspace uses `2296`; the example defaults to `3000`) |
| `JWT_SECRET`     | secret for signing tokens — never commit a real one |
| `FRONTEND_URL`   | browser origin(s) allowed by CORS, comma-separated (dev default `http://localhost:4200`) |

`backend/.test.env` holds the same variables for the test database (port `5441`) and is loaded automatically by the test scripts. `.env` files are git-ignored.

### Frontend — `frontend/src/environments/`

- `environment.development.ts` (used by `ng serve`): `apiUrl: 'http://localhost:2296'` — change the port to match your backend `PORT`.
- `environment.ts` (production build): `apiUrl: ''` — same-origin. Point it at your API origin if the API is hosted elsewhere.

## Database and Prisma

```bash
cd backend
npm install
npx prisma generate       # regenerate the Prisma client into src/generated (not committed)
npm run db:dev:restart    # start dev Postgres (port 5432) + apply migrations
```

The backend is in `backend/`, so all npm scripts below are run from that directory.

## Running the app (development)

```bash
# Terminal 1 — backend (http://localhost:2296 or your PORT)
cd backend
npm run start:dev

# Terminal 2 — frontend (http://localhost:4200)
cd frontend
npm install
npm start
```

Open http://localhost:4200, create an account, and add your first bookmark. The frontend talks to the real API — there is no mock layer.

## CORS

CORS is configured in `backend/src/main.ts`:

- The allowed origin(s) come from `FRONTEND_URL` (comma-separated) — never a wildcard in production.
- Methods limited to `GET, POST, PATCH, DELETE, OPTIONS`; headers to `Content-Type` and `Authorization`.
- `credentials: false` because the frontend authenticates with a `Authorization: Bearer` header, not cookies.
- OPTIONS preflight requests are answered (`optionsSuccessStatus: 204`).

## Build and test

```bash
# Backend
cd backend
npm run build             # nest build → dist/
npm run test:e2e          # Pactum e2e against the test database (db:test:restart first)

# Frontend
cd frontend
npm run build             # production build → dist/frontend
npm test                  # Vitest unit tests
```

## API summary

Everything except auth requires `Authorization: Bearer <access_token>`.

**Auth**

```text
POST /auth/signup   { email, password }  → 201 { access_token } | 400 | 409 email taken
POST /auth/signin   { email, password }  → 200 { access_token } | 403 wrong credentials
```

**Users**

```text
GET   /users/me   → 200 the user (never the password hash) | 401
PATCH /users      { email?, firstName?, lastName? } — all optional → 200 updated user | 401
```

**Bookmarks** — ownership is enforced on the backend for every id endpoint.

```text
GET    /bookmarks      → 200 user's bookmarks
POST   /bookmarks      { title, link, description? } → 201 | 400
GET    /bookmarks/:id  → 200 | 403 not yours | 404 missing
PATCH  /bookmarks/:id  { title?, link?, description? } → 200 | 403 | 404
DELETE /bookmarks/:id  → 204 | 403 | 404
```

## Authentication and security notes

- The backend issues **stateless JWTs (15-minute expiry)** via `Authorization: Bearer`. There is no refresh-token or cookie transport and no server-side revoke endpoint — changing that would mean redesigning the backend auth architecture, so the existing contract is preserved.
- The frontend keeps the token in an in-memory signal, mirrored to **`sessionStorage`** (per-tab, cleared when the tab closes). It is intentionally *not* in `localStorage`, limiting exposure to any long-lived XSS. Tradeoff: a hard reload signs you back in (session is restored via `/users/me`), but a new tab does not share the session.
- On any **401** from the API, the interceptor clears the session and redirects to `/sign-in?reason=session-expired`.
- Route guards (`authGuard`, `guestGuard`) are UX-level only. Authorization is always enforced by the backend.
- Passwords are hashed with argon2; the hash never leaves the server.

## Notes and known limitations

- **No collections/tags/favorites/analytics/server-side search** — the backend does not implement them, so they are not faked in the UI. The design's `···` row menu offers *Open link / Edit / Delete*, all backed by real endpoints.
- **Design assets:** the design uses no raster imagery (typography and color only), so there are no temporary Figma asset URLs in the code. Icons are inline SVGs (Lucide-style).
- **Sign out** was added to the navigation rail (icon button) — the Figma screens did not include a logout affordance; without it the required "logout and authentication-state cleanup" would be unreachable.
- **Delete confirmation** is an accessible modal (`role="alertdialog"`); the design shows the Delete button only.
- **Monogram tiles** derive from the domain (first letter, or two digits when the domain starts with a digit, e.g. `12factor.net` → `12`).
- **Responsive behavior:** ≥ `lg` shows the 224 px navigation rail and the master–detail library side by side; below that, a compact top bar replaces the rail and the inspector stacks under the list. The master list hides the ADDRESS/ADDED columns below `xl`.
- The dev and test databases are disposable Docker volumes; test user/bookmark data created during verification was removed.
- Dev server ports in this workspace: frontend `4200`, backend `2296` (see `FRONTEND_URL` / `PORT`).

MIT — see [LICENSE](LICENSE).
