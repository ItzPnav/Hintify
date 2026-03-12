import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.warn("Database env not fully set; DB operations may fail.");
}

const pool = new Pool({
  host: DB_HOST || "localhost",
  port: Number(DB_PORT || 5432),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool
};
