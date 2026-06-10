import {
  createClaim,
  findPerk,
  json,
  listPerks,
  parseBody,
  readRequiredTokenBalance,
  validateClaimEligibility,
} from './_perks.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST required' });

  try {
    const body = parseBody(req);
    const wallet = body.wallet;
    const perkId = String(body.perkId || '');
    const { perks } = await listPerks();
    const perk = findPerk(perks, perkId);
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
    return json(res, 500, {
      ok: false,
      error: error?.message || 'claim_failed',
    });
  }
}
