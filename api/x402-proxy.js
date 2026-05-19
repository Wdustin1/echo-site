const BANKR_OWNER = '0x2a16625fad3b0d840ac02c7c59edea3781e340ae';
const BANKR_BASE = `https://x402.bankr.bot/${BANKR_OWNER}`;

const SERVICES = {
  'vaultline-upload': `${BANKR_BASE}/vaultline-upload`,
  'vaultline-download': `${BANKR_BASE}/vaultline-download`,
  'vaultline-list': `${BANKR_BASE}/vaultline-list`,
  'public-api-finder': `${BANKR_BASE}/public-api-finder`,
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

const getServiceName = (req) => {
  const rawUrl = req.url || '';
  const parsed = new URL(rawUrl, 'https://x402.builtbyecho.xyz');
  return parsed.searchParams.get('service');
};

export default async function handler(req, res) {
  const service = getServiceName(req);
  const targetUrl = SERVICES[service];

  if (!targetUrl) {
    return json(res, 404, {
      ok: false,
      error: 'Unknown x402 service',
      services: Object.keys(SERVICES),
    });
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.setHeader(
      'access-control-allow-headers',
      'content-type,accept,payment,payment-signature,x-payment,x-payment-signature'
    );
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'GET or POST required' });
  }

  try {
    const body = req.method === 'GET' ? undefined : await readBody(req);
    const headers = {};

    for (const [name, value] of Object.entries(req.headers)) {
      const lowerName = name.toLowerCase();
      if (HOP_BY_HOP_HEADERS.has(lowerName) || value === undefined) continue;
      headers[name] = Array.isArray(value) ? value.join(', ') : value;
    }

    headers['x-builtbyecho-x402-proxy'] = service;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('x-builtbyecho-x402-proxy', service);

    const responseBody = Buffer.from(await response.arrayBuffer());
    res.end(responseBody);
  } catch (error) {
    return json(res, 502, {
      ok: false,
      error: 'x402 proxy request failed',
      detail: error?.message || String(error),
    });
  }
}
