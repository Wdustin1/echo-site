import { x402Client } from '@x402/core/client';
import { x402HTTPClient } from '@x402/core/http';
import { ExactEvmScheme, toClientEvmSigner } from '@x402/evm';
import { privateKeyToAccount } from 'viem/accounts';
import { json, listClaims, updateClaim } from './_perks.js';

const MIROSHARK_ENDPOINT = 'https://x402.miroshark.xyz/run';
const MIROSHARK_AFFILIATE = '0xDEADBEEFCAFEBABEFEEDFACEBAADF00DDEADC0DE';
const MAX_AMOUNT_ATOMIC = BigInt(process.env.MIROSHARK_X402_MAX_AMOUNT_ATOMIC || '1000000');
const WORKER_PRIVATE_KEY = String(process.env.MIROSHARK_WORKER_PRIVATE_KEY || '').trim();
const CRON_SECRET = process.env.CRON_SECRET || process.env.MIROSHARK_WORKER_SECRET || '';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return json(res, 405, { ok: false, error: 'GET or POST required' });
  if (!authorized(req)) return json(res, 401, { ok: false, error: 'unauthorized' });
  if (!/^0x[0-9a-fA-F]{64}$/.test(WORKER_PRIVATE_KEY)) {
    return json(res, 503, { ok: false, error: 'worker_wallet_not_configured' });
  }

  try {
    const queued = (await listClaims(500)).filter(isQueuedMirosharkClaim);
    const limit = Math.max(1, Math.min(Number(req.query?.limit || 3), 10));
    const selected = queued.slice(0, limit);
    const results = [];
    for (const claim of selected) {
      results.push(await processClaim(claim));
    }

    return json(res, 200, {
      ok: true,
      queued: queued.length,
      processed: results.length,
      results,
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error?.message || 'miroshark_worker_failed',
    });
  }
}

function authorized(req) {
  if (!CRON_SECRET) return !process.env.VERCEL;
  const header = String(req.headers.authorization || '');
  return header === `Bearer ${CRON_SECRET}`;
}

async function processClaim(claim) {
  const account = privateKeyToAccount(WORKER_PRIVATE_KEY);
  const client = new x402Client().register('eip155:*', new ExactEvmScheme(toClientEvmSigner(account)));
  const httpClient = new x402HTTPClient(client);
  const run = claim.mirosharkRun || {};
  const requestBody = {
    ...(run.input || {}),
    affiliate: MIROSHARK_AFFILIATE,
  };
  const startedAt = new Date().toISOString();

  await updateClaim({
    ...claim,
    status: 'miroshark run paying',
    mirosharkRun: {
      ...run,
      status: 'paying',
      payer: 'miroshark_credit_worker',
      workerWallet: account.address,
      startedAt,
    },
  });

  try {
    const result = await paidMirosharkFetch({ client, httpClient, requestBody });
    const finishedAt = new Date().toISOString();
    const nextClaim = {
      ...claim,
      status: 'miroshark run submitted',
      mirosharkRun: {
        ...run,
        status: 'submitted',
        payer: 'miroshark_credit_worker',
        workerWallet: account.address,
        affiliate: MIROSHARK_AFFILIATE,
        endpoint: MIROSHARK_ENDPOINT,
        requestBody,
        httpStatus: result.status,
        paymentResponse: result.headers['payment-response'] || null,
        result: result.body,
        startedAt,
        finishedAt,
      },
      updatedAt: finishedAt,
    };
    await updateClaim(nextClaim);
    return { claimId: claim.id, ok: true, status: result.status };
  } catch (error) {
    const failedAt = new Date().toISOString();
    await updateClaim({
      ...claim,
      status: 'miroshark run failed',
      mirosharkRun: {
        ...run,
        status: 'failed',
        payer: 'miroshark_credit_worker',
        workerWallet: account.address,
        affiliate: MIROSHARK_AFFILIATE,
        endpoint: MIROSHARK_ENDPOINT,
        requestBody,
        error: error?.message || 'unknown_error',
        startedAt,
        failedAt,
      },
      updatedAt: failedAt,
    });
    return { claimId: claim.id, ok: false, error: error?.message || 'unknown_error' };
  }
}

async function paidMirosharkFetch({ client, httpClient, requestBody }) {
  const init = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  };
  const initial = await fetch(MIROSHARK_ENDPOINT, init);
  if (initial.status !== 402) {
    return {
      status: initial.status,
      headers: headersObject(initial.headers),
      body: await parseResponseBody(initial),
    };
  }

  const initialBody = await parseResponseBody(initial);
  const paymentRequired = httpClient.getPaymentRequiredResponse((name) => initial.headers.get(name), initialBody);
  assertAllowedPayment(paymentRequired);
  const paymentPayload = await client.createPaymentPayload(paymentRequired);
  const paid = await fetch(MIROSHARK_ENDPOINT, {
    ...init,
    headers: {
      ...init.headers,
      ...httpClient.encodePaymentSignatureHeader(paymentPayload),
    },
  });
  return {
    status: paid.status,
    headers: headersObject(paid.headers),
    body: await parseResponseBody(paid),
  };
}

function assertAllowedPayment(paymentRequired) {
  const accepts = Array.isArray(paymentRequired?.accepts) ? paymentRequired.accepts : [];
  const evmAccepts = accepts.filter((item) => String(item.network || '').startsWith('eip155:'));
  if (!evmAccepts.length) throw new Error('no_evm_payment_option');
  const overLimit = evmAccepts.find((item) => BigInt(item.amount || 0) > MAX_AMOUNT_ATOMIC);
  if (overLimit) throw new Error(`payment_amount_over_limit:${overLimit.amount}`);
  const wrongEndpoint = paymentRequired?.resource?.url && paymentRequired.resource.url !== MIROSHARK_ENDPOINT;
  if (wrongEndpoint) throw new Error(`unexpected_payment_resource:${paymentRequired.resource.url}`);
}

function isQueuedMirosharkClaim(claim) {
  return (
    claim &&
    String(claim.perkId || '').startsWith('miroshark-') &&
    String(claim.status || '').toLowerCase() === 'miroshark run queued' &&
    String(claim.mirosharkRun?.status || '').toLowerCase() === 'queued_for_echo_wallet'
  );
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function headersObject(headers) {
  return Object.fromEntries([...headers.entries()]);
}
