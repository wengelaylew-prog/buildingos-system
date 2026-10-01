import { Pool } from 'pg';
import 'dotenv/config';

async function runSpecificMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log("Applying 0003_phase_5_minimal_billing...");
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS "invoice_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "invoice_id" uuid NOT NULL,
        "description" text NOT NULL,
        "amount" numeric(12, 2) NOT NULL,
        "type" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
      
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tax_amount" numeric(12, 2) DEFAULT '0';
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2) DEFAULT '0';
      
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoice_items_invoice_id_invoices_id_fk') THEN
          ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    \`);
    console.log("0003 applied.");

    console.log("Applying 0004_classy_secret_warriors...");
    await pool.query(\`
      CREATE TABLE IF NOT EXISTS "mall_shoppers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "organization_id" uuid NOT NULL,
        "shopper_id" text NOT NULL,
        "status" text DEFAULT 'IN' NOT NULL,
        "entry_time" timestamp DEFAULT now() NOT NULL,
        "exit_time" timestamp,
        "scanned_by" uuid NOT NULL
      );
      
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mall_shoppers_organization_id_organizations_id_fk') THEN
          ALTER TABLE "mall_shoppers" ADD CONSTRAINT "mall_shoppers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
      
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mall_shoppers_scanned_by_users_id_fk') THEN
          ALTER TABLE "mall_shoppers" ADD CONSTRAINT "mall_shoppers_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
        END IF;
      END $$;
    \`);
    console.log("0004 applied.");

    process.exit(0);
  } catch(e) {
    console.error("Failed:", e);
    process.exit(1);
  }
}
runSpecificMigrations();

