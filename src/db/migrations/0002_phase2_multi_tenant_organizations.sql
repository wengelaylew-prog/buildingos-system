-- Migration: 0002_phase2_multi_tenant_organizations
-- Description: Multi-tenant organization isolation, mesh_id, transform, and indexes for Phase 2

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  slug TEXT,
  logo_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO organizations (id, name, code, slug)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Apex Properties', 'ORG-APEX', 'apex-properties'),
  ('b0000000-0000-0000-0000-000000000002', 'Sheger Real Estate', 'ORG-SHEGER', 'sheger-properties')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE users SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE buildings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE buildings SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_buildings_org_id ON buildings(organization_id);
CREATE INDEX IF NOT EXISTS idx_buildings_org_code ON buildings(organization_id, code);

ALTER TABLE floors ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE floors SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_floors_org_id ON floors(organization_id);
CREATE INDEX IF NOT EXISTS idx_floors_org_bldg_num ON floors(organization_id, building_id, floor_number);

ALTER TABLE units ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE units ADD COLUMN IF NOT EXISTS mesh_id TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS transform JSONB;
UPDATE units SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_units_org_id ON units(organization_id);
CREATE INDEX IF NOT EXISTS idx_units_org_unit_num ON units(organization_id, unit_number);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
UPDATE audit_logs SET organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
