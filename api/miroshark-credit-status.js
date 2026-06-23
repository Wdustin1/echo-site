import {
  findClaim,
  findPerk,
  json,
  listPerks,
  parseBody,
  updateClaim,
} from './_perks.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { ok: false, error: 'GET or POST required' });

  try {
    const input = requestInput(req);
    const wallet = input.wallet;
    const perkId = String(input.perkId || '');
    const { perks } = await listPerks();
    const perk = findPerk(perks, perkId);
    if (!isMirosharkPerk(perk)) return json(res, 404, { ok: false, error: 'miroshark_perk_not_found' });

    const claim = await findClaim(wallet, perkId);
    if (!claim) return json(res, 404, { ok: false, error: 'claim_not_found' });

    const statusUrl = mirosharkStatusUrl(claim);
    if (!statusUrl) return json(res, 200, { ok: true, claim, refreshed: false, reason: 'status_url_not_available' });

    const status = await fetchMirosharkStatus(statusUrl);
    const updatedClaim = mergeMirosharkStatus(claim, status);
    const result = await updateClaim(updatedClaim);

    return json(res, 200, {
      ok: true,
      claim: result.claim,
      status,
      refreshed: true,
      persistence: result.persistence,
    });
  } catch (error) {
    return json(res, errorStatus(error), {
      ok: false,
      error: error?.message || 'miroshark_status_failed',
    });
  }
}

function requestInput(req) {
  if (req.method === 'GET') {
    const url = new URL(req.url || '/', 'https://builtbyecho.local');
    return {
      wallet: url.searchParams.get('wallet'),
      perkId: url.searchParams.get('perkId'),
    };
  }
  return parseBody(req);
}

function isMirosharkPerk(perk) {
  return String(perk?.partnerId || '').toLowerCase() === 'miroshark';
}

function mirosharkStatusUrl(claim) {
  const run = claim?.mirosharkRun || {};
  const data = run?.result?.data || run?.statusData?.data || {};
  const direct = run.statusUrl || run.status_url || data.status_url;
  if (direct && isMirosharkUrl(direct)) return direct;
  const runId = run.runId || run.run_id || data.run_id;
  if (runId && /^[a-zA-Z0-9_-]+$/.test(String(runId))) return `https://x402.miroshark.xyz/status/${runId}`;
  return '';
}

function isMirosharkUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'x402.miroshark.xyz';
  } catch {
    return false;
  }
}

async function fetchMirosharkStatus(statusUrl) {
  const response = await fetch(statusUrl, { headers: { accept: 'application/json' } });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!response.ok) throw new Error(`miroshark_status_http_${response.status}`);
  return body;
}

function mergeMirosharkStatus(claim, status) {
  const now = new Date().toISOString();
  const data = status?.data || {};
  const run = claim.mirosharkRun || {};
  const terminalStatus = String(data.status || '').toLowerCase();
  const complete = terminalStatus === 'completed' || Boolean(data.completed_at);
  const failed = terminalStatus === 'failed' || Boolean(data.error);
  const nextRunStatus = failed ? 'failed' : complete ? 'completed' : terminalStatus || run.status || 'running';
  const nextClaimStatus = failed
    ? 'miroshark run failed'
    : complete
      ? 'miroshark run completed'
      : 'miroshark run running';

  return {
    ...claim,
    status: nextClaimStatus,
    mirosharkRun: {
      ...run,
      status: nextRunStatus,
      runId: data.run_id || run.runId || run.run_id || run?.result?.data?.run_id || null,
      statusUrl: data.status_url || run.statusUrl || run.status_url || run?.result?.data?.status_url || null,
      waitUrl: data.wait_url || run.waitUrl || run.wait_url || run?.result?.data?.wait_url || null,
      shareUrl: data.share_url || run.shareUrl || run.share_url || null,
      reportUrl: data.report_url || data.result_url || run.reportUrl || run.report_url || null,
      progress: Number(data.progress ?? run.progress ?? 0),
      currentStage: data.current_stage || run.currentStage || null,
      message: data.message || run.message || null,
      budget: data.budget || run.budget || null,
      statusData: status,
      completedAt: data.completed_at || run.completedAt || null,
      failedAt: failed ? now : run.failedAt || null,
      error: data.error || run.error || null,
      lastCheckedAt: now,
    },
    updatedAt: now,
  };
}

function errorStatus(error) {
  return error?.message === 'invalid_wallet' ? 400 : 500;
}
