-- Migration: 0001_phase2_buildings_floors_units
-- Description: Add deleted_at, floor soft deletion, uniqueness constraints, and performance indexes for Phase 2

-- ================= UP MIGRATION =================
-- 1. Buildings enhancements
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status);
CREATE INDEX IF NOT EXISTS idx_buildings_code ON buildings(code);

-- 2. Floors enhancements
ALTER TABLE floors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_floors_building_floor_number ON floors(building_id, floor_number);
CREATE INDEX IF NOT EXISTS idx_floors_building_id ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_floors_floor_number ON floors(floor_number);

-- 3. Units enhancements
ALTER TABLE units ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_units_building_unit_number ON units(building_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_units_building_id ON units(building_id);
CREATE INDEX IF NOT EXISTS idx_units_floor_id ON units(floor_id);
CREATE INDEX IF NOT EXISTS idx_units_unit_number ON units(unit_number);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);

-- ================= DOWN MIGRATION =================
-- To rollback:
-- DROP INDEX IF EXISTS idx_units_status;
-- DROP INDEX IF EXISTS idx_units_unit_number;
-- DROP INDEX IF EXISTS idx_units_floor_id;
-- DROP INDEX IF EXISTS idx_units_building_id;
-- DROP INDEX IF EXISTS uq_units_building_unit_number;
-- ALTER TABLE units DROP COLUMN IF EXISTS deleted_at;
-- DROP INDEX IF EXISTS idx_floors_floor_number;
-- DROP INDEX IF EXISTS idx_floors_building_id;
-- DROP INDEX IF EXISTS uq_floors_building_floor_number;
-- ALTER TABLE floors DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE floors DROP COLUMN IF EXISTS is_deleted;
-- DROP INDEX IF EXISTS idx_buildings_code;
-- DROP INDEX IF EXISTS idx_buildings_status;
-- ALTER TABLE buildings DROP COLUMN IF EXISTS deleted_at;
