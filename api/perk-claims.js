import {
  createClaim,
  findPerk,
  json,
  listClaimsForWallet,
  listPerks,
  parseBody,
  readRequiredTokenBalance,
  validateClaimEligibility,
} from './_perks.js';

export default async function handler(req, res) {
  if (req.method === 'GET') return getClaims(req, res);
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'GET or POST required' });

  try {
    const body = parseBody(req);
    const wallet = body.wallet;
    const perkId = String(body.perkId || '');
    if (!wallet) return json(res, 400, { ok: false, error: 'invalid_wallet' });
    if (!perkId) return json(res, 400, { ok: false, error: 'missing_perk_id' });

    const { perks } = await listPerks();
    const perk = findPerk(perks, perkId);
    if (!perk) return json(res, 404, { ok: false, error: 'perk_not_found' });

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

    const result = await createClaim({
      wallet,
      perk,
      balance,
      tokenSymbol,
      discordHandle: body.discordHandle,
      discordUserId: body.discordUserId,
      contactHandle: body.contactHandle,
      contactEmail: body.contactEmail,
      projectUrl: body.projectUrl,
      requestNote: body.requestNote,
    });

    return json(res, result.created ? 201 : 200, {
      ok: true,
      ...result,
    });
  } catch (error) {
    return json(res, errorStatus(error), {
      ok: false,
      error: error?.message || 'claim_failed',
    });
  }
}

async function getClaims(req, res) {
  try {
    const url = new URL(req.url || '/', 'https://builtbyecho.local');
    const claims = await listClaimsForWallet(url.searchParams.get('wallet'));
    return json(res, 200, {
      ok: true,
      claims,
      persistence: claims.length ? 'redis' : 'empty',
    });
  } catch (error) {
    return json(res, errorStatus(error), {
      ok: false,
      error: error?.message || 'claims_lookup_failed',
    });
  }
}

function errorStatus(error) {
  return error?.message === 'invalid_wallet' ? 400 : 500;
}
