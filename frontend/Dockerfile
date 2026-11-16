# FOLIO frontend — Angular SPA (simple development image)
FROM node:22-alpine
WORKDIR /app

# Lockfile-based install for reproducible builds (.dockerignore excludes node_modules)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
