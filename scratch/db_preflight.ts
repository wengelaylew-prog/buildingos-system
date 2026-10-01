import { db } from '../src/db/index.ts';
import { sql } from 'drizzle-orm';

async function runPreflight() {
  try {
    const check1 = await db.execute(sql\`SELECT 1\`);
    const invoiceItemsRes = await db.execute(sql\`SELECT to_regclass('public.invoice_items');\`);
    const taxAmountRes = await db.execute(sql\`SELECT column_name FROM information_schema.columns WHERE table_name='invoices' AND column_name='tax_amount';\`);
    const discountAmountRes = await db.execute(sql\`SELECT column_name FROM information_schema.columns WHERE table_name='invoices' AND column_name='discount_amount';\`);
    const invoicesCountRes = await db.execute(sql\`SELECT COUNT(*) as count FROM invoices\`);
    const paymentsCountRes = await db.execute(sql\`SELECT COUNT(*) as count FROM payments\`);
    
    console.log(JSON.stringify({
      connection: 'PASS',
      invoiceItemsExists: invoiceItemsRes.rows[0].to_regclass !== null,
      taxAmountExists: taxAmountRes.rows.length > 0,
      discountAmountExists: discountAmountRes.rows.length > 0,
      invoiceCount: invoicesCountRes.rows[0].count,
      paymentCount: paymentsCountRes.rows[0].count
    }));
    process.exit(0);
  } catch(e) {
    console.log(JSON.stringify({ connection: 'FAIL', error: e.message }));
    process.exit(1);
  }
}
runPreflight();

