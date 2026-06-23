import { DEFAULT_PERKS, ECHO_TOKEN, PERK_TOKENS, echoFromRaw, makeClaimId, tokenRequirementsForPerk } from '../assets/echo-perks-core.js';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const BASE_RPC_URL = process.env.BASE_RPC_URL || process.env.ECHO_GATE_BASE_RPC_URL || 'https://mainnet.base.org';
const PERKS_KEY = process.env.ECHO_PERKS_KEY || 'echo-perks:v1:perks';
const CLAIMS_INDEX_KEY = process.env.ECHO_PERKS_CLAIMS_INDEX_KEY || 'echo-perks:v1:claims';
const ADMIN_KEY = process.env.ECHO_PERKS_ADMIN_KEY || '';
const DISCORD_WEBHOOK_URL = process.env.ECHO_PERKS_DISCORD_WEBHOOK_URL || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '';
const DISCORD_ECHO_HOLDER_ROLE_ID = process.env.DISCORD_ECHO_HOLDER_ROLE_ID || '';

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

export function parseBody(req) {
  if (!req.body) return {};
  return typeof req.body === 'object' ? req.body : JSON.parse(req.body);
}

export function normalizeAddress(value) {
  const text = String(value || '').trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(text)) throw new Error('invalid_wallet');
  return `0x${text.slice(2).toLowerCase()}`;
}

export function requireAdmin(req) {
  if (!ADMIN_KEY && !process.env.VERCEL) return true;
  const header = String(req.headers['x-echo-admin-key'] || '');
  return Boolean(ADMIN_KEY && header === ADMIN_KEY);
}

export async function listPerks() {
  const stored = await redis(['GET', PERKS_KEY]).catch(() => null);
  if (!stored) return { perks: DEFAULT_PERKS, persistence: redisConfigured() ? 'empty' : 'not_configured' };
  try {
    return { perks: JSON.parse(stored), persistence: 'redis' };
  } catch {
    return { perks: DEFAULT_PERKS, persistence: 'corrupt_fallback' };
  }
}

export async function savePerks(perks) {
  if (!redisConfigured()) return { ok: false, reason: 'redis_not_configured' };
  await redis(['SET', PERKS_KEY, JSON.stringify(perks)]);
  return { ok: true };
}

export async function createClaim({
  wallet,
  perk,
  balance,
  tokenSymbol = 'ECHO',
  discordHandle,
  discordUserId,
  contactHandle,
  contactEmail,
  projectUrl,
  requestNote,
}) {
  const normalizedWallet = normalizeAddress(wallet);
  const id = makeClaimId(normalizedWallet, perk.id);
  const now = new Date().toISOString();
  const normalizedContactHandle = cleanText(contactHandle || discordHandle, 120);
  const normalizedContactEmail = cleanText(contactEmail, 160);
  const normalizedProjectUrl = cleanText(projectUrl, 400);
  const normalizedRequestNote = cleanText(requestNote, 1200);
  const toolCredit = isToolCreditPerk(perk);
  const claim = {
    id,
    wallet: normalizedWallet,
    perkId: perk.id,
    title: perk.title,
    partner: perk.partner,
    deliverable: perk.deliverable,
    balance,
    tokenSymbol,
    contactHandle: normalizedContactHandle,
    contactEmail: normalizedContactEmail,
    projectUrl: normalizedProjectUrl,
    requestNote: normalizedRequestNote,
    discordHandle: normalizedContactHandle,
    discordUserId: cleanText(discordUserId, 80),
    status: toolCredit ? 'tool credit available' : 'pending fulfillment',
    createdAt: now,
    updatedAt: now,
  };

  if (!redisConfigured()) {
    await notifyDiscord(claim, { persisted: false });
    return { claim, persistence: 'not_configured', created: true };
  }

  const claimKey = claimKeyFor(id);
  const set = await redis(['SET', claimKey, JSON.stringify(claim), 'NX']);
  if (set !== 'OK') {
    const existing = await redis(['GET', claimKey]);
    return { claim: JSON.parse(existing), persistence: 'redis', created: false };
  }
  await redis(['LPUSH', CLAIMS_INDEX_KEY, claimKey]);
  await notifyDiscord(claim, { persisted: true });
  await assignDiscordRole(claim);
  return { claim, persistence: 'redis', created: true };
}

export async function findClaim(wallet, perkId) {
  const normalizedWallet = normalizeAddress(wallet);
  const id = makeClaimId(normalizedWallet, perkId);
  if (!redisConfigured()) return null;
  const stored = await redis(['GET', claimKeyFor(id)]);
  return stored ? JSON.parse(stored) : null;
}

