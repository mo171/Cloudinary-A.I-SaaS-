/*
 * This file sets up a single instance of the Prisma Client.
 * In development, Next.js refreshes files often, which can create too many
 * database connections. This "Singleton" pattern ensures we only use one.
 *
 * @used_in: Throughout the application (especially API routes) to interact with the database.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/*
 * Creates a new Prisma Client instance with a PostgreSQL driver adapter.
 *
 * @returns {PrismaClient} - A configured Prisma Client instance.
 * @logic:
 * 1. Grabs the database URL from environment variables.
 * 2. Creates a connection pool using 'pg'.
 * 3. Wraps the pool in a PrismaPg adapter (Required for Prisma 7).
 * 4. Returns the client initialized with that adapter.
 */
const prismaClientSingleton = () => {
  const connectionString = `${process.env.DATABASE_URL}`;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

// This tells TypeScript that 'prisma' might exist on the global object
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

/*
 * Export the existing 'prisma' instance if it exists, or create a new one.
 * This is what actually implements the Singleton pattern.
 */
const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

// If we are NOT in production, save the client to 'globalThis' so it persists across refreshes
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
