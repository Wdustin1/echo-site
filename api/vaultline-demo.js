const BANKR_OWNER = '0x2a16625fad3b0d840ac02c7c59edea3781e340ae';
const BANKR_BASE = `https://x402.bankr.bot/${BANKR_OWNER}`;
const STORAGE_HEALTH_URL = 'https://storage.builtbyecho.xyz/v1/health';

const endpoints = {
  upload: `${BANKR_BASE}/vaultline-upload`,
  download: `${BANKR_BASE}/vaultline-download`,
  list: `${BANKR_BASE}/vaultline-list`,
};

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

const parseChallenge = (body) => {
  const accept = body?.accepts?.[0] || {};
  const atomicAmount = Number(accept.amount || accept.maxAmountRequired || 0);
  return {
    scheme: accept.scheme || null,
    network: accept.network || null,
    amountUsdc: atomicAmount ? (atomicAmount / 1_000_000).toFixed(6) : null,
    asset: accept.extra?.name || 'USDC',
    resource: accept.resource || null,
    payTo: accept.payTo || null,
    facilitator: body?.facilitator || null,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'GET or POST required' });
  }

  try {
    const healthResponse = await fetch(STORAGE_HEALTH_URL, { headers: { accept: 'application/json' } });
    const health = await healthResponse.json().catch(() => null);

    const challengeResponse = await fetch(endpoints.list, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ prefix: 'demo/' }),
    });
    const challengeBody = await challengeResponse.json().catch(async () => ({
      raw: await challengeResponse.text(),
    }));

    return json(res, 200, {
      ok: healthResponse.ok && challengeResponse.status === 402,
      checkedAt: new Date().toISOString(),
      storage: {
        ok: healthResponse.ok,
        status: healthResponse.status,
        body: health,
      },
      bankr: {
        owner: BANKR_OWNER,
        endpoints,
        probe: {
          endpoint: endpoints.list,
          status: challengeResponse.status,
          paymentRequired: challengeResponse.status === 402,
          challenge: parseChallenge(challengeBody),
        },
      },
      sampleCalls: {
        upload: {
          method: 'POST',
          url: endpoints.upload,
          body: {
            path: 'demo/hello-from-vaultline.txt',
            content: 'hello from an agent artifact',
            encoding: 'text',
            contentType: 'text/plain',
          },
        },
        download: {
          method: 'POST',
          url: endpoints.download,
          body: {
            path: 'demo/hello-from-vaultline.txt',
            asText: true,
          },
        },
        list: {
          method: 'POST',
          url: endpoints.list,
          body: {
            prefix: 'demo/',
          },
        },
      },
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error?.message || 'Vaultline demo check failed',
    });
  }
}
