const GATE_CALL_URL = 'https://storage.builtbyecho.xyz/echo-gate/public/tools/public-api-finder/call';
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST required' });

  try {
    const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
    const query = String(body.query || '').trim();
    const txHash = String(body.txHash || '').trim();

    if (!query) return json(res, 400, { error: 'query is required' });
    if (!TX_HASH_RE.test(txHash)) return json(res, 400, { error: 'valid Base transaction hash is required' });

    const payload = {
      query,
      limit: Math.min(Math.max(Number(body.limit || 5), 1), 10),
      noAuth: body.noAuth !== false,
      https: body.https !== false,
      cors: body.cors || 'Yes',
      account: 'human-interface',
    };

    const upstream = await fetch(GATE_CALL_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Echo-Payment-Tx': txHash,
      },
      body: JSON.stringify(payload),
    });
    const responseBody = await upstream.json().catch(() => ({ error: 'invalid_paid_response' }));
    return json(res, upstream.status, responseBody);
  } catch (error) {
    return json(res, 502, { error: error?.message || 'paid_call_failed' });
  }
}
