import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL is not set in environment variables. Falling back to default MySQL configuration.");
}

const connectionString = databaseUrl || "mysql://root:password@localhost:3306/money_management_db";

export const poolConnection = mysql.createPool(connectionString);

export const db = drizzle(poolConnection, { schema, mode: "default" });
