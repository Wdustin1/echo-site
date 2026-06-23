import {
  findClaim,
  findPerk,
  json,
  listPerks,
  parseBody,
  readRequiredTokenBalance,
  updateClaim,
  validateClaimEligibility,
} from './_perks.js';

const MIROSHARK_ENDPOINT = 'https://x402.miroshark.xyz/run';
const MIROSHARK_AFFILIATE = '0xDEADBEEFCAFEBABEFEEDFACEBAADF00DDEADC0DE';
const DISCORD_WEBHOOK_URL = process.env.ECHO_PERKS_DISCORD_WEBHOOK_URL || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST required' });

  try {
    const body = parseBody(req);
    const wallet = body.wallet;
    const perkId = String(body.perkId || '');
    const { perks } = await listPerks();
    const perk = findPerk(perks, perkId);
    if (!isMirosharkPerk(perk)) return json(res, 404, { ok: false, error: 'miroshark_perk_not_found' });

    const { balance, balances, tokenSymbol } = await readRequiredTokenBalance(perk, wallet);
    const eligibility = validateClaimEligibility(perk, balance, balances);
    if (!eligibility.ok) {
      return json(res, 403, {
        ok: false,
        error: eligibility.reason,
        balance,
        balances,
        tokenSymbol,
        required: eligibility.required ?? perk?.tokenRequirement?.min ?? perk?.minEcho ?? null,
        token: eligibility.token,
      });
    }

    const runInput = normalizeRunInput(body);
    if (!runInput.ok) return json(res, 400, { ok: false, error: runInput.error });

    const existing = await findClaim(wallet, perkId);
    if (!existing) return json(res, 404, { ok: false, error: 'claim_not_found' });
    if (!isUnusedCredit(existing)) return json(res, 409, { ok: false, error: 'credit_already_used', claim: existing });

    const now = new Date().toISOString();
    const runRequest = {
      id: `miroshark_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'queued_for_echo_wallet',
      endpoint: MIROSHARK_ENDPOINT,
      affiliate: MIROSHARK_AFFILIATE,
      payer: 'echo_wallet',
      refundPath: 'affiliate_refund',
      input: runInput.value,
      createdAt: now,
    };
    const result = await updateClaim({
      ...existing,
      status: 'miroshark run queued',
      mirosharkRun: runRequest,
      usedAt: now,
    });
    await notifyRunQueued({ claim: result.claim, runRequest, tokenSymbol, balance });

    return json(res, 202, {
      ok: true,
      claim: result.claim,
      runRequest,
      persistence: result.persistence,
    });
  } catch (error) {
    return json(res, errorStatus(error), {
      ok: false,
      error: error?.message || 'miroshark_run_failed',
    });
  }
}

function isMirosharkPerk(perk) {
  return String(perk?.partnerId || '').toLowerCase() === 'miroshark';
}

function isUnusedCredit(claim) {
  return ['tool credit available', 'miroshark credit available'].includes(String(claim?.status || '').toLowerCase());
}

function normalizeRunInput(body) {
  const prompt = cleanText(body.prompt, 4000);
  const url = cleanText(body.url, 2048);
  const article = cleanText(body.article, 200000);
  const predictionMarket = cleanText(body.predictionMarket, 300);
  const deepResearch = Boolean(body.deepResearch);
  const supplied = [prompt, url, article].filter(Boolean);
  if (supplied.length !== 1) return { ok: false, error: 'provide_exactly_one_of_prompt_url_article' };
  if (prompt && prompt.length < 4) return { ok: false, error: 'prompt_too_short' };
  if (url && !/^https?:\/\/\S+$/i.test(url)) return { ok: false, error: 'invalid_url' };
  if (article && article.length < 4) return { ok: false, error: 'article_too_short' };

  return {
    ok: true,
    value: {
      ...(prompt ? { prompt } : {}),
      ...(url ? { url } : {}),
      ...(article ? { article } : {}),
      ...(deepResearch ? { deep_research: true } : {}),
      ...(predictionMarket ? { prediction_market: predictionMarket } : {}),
    },
  };
}

async function notifyRunQueued({ claim, runRequest, tokenSymbol, balance }) {
  if (!DISCORD_WEBHOOK_URL) return { ok: false, reason: 'webhook_not_configured' };
  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: [
        `MiroShark credit queued: **${claim.title}**`,
        `Wallet: \`${claim.wallet}\``,
        `Holder balance: ${balance} ${tokenSymbol || 'token'}`,
        `Run request: \`${runRequest.id}\``,
        `Payer: Echo wallet`,
        `Refund path: affiliate \`${runRequest.affiliate}\``,
        runRequest.input.prompt ? `Prompt: ${runRequest.input.prompt}` : '',
        runRequest.input.url ? `URL: ${runRequest.input.url}` : '',
        runRequest.input.article ? `Article chars: ${runRequest.input.article.length}` : '',
        runRequest.input.deep_research ? 'Deep research: true' : '',
        runRequest.input.prediction_market ? `Prediction market: ${runRequest.input.prediction_market}` : '',
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

function errorStatus(error) {
  return error?.message === 'invalid_wallet' ? 400 : 500;
}
