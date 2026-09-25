CREATE TABLE "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"content" text NOT NULL,
	"post_type" text DEFAULT 'GENERAL' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tma_otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" text NOT NULL,
	"identifier" text NOT NULL,
	"user_id" uuid,
	"code_hash" text NOT NULL,
	"purpose" text DEFAULT 'TMA_LOGIN' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"request_ip" text
);
--> statement-breakpoint
CREATE TABLE "utility_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reading_id" uuid,
	"unit_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"tenant_id" uuid,
	"contract_id" uuid,
	"invoice_id" uuid,
	"bill_number" text NOT NULL,
	"utility_type" text NOT NULL,
	"billing_period" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"remaining_amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"due_date" text NOT NULL,
	"is_shared_bill" boolean DEFAULT false NOT NULL,
	"shared_bill_id" uuid,
	"split_ratio" numeric(6, 4),
	"paid_at" text,
	"payment_method" text,
	"payment_reference" text,
	"paid_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "utility_bills_bill_number_unique" UNIQUE("bill_number")
);
--> statement-breakpoint
CREATE TABLE "utility_readings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"building_id" uuid NOT NULL,
	"utility_type" text NOT NULL,
	"billing_period" text NOT NULL,
	"previous_reading" numeric(12, 3) DEFAULT '0' NOT NULL,
	"current_reading" numeric(12, 3) NOT NULL,
	"consumption" numeric(12, 3) NOT NULL,
	"unit_price" numeric(12, 4) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"unit" text DEFAULT 'kWh' NOT NULL,
	"reading_date" text NOT NULL,
	"entered_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"purpose" text,
	"status" text DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"logged_by" uuid,
	"arrived_at" timestamp DEFAULT now() NOT NULL,
	"departed_at" timestamp,
	"telegram_message_id" text
);
--> statement-breakpoint
ALTER TABLE "otp_codes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "otp_codes" CASCADE;--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "latitude" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "buildings" ADD COLUMN "longitude" numeric(10, 6);--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signature_url" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "signature_date" timestamp;--> statement-breakpoint
ALTER TABLE "gate_passes" ADD COLUMN "token" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "parent_invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "gateway_transaction_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "checkout_url" text;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tma_otp_codes" ADD CONSTRAINT "tma_otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_reading_id_utility_readings_id_fk" FOREIGN KEY ("reading_id") REFERENCES "public"."utility_readings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_readings" ADD CONSTRAINT "utility_readings_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_logged_by_users_id_fk" FOREIGN KEY ("logged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_otp_codes_identifier" ON "tma_otp_codes" USING btree ("channel","identifier");--> statement-breakpoint
CREATE INDEX "idx_otp_codes_created_at" ON "tma_otp_codes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_utility_bills_org_period" ON "utility_bills" USING btree ("organization_id","billing_period");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_utility_bills_unit_period_type" ON "utility_bills" USING btree ("unit_id","billing_period","utility_type");--> statement-breakpoint
CREATE INDEX "idx_utility_bills_tenant" ON "utility_bills" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_utility_bills_status" ON "utility_bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_utility_bills_building" ON "utility_bills" USING btree ("building_id");--> statement-breakpoint
CREATE INDEX "idx_utility_readings_org_period_type" ON "utility_readings" USING btree ("organization_id","billing_period","utility_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_utility_readings_unit_period_type" ON "utility_readings" USING btree ("unit_id","billing_period","utility_type");--> statement-breakpoint
CREATE INDEX "idx_utility_readings_building" ON "utility_readings" USING btree ("building_id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_parent_invoice_id_invoices_id_fk" FOREIGN KEY ("parent_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;