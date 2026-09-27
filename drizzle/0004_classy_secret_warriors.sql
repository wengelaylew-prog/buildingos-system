CREATE TABLE "mall_shoppers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"digital_id_token" text NOT NULL,
	"shopper_data" text,
	"entered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mall_shoppers" ADD CONSTRAINT "mall_shoppers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;