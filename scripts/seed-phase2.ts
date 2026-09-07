import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const org2Id = 'b0000000-0000-0000-0000-000000000002';
    const check = await client.query('SELECT count(*) FROM buildings WHERE organization_id = $1', [org2Id]);
    if (parseInt(check.rows[0].count, 10) === 0) {
      console.log('Seeding Sheger Real Estate buildings...');

      const b1 = await client.query(
        `INSERT INTO buildings (organization_id, name, code, address, city, description, number_of_floors, total_units, status)
         VALUES ($1, 'Sheger Grand Plaza', 'SGP-01', 'Kazanchis St, Kirkos', 'Addis Ababa', 'Modern commercial plaza with retail and office suites', 4, 4, 'ACTIVE')
         RETURNING id`,
        [org2Id]
      );
      const b1Id = b1.rows[0].id;

      const b2 = await client.query(
        `INSERT INTO buildings (organization_id, name, code, address, city, description, number_of_floors, total_units, status)
         VALUES ($1, 'Kazanchis Tech Hub', 'KTH-02', 'Menelik II Ave', 'Addis Ababa', 'Dedicated tech and modern enterprise co-working suites', 5, 2, 'ACTIVE')
         RETURNING id`,
        [org2Id]
      );
      const b2Id = b2.rows[0].id;

      // Floors for b1
      const f1 = await client.query(
        `INSERT INTO floors (organization_id, building_id, floor_number, floor_name, total_units)
         VALUES ($1, $2, 0, 'Ground Floor (Retail)', 2)
         RETURNING id`,
        [org2Id, b1Id]
      );
      const f1Id = f1.rows[0].id;

      const f2 = await client.query(
        `INSERT INTO floors (organization_id, building_id, floor_number, floor_name, total_units)
         VALUES ($1, $2, 1, 'First Floor (Commercial)', 2)
         RETURNING id`,
        [org2Id, b1Id]
      );
      const f2Id = f2.rows[0].id;

      // Units for b1
      await client.query(
        `INSERT INTO units (organization_id, building_id, floor_id, unit_number, unit_type, area, monthly_rent, status, description, mesh_id)
         VALUES 
           ($1, $2, $3, 'G-01', 'SHOP', 120, 65000, 'VACANT', 'Corner retail showroom facing main street', 'mesh_sheger_g01'),
           ($1, $2, $3, 'G-02', 'SHOP', 95, 52000, 'OCCUPIED', 'Boutique specialty cafe space', 'mesh_sheger_g02'),
           ($1, $2, $4, '101', 'OFFICE', 140, 75000, 'OCCUPIED', 'Corporate office suite with glass partitions', 'mesh_sheger_101'),
           ($1, $2, $4, '102', 'OFFICE', 110, 58000, 'MAINTENANCE', 'Mid-size office unit currently under HVAC servicing', 'mesh_sheger_102')`,
        [org2Id, b1Id, f1Id, f2Id]
      );

      // Floor for b2
      const f3 = await client.query(
        `INSERT INTO floors (organization_id, building_id, floor_number, floor_name, total_units)
         VALUES ($1, $2, 1, 'Mezzanine Tech Labs', 2)
         RETURNING id`,
        [org2Id, b2Id]
      );
      const f3Id = f3.rows[0].id;

      // Units for b2
      await client.query(
        `INSERT INTO units (organization_id, building_id, floor_id, unit_number, unit_type, area, monthly_rent, status, description, mesh_id)
         VALUES 
           ($1, $2, $3, 'T-101', 'OFFICE', 200, 110000, 'OCCUPIED', 'Open layout software engineering incubator space', 'mesh_sheger_t101'),
           ($1, $2, $3, 'T-102', 'STUDIO', 80, 45000, 'RESERVED', 'Executive suite reserved for tech startup onboarding', 'mesh_sheger_t102')`,
        [org2Id, b2Id, f3Id]
      );

      console.log('Seeded Sheger Real Estate successfully!');
    } else {
      console.log('Sheger Real Estate already has data.');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seeding error:', e);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
