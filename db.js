/**
 * db.js — PostgreSQL connection pool + schema bootstrap
 * Uses DATABASE_URL env var (Render internal connection string).
 */

import pg from 'pg';
const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn('[db] DATABASE_URL not set — deal persistence disabled');
      return null;
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
    pool.on('error', (err) => console.error('[db] pool error:', err.message));
  }
  return pool;
}

/**
 * Run on startup — creates tables if they don't exist.
 */
export async function initSchema() {
  const db = getPool();
  if (!db) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id          SERIAL PRIMARY KEY,
        company     TEXT NOT NULL,
        bc          TEXT,
        sdr         TEXT,
        sc          TEXT,
        ees         TEXT,
        arr         TEXT,
        close_date  TEXT,
        website     TEXT,
        state       JSONB DEFAULT '{}'::jsonb,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deal_actions (
        id          SERIAL PRIMARY KEY,
        deal_id     INTEGER REFERENCES deals(id) ON DELETE CASCADE,
        item        TEXT NOT NULL,
        owner       TEXT,
        due         TEXT,
        priority    TEXT DEFAULT 'medium',
        source      TEXT DEFAULT 'manual',
        status      TEXT DEFAULT 'open',
        context     TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deal_events (
        id          SERIAL PRIMARY KEY,
        deal_id     INTEGER REFERENCES deals(id) ON DELETE CASCADE,
        event_type  TEXT NOT NULL,
        summary     TEXT,
        payload     JSONB DEFAULT '{}'::jsonb,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company);
      CREATE INDEX IF NOT EXISTS idx_actions_deal ON deal_actions(deal_id);
      CREATE INDEX IF NOT EXISTS idx_events_deal ON deal_events(deal_id);
    `);
    console.log('[db] schema ready');
  } catch (err) {
    console.error('[db] schema init failed:', err.message);
  }
}
