import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import 'dotenv/config';

async function runMigrate() {
  console.log("Starting programmatic migration...");
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const db = drizzle(pool);
    
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("MIGRATION FAILED:");
    console.error(err);
    process.exit(1);
  }
}

runMigrate();

