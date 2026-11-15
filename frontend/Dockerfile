# syntax=docker/dockerfile:1

# ---------- build: compile the Angular application ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json postcss.config.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- dev: hot-reload development target (bind-mounted source) ----------
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json postcss.config.json ./
RUN npm ci
COPY . .
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]

# ---------- runtime: unprivileged nginx serving the static build ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
