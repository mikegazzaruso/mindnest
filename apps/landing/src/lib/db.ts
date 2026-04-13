import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id          SERIAL PRIMARY KEY,
      first_name  TEXT        NOT NULL,
      email       TEXT        NOT NULL UNIQUE,
      role        TEXT        NOT NULL,
      use_case    TEXT,
      referral    TEXT,
      ip          TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function insertLead(data: {
  firstName: string;
  email: string;
  role: string;
  useCase?: string;
  referral?: string;
  ip?: string;
}) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO waitlist (first_name, email, role, use_case, referral, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      data.firstName,
      data.email,
      data.role,
      data.useCase ?? null,
      data.referral ?? null,
      data.ip ?? null,
    ]
  );
}