export async function listClaimsForWallet(wallet) {
  const normalizedWallet = normalizeAddress(wallet);
  if (!redisConfigured()) return [];
  const claims = (await listClaims()).filter((claim) => String(claim.wallet || '').toLowerCase() === normalizedWallet);
  return claims.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function listClaims(limit = 500) {
  if (!redisConfigured()) return [];
  const stop = Math.max(0, Number(limit || 500) - 1);
  const keys = await redis(['LRANGE', CLAIMS_INDEX_KEY, '0', String(stop)]);
  const claims = [];
  for (const key of keys || []) {
    const stored = await redis(['GET', key]);
    if (!stored) continue;
    try {
      claims.push(JSON.parse(stored));
    } catch {
      // Ignore corrupt individual claim rows; the rest of the ledger should remain usable.
    }
  }
  return claims;
}

export async function updateClaim(claim) {
  if (!redisConfigured()) return { claim, persistence: 'not_configured' };
  const id = cleanText(claim?.id, 220);
  if (!id) throw new Error('invalid_claim');
  const updated = { ...claim, updatedAt: new Date().toISOString() };
  await redis(['SET', claimKeyFor(id), JSON.stringify(updated)]);
  return { claim: updated, persistence: 'redis' };
}

function isToolCreditPerk(perk) {
  const text = `${perk?.type || ''} ${perk?.deliverable || ''} ${perk?.title || ''}`.toLowerCase();
  return text.includes('tool credit') || text.includes('partner credit') || text.includes('dual-holder credit');
}

export async function readEchoBalance(wallet) {
  return readTokenBalance(wallet, ECHO_TOKEN);
}

export async function readTokenBalance(wallet, token = ECHO_TOKEN) {
  const normalizedWallet = normalizeAddress(wallet);
  const selector = '0x70a08231';
  const encodedWallet = normalizedWallet.slice(2).padStart(64, '0');
  const result = await rpc('eth_call', [
    {
      to: token.address,
      data: `${selector}${encodedWallet}`,
    },
    'latest',
  ]);
  return echoFromRaw(BigInt(result), token.decimals);
}

export async function readRequiredTokenBalance(perk, wallet) {
  const requirements = tokenRequirementsForPerk(perk);
  const primaryRequirement = requirements[0] || { token: 'ECHO' };
  const symbol = String(primaryRequirement.token || 'ECHO').toUpperCase();
  const token = PERK_TOKENS[symbol] || ECHO_TOKEN;
  const balances = {};
  for (const requirement of requirements.length ? requirements : [primaryRequirement]) {
    const requirementSymbol = String(requirement.token || 'ECHO').toUpperCase();
    const requirementToken = PERK_TOKENS[requirementSymbol] || ECHO_TOKEN;
    balances[requirementSymbol] = await readTokenBalance(wallet, requirementToken);
  }
  return {
    balance: balances[symbol],
    balances,
    tokenSymbol: token.displaySymbol || token.symbol,
    requirementSymbol: token.symbol,
  };
}

export function findPerk(perks, perkId) {
  return perks.find((perk) => perk.id === perkId);
}

export function validateClaimEligibility(perk, balance, balances = {}) {
  if (!perk) return { ok: false, reason: 'perk_not_found' };
  if (perk.status === 'draft') return { ok: false, reason: 'perk_not_live' };
  const requirements = tokenRequirementsForPerk(perk);
  if (!requirements.length) {
    const required = Number(perk.minEcho ?? 0);
    if (Number(balance || 0) < required) return { ok: false, reason: 'insufficient_token_balance' };
    return { ok: true };
  }
  for (const requirement of requirements) {
    const symbol = String(requirement.token || 'ECHO').toUpperCase();
    const required = Number(requirement.min || 0);
    if (Number(balances[symbol] || 0) < required) {
      return { ok: false, reason: 'insufficient_token_balance', token: symbol, required };
    }
  }
  return { ok: true };
}

function claimKeyFor(id) {
  return `echo-perks:v1:claim:${id}`;
}

function redisConfigured() {
  return Boolean(REDIS_URL && REDIS_TOKEN);
}

async function redis(command) {
  if (!redisConfigured()) return null;
  const response = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${REDIS_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`redis_http_${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.error);
  return body.result;
}

async function rpc(method, params) {
  const response = await fetch(BASE_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `${Date.now()}-${Math.random()}`,
      method,
      params,
    }),
  });
  if (!response.ok) throw new Error(`rpc_http_${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.error.message || 'rpc_error');
  return body.result;
}

async function notifyDiscord(claim, { persisted }) {
  if (!DISCORD_WEBHOOK_URL) return { ok: false, reason: 'webhook_not_configured' };
  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: [
        `New Echo Perks claim: **${claim.title}**`,
        `Wallet: \`${claim.wallet}\``,
        `Balance: ${claim.balance} ${claim.tokenSymbol || 'ECHO'}`,
        claim.contactHandle ? `Contact: ${claim.contactHandle}` : '',
        claim.contactEmail ? `Email: ${claim.contactEmail}` : '',
        claim.projectUrl ? `Project/link: ${claim.projectUrl}` : '',
        claim.requestNote ? `Request: ${claim.requestNote}` : '',
        `Status: ${claim.status}`,
        `Persistence: ${persisted ? 'redis' : 'not configured'}`,
      ].filter(Boolean).join('\n'),
    }),
  });
  return { ok: response.ok, status: response.status };
}

function cleanText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

async function assignDiscordRole(claim) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_ECHO_HOLDER_ROLE_ID || !claim.discordUserId) {
    return { ok: false, reason: 'discord_role_not_configured' };
  }
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${claim.discordUserId}/roles/${DISCORD_ECHO_HOLDER_ROLE_ID}`,
    {
      method: 'PUT',
      headers: {
        authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    },
  );
  return { ok: response.ok, status: response.status };
}
