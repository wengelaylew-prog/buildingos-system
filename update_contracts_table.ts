import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query(`ALTER TABLE contracts ADD COLUMN signature_url TEXT;`);
    console.log('Added signature_url to contracts');
  } catch (err) {
    console.log('signature_url column might already exist or error:', err.message);
  }

  try {
    await pool.query(`ALTER TABLE contracts ADD COLUMN signature_date TIMESTAMP;`);
    console.log('Added signature_date to contracts');
  } catch (err) {
    console.log('signature_date column might already exist or error:', err.message);
  }

  pool.end();
}

run();
