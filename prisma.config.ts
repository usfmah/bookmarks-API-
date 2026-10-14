// Prisma 7 standard config file (see https://pris.ly/d/config).
// Kept in sync with prisma7.config.ts for backwards compatibility.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
