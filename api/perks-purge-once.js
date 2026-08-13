const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const PURGE_TOKEN = 'e9e5a7d7-1b6c-4de6-bf19-c9e826c7ec2b';

async function redis(command) {
  const response = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${REDIS_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`Redis ${response.status}`);
  const data = await response.json();
  return data.result;
}

async function matchingKeys() {
  let cursor = '0';
  const keys = [];
  do {
    const [next, batch] = await redis(['SCAN', cursor, 'MATCH', 'echo-perks:v1:*', 'COUNT', '100']);
    cursor = String(next);
    keys.push(...batch);
  } while (cursor !== '0');
  return [...new Set(keys)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST' || req.headers.authorization !== `Bearer ${PURGE_TOKEN}`) {
    return res.status(404).json({ ok: false });
  }
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ ok: false, error: 'redis_missing' });
  const before = await matchingKeys();
  const deleted = before.length ? await redis(['DEL', ...before]) : 0;
  const after = await matchingKeys();
  return res.status(200).json({ ok: after.length === 0, keysBefore: before.length, deleted, keysAfter: after.length });
}
