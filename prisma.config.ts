// /workspaces/SoftPOS/prisma.config.ts
import { defineConfig } from "@prisma/config";
import "dotenv/config";

const args = process.argv.join(" ");
const isSqlite = args.includes("prisma/sqlite/schema.prisma");

export default defineConfig({
  schema: isSqlite ? "prisma/sqlite/schema.prisma" : "prisma/mysql/schema.prisma",
  migrations: {
    path: isSqlite ? "prisma/sqlite/migrations" : "prisma/mysql/migrations",
  },
  datasource: {
    url: isSqlite 
      ? "file:./sqlite/lomis.db" 
      : (process.env.DATABASE_URL || "mysql://root:root@localhost:3306/lomis"),
  },
});