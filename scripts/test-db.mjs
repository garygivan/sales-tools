#!/usr/bin/env node
// Quick DB connectivity + schema test
import { getPool, initSchema } from '../db.js';

process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.NODE_ENV = 'production';

console.log('[test] Initializing schema...');
await initSchema();

const db = getPool();
if (!db) { console.error('[test] No DB pool'); process.exit(1); }

const r = await db.query('SELECT COUNT(*) as c FROM deals');
console.log('[test] DB OK — deals in table:', r.rows[0].c);

const r2 = await db.query('SELECT COUNT(*) as c FROM deal_actions');
console.log('[test] DB OK — actions in table:', r2.rows[0].c);

process.exit(0);
