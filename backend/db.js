

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: process.env.DB_PASSWORD, // STRING ONLY
  database: "robotech_db",
});

export default pool;
