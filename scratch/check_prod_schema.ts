import { Pool } from 'pg';
import 'dotenv/config';

async function checkProd() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const res = await pool.query(\`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('announcements', 'invoices', 'invoice_items', 'mall_shoppers');
    \`);
    console.log("Existing tables:", res.rows.map(r => r.table_name));
    
    // Also check for tax_amount
    const resCol = await pool.query(\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name IN ('tax_amount', 'discount_amount');
    \`);
    console.log("Existing invoice columns:", resCol.rows.map(r => r.column_name));
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkProd();

