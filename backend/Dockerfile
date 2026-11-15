# syntax=docker/dockerfile:1

# ---------- deps: install ALL dependencies (incl. devDeps) and generate the Prisma client ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
# Lockfile-based, reproducible install
COPY package.json package-lock.json ./
# Prisma schema + config + tsconfig are needed for `prisma generate`
# (it reads tsconfig module settings to emit .js import extensions)
COPY prisma ./prisma
COPY prisma.config.ts prisma7.config.ts tsconfig.json ./
RUN npm ci && npx prisma generate

# ---------- build: compile the NestJS application ----------
FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build

# ---------- prod-deps: production-only node_modules for the runtime image ----------
FROM build AS prod-deps
RUN npm prune --omit=dev

# ---------- migrator: one-shot image used to apply Prisma migrations before startup ----------
FROM build AS migrator
CMD ["npx", "prisma", "migrate", "deploy"]

# ---------- dev: hot-reload development target (bind-mounted source) ----------
FROM node:22-bookworm-slim AS dev
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts prisma7.config.ts tsconfig.json ./
RUN npm ci && npx prisma generate
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npm run start:dev"]

# ---------- runtime: minimal production image ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd --system nodejs && useradd --system --gid nodejs folio
COPY --from=prod-deps --chown=folio:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=folio:nodejs /app/dist ./dist
COPY --from=build --chown=folio:nodejs /app/prisma ./prisma
COPY --chown=folio:nodejs package.json ./package.json
USER folio
EXPOSE 3000
CMD ["node", "dist/main.js"]
