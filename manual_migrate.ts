import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id),
      tenant_id UUID NOT NULL REFERENCES tenants(id),
      name TEXT NOT NULL,
      phone TEXT,
      purpose TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
      logged_by UUID REFERENCES users(id),
      arrived_at TIMESTAMP NOT NULL DEFAULT NOW(),
      departed_at TIMESTAMP,
      telegram_message_id TEXT
    );
  `);
  console.log('Created visitors table');

  try {
    await pool.query(`ALTER TABLE gate_passes ADD COLUMN token TEXT;`);
    console.log('Added token to gate_passes');
  } catch (err) {
    console.log('token column might already exist');
  }

  pool.end();
}

run();
