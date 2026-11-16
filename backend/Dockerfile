# FOLIO backend — NestJS API (simple development image)
FROM node:22-bookworm-slim
WORKDIR /app

# OpenSSL is required by Prisma
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Lockfile-based install for reproducible builds (.dockerignore excludes node_modules)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]
