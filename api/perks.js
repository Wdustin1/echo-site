import { json, listPerks, parseBody, requireAdmin, savePerks } from './_perks.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { perks, persistence } = await listPerks();
    return json(res, 200, { ok: true, perks, persistence });
  }

  if (req.method === 'POST') {
    if (!requireAdmin(req)) return json(res, 401, { ok: false, error: 'admin_key_required' });
    const body = parseBody(req);
    if (!Array.isArray(body.perks)) return json(res, 400, { ok: false, error: 'perks_array_required' });
    const saved = await savePerks(body.perks);
    return json(res, saved.ok ? 200 : 202, { ok: saved.ok, ...saved, perks: body.perks });
  }

  return json(res, 405, { ok: false, error: 'GET or POST required' });
}
