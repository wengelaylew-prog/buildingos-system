const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  const res = await pool.query('SELECT count(*) FROM organizations');
  console.log(res.rows);
  process.exit(0);
}
run();
