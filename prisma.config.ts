/*
 * Prisma Global Configuration
 * Used to define where the schema and migrations are located, and how to connect to the DB.
 *
 * @used_in: Prisma CLI commands (like migrate, generate, validate).
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

/*
 * Main Prisma configuration object.
 * @logic:
 * - Links to the schema.prisma file.
 * - Sets the path for database migrations.
 * - Connects using the DATABASE_URL environment variable.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
