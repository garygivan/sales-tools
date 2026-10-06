/**
 * actions.js — Deal action item CRUD
 * POST /api/actions         — create action(s) for a deal
 * PUT  /api/actions/:id     — update an action
 * DELETE /api/actions/:id   — delete an action
 */

export async function actionsHandler(req, res, db) {
  if (!db) return res.status(503).json({ error: 'Database not configured' });
  const method = req.method;
  const idMatch = req.path.match(/\/api\/actions\/(\d+)/);
  const actionId = idMatch ? parseInt(idMatch[1]) : null;

  try {
    if (method === 'POST' && !actionId) {
      const { deal_id, items } = req.body;
      if (!deal_id) return res.status(400).json({ error: 'deal_id required' });
      const list = Array.isArray(items) ? items : [req.body];
      const inserted = [];
      for (const a of list) {
        const { rows } = await db.query(
          `INSERT INTO deal_actions (deal_id,item,owner,due,priority,source,status,context)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [deal_id, a.item, a.owner, a.due, a.priority||'medium',
           a.source||'manual', a.status||'open', a.context]
        );
        inserted.push(rows[0]);
      }
      return res.json(inserted);
    }

    if (method === 'PUT' && actionId) {
      const { item, owner, due, priority, status, context } = req.body;
      const { rows } = await db.query(
        `UPDATE deal_actions SET
           item=COALESCE($2,item), owner=COALESCE($3,owner), due=COALESCE($4,due),
           priority=COALESCE($5,priority), status=COALESCE($6,status),
           context=COALESCE($7,context), updated_at=NOW()
         WHERE id=$1 RETURNING *`,
        [actionId, item, owner, due, priority, status, context]
      );
      if (!rows.length) return res.status(404).json({ error: 'Action not found' });
      return res.json(rows[0]);
    }

    if (method === 'DELETE' && actionId) {
      await db.query('DELETE FROM deal_actions WHERE id=$1', [actionId]);
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[actions]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
