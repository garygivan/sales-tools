/**
 * deals.js — Deal CRUD API
 * GET  /api/deals          — list all deals (summary)
 * POST /api/deals          — create or upsert a deal by company name
 * GET  /api/deals/:id      — get full deal with actions + events
 * PUT  /api/deals/:id      — update deal fields / state blob
 * DELETE /api/deals/:id    — delete deal
 */

export { dealsHandler as default };

export async function dealsHandler(req, res, db) {
  if (!db) return res.status(503).json({ error: 'Database not configured' });

  const method = req.method;
  const idMatch = req.path.match(/\/api\/deals\/(\d+)/);
  const dealId = idMatch ? parseInt(idMatch[1]) : null;

  try {
    // LIST
    if (method === 'GET' && !dealId) {
      const { rows } = await db.query(
        `SELECT id, company, bc, sdr, ees, arr, close_date, updated_at
         FROM deals ORDER BY updated_at DESC LIMIT 100`
      );
      return res.json(rows);
    }

    // GET ONE
    if (method === 'GET' && dealId) {
      const [deal, actions, events] = await Promise.all([
        db.query('SELECT * FROM deals WHERE id=$1', [dealId]),
        db.query('SELECT * FROM deal_actions WHERE deal_id=$1 ORDER BY created_at ASC', [dealId]),
        db.query('SELECT * FROM deal_events WHERE deal_id=$1 ORDER BY created_at DESC LIMIT 50', [dealId]),
      ]);
      if (!deal.rows.length) return res.status(404).json({ error: 'Deal not found' });
      return res.json({ ...deal.rows[0], actions: actions.rows, events: events.rows });
    }

    // CREATE / UPSERT
    if (method === 'POST' && !dealId) {
      const { company, bc, sdr, sc, ees, arr, close_date, website, state } = req.body;
      if (!company) return res.status(400).json({ error: 'company is required' });

      // Upsert by company name (case-insensitive)
      const existing = await db.query('SELECT id FROM deals WHERE LOWER(company)=LOWER($1)', [company]);
      let deal;
      if (existing.rows.length) {
        const { rows } = await db.query(
          `UPDATE deals SET bc=$2,sdr=$3,sc=$4,ees=$5,arr=$6,close_date=$7,website=$8,
           state=COALESCE($9::jsonb, state), updated_at=NOW()
           WHERE id=$1 RETURNING *`,
          [existing.rows[0].id, bc, sdr, sc, ees, arr, close_date, website,
           state ? JSON.stringify(state) : null]
        );
        deal = rows[0];
      } else {
        const { rows } = await db.query(
          `INSERT INTO deals (company,bc,sdr,sc,ees,arr,close_date,website,state)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING *`,
          [company, bc, sdr, sc, ees, arr, close_date, website,
           JSON.stringify(state || {})]
        );
        deal = rows[0];
      }
      return res.json(deal);
    }

    // UPDATE
    if (method === 'PUT' && dealId) {
      const { bc, sdr, sc, ees, arr, close_date, website, state } = req.body;
      const { rows } = await db.query(
        `UPDATE deals SET bc=COALESCE($2,bc), sdr=COALESCE($3,sdr), sc=COALESCE($4,sc),
         ees=COALESCE($5,ees), arr=COALESCE($6,arr), close_date=COALESCE($7,close_date),
         website=COALESCE($8,website),
         state=CASE WHEN $9::text IS NOT NULL THEN $9::jsonb ELSE state END,
         updated_at=NOW()
         WHERE id=$1 RETURNING *`,
        [dealId, bc, sdr, sc, ees, arr, close_date, website,
         state ? JSON.stringify(state) : null]
      );
      if (!rows.length) return res.status(404).json({ error: 'Deal not found' });
      return res.json(rows[0]);
    }

    // DELETE
    if (method === 'DELETE' && dealId) {
      await db.query('DELETE FROM deals WHERE id=$1', [dealId]);
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[deals]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
