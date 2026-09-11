import { createPool } from './index.ts';

// Migration 0003: TMA Auth - otp_codes channel/identifier schema
// Runs automatically at server startup and is idempotent (safe to re-run).
const MIGRATION_SQL = `
-- Step 1: Add phone columns to users (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE;
DROP INDEX IF EXISTS uq_users_email_password_auth;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users (phone) WHERE phone IS NOT NULL;

-- Step 2: Recreate otp_codes only if it has the OLD schema (phone column instead of channel/identifier)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_codes' AND column_name = 'phone'
  ) THEN
    DROP TABLE IF EXISTS otp_codes;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS otp_codes (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  channel      TEXT      NOT NULL,
  identifier   TEXT      NOT NULL,
  user_id      UUID      REFERENCES users(id) ON DELETE CASCADE,
  code_hash    TEXT      NOT NULL,
  purpose      TEXT      NOT NULL DEFAULT 'TMA_LOGIN',
  attempts     INTEGER   NOT NULL DEFAULT 0,
  max_attempts INTEGER   NOT NULL DEFAULT 5,
  expires_at   TIMESTAMP NOT NULL,
  consumed_at  TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  request_ip   TEXT
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_identifier ON otp_codes(channel, identifier);
CREATE INDEX IF NOT EXISTS idx_otp_codes_created_at ON otp_codes(created_at);

-- Step 3: Create tma_sessions if not exists
CREATE TABLE IF NOT EXISTS tma_sessions (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT      NOT NULL UNIQUE,
  method       TEXT      NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  revoked_at   TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tma_sessions_user_id ON tma_sessions(user_id);

-- Step 4: Create telegram_accounts if not exists
CREATE TABLE IF NOT EXISTS telegram_accounts (
  id                    UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  telegram_user_id      TEXT      NOT NULL UNIQUE,
  username              TEXT,
  first_name            TEXT,
  last_name             TEXT,
  photo_url             TEXT,
  last_authenticated_at TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_accounts_user_id ON telegram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_accounts_telegram_user_id ON telegram_accounts(telegram_user_id);
`;

export async function runMigrations() {
  const pool = createPool();
  const client = await pool.connect();
  try {
    console.log('[migration] Running TMA auth migrations...');
    await client.query(MIGRATION_SQL);
    console.log('[migration] TMA auth migrations complete.');
  } catch (err) {
    console.error('[migration] Migration failed:', err);
    // Do not crash the server — log and continue.
    // The app will show SQL errors until the DB is fixed,
    // but other endpoints (admin, etc.) will still work.
  } finally {
    client.release();
  }
}
