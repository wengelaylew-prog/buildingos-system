const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    let orgRes = await client.query(`SELECT id FROM organizations LIMIT 1`);
    let orgId;
    if (orgRes.rows.length === 0) {
      const res = await client.query(`INSERT INTO organizations (name, slug, code) VALUES ('Apex Properties', 'apex-properties', 'APEX') RETURNING id`);
      orgId = res.rows[0].id;
    } else {
      orgId = orgRes.rows[0].id;
    }
    
    let roleRes = await client.query(`SELECT id FROM roles WHERE code = 'TENANT' LIMIT 1`);
    let roleId = roleRes.rows[0].id;

    // Insert user's own email and phone
    const testEmail = 'wengelaylew@gmail.com';
    const testPhone = '0909294950';
    
    let userRes = await client.query(`SELECT id FROM users WHERE email = $1`, [testEmail]);
    let userId;
    if (userRes.rows.length === 0) {
      const res = await client.query(`
        INSERT INTO users (email, phone, full_name, role_id, organization_id, is_active, uid)
        VALUES ($1, $2, 'Wengel Aylew', $3, $4, true, 'wengelaylew-uid')
        RETURNING id
      `, [testEmail, testPhone, roleId, orgId]);
      userId = res.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
    }

    let tenantRes = await client.query(`SELECT id FROM tenants WHERE user_id = $1`, [userId]);
    if (tenantRes.rows.length === 0) {
      await client.query(`
        INSERT INTO tenants (user_id, organization_id, email, phone, first_name, last_name, full_name)
        VALUES ($1, $2, $3, $4, 'Wengel', 'Aylew', 'Wengel Aylew')
      `, [userId, orgId, testEmail, testPhone]);
    }

    console.log('User wengelaylew@gmail.com / 0909294950 created successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
