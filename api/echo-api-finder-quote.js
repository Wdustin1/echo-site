const GATE_QUOTE_URL = 'https://storage.builtbyecho.xyz/echo-gate/tools/public-api-finder/quote';

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'GET required' });

  try {
    const upstream = await fetch(GATE_QUOTE_URL, { headers: { accept: 'application/json' } });
    const body = await upstream.json().catch(() => ({ error: 'invalid_quote_response' }));
    return json(res, upstream.status, body);
  } catch (error) {
    return json(res, 502, { error: error?.message || 'quote_fetch_failed' });
  }
}
