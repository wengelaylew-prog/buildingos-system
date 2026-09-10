-- Migration: 0003_tma_auth
-- Description: Adds phone fields to users, OTP codes and TMA session tables for
--              the Tenant Telegram Mini App (Telegram / Email OTP / Phone OTP login).
--              No password authentication is used. Admin Web Firebase auth (users.uid)
--              is untouched. No tenant, lease, building, floor, unit, invoice, payment
--              or telegram_accounts tables are modified.
--
-- UPGRADE SAFETY
-- --------------
-- This migration may be applied to a database that already has an OLD otp_codes
-- schema (containing a 'phone TEXT NOT NULL' column from a prior development version).
-- Because OTP codes are ephemeral (5-minute TTL, single-use), any rows in the old
-- table are either already expired or already consumed and carry no business value.
-- The old table is therefore dropped unconditionally and replaced with the correct
-- channel/identifier schema.
--
-- All other operations use ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS /
-- CREATE INDEX IF NOT EXISTS, making this migration safe to re-run.

-- ============================================================
-- STEP 1: users table — phone columns (additive, safe to re-run)
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Remove stale password-auth index if it was ever applied (from an older migration version).
-- Harmless if the index does not exist.
DROP INDEX IF EXISTS uq_users_email_password_auth;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users (phone) WHERE phone IS NOT NULL;

-- ============================================================
-- STEP 2: otp_codes table — drop old schema and recreate
-- ============================================================
-- SAFETY: OTP records are ephemeral (TTL=5min, single-use).
--         All existing rows are expired or consumed.
--         No business data is lost by this drop.

DROP TABLE IF EXISTS otp_codes;

CREATE TABLE otp_codes (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  channel     TEXT      NOT NULL,                              -- 'EMAIL' or 'PHONE'
  identifier  TEXT      NOT NULL,                              -- normalized email or phone
  user_id     UUID      REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT      NOT NULL,
  purpose     TEXT      NOT NULL DEFAULT 'TMA_LOGIN',
  attempts    INTEGER   NOT NULL DEFAULT 0,
  max_attempts INTEGER  NOT NULL DEFAULT 5,
  expires_at  TIMESTAMP NOT NULL,
  consumed_at TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  request_ip  TEXT
);

CREATE INDEX idx_otp_codes_identifier ON otp_codes(channel, identifier);
CREATE INDEX idx_otp_codes_created_at ON otp_codes(created_at);

-- ============================================================
-- STEP 3: tma_sessions table — create if not exists
-- ============================================================
-- method column is TEXT (no enum/check constraint) so it accepts
-- all three values: TELEGRAM, EMAIL, PHONE.

CREATE TABLE IF NOT EXISTS tma_sessions (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT      NOT NULL UNIQUE,
  method       TEXT      NOT NULL,    -- 'TELEGRAM', 'EMAIL', or 'PHONE'
  expires_at   TIMESTAMP NOT NULL,
  revoked_at   TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tma_sessions_user_id ON tma_sessions(user_id);

-- ============================================================
-- NOTE: password_hash column (if present from an older migration)
-- is left in place to avoid any risk from an ALTER TABLE DROP in
-- production. It is a nullable TEXT column with no application
-- references and causes no functional problem. It can be removed
-- in a dedicated maintenance migration once confirmed safe.
-- ============================================================
