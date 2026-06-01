import {
  ECHO_TOKEN_ADDRESS,
  PAYMENT_RECEIVER,
  USDC_TOKEN_ADDRESS,
  json,
  normalizeAddress,
  parseBody,
  reservePaymentTx,
  verifyErc20Payment,
} from './_payments.js';

const GAUNTLET_URL = process.env.ECHO_GAUNTLET_HOSTED_URL || 'https://echo-gauntlet.46.202.177.190.sslip.io';
const USDC_AMOUNT_RAW = process.env.GAUNTLET_USDC_AMOUNT_RAW || '2500000';
const ECHO_AMOUNT_RAW = process.env.GAUNTLET_ECHO_AMOUNT_RAW || '7375000000000000000000';
const DEFAULT_GOAL = 'find launch blockers before release';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'POST required' });

  try {
    const body = parseBody(req);
    const url = String(body.url || '').trim();
    const txHash = String(body.txHash || '').trim();
    const paymentToken = String(body.paymentToken || 'usdc').toLowerCase();
    const walletAddress = body.walletAddress ? normalizeAddress(body.walletAddress) : '';
    if (!url) return json(res, 400, { error: 'url is required' });

    const tokenAddress = paymentToken === 'echo' ? ECHO_TOKEN_ADDRESS : USDC_TOKEN_ADDRESS;
    const minimumAmountRaw = paymentToken === 'echo' ? ECHO_AMOUNT_RAW : USDC_AMOUNT_RAW;
    const payment = await verifyErc20Payment({
      txHash,
      tokenAddress,
      receiver: PAYMENT_RECEIVER,
      minimumAmountRaw,
      payer: walletAddress,
    });
    if (!payment.ok) return json(res, 402, { error: 'payment verification failed', reason: payment.reason });

    const reservation = await reservePaymentTx({
      txHash: payment.txHash,
      tokenAddress: payment.tokenAddress,
      product: 'echo-gauntlet',
      amountRaw: payment.amountRaw,
      payer: payment.payer,
      receiver: payment.receiver,
      blockNumber: payment.blockNumber,
    });
    if (!reservation.ok) {
      const status = reservation.reason === 'payment_tx_already_used' ? 409 : 500;
      return json(res, status, { error: 'payment replay protection failed', reason: reservation.reason });
    }

    const apiKey = process.env.ECHO_GAUNTLET_API_KEY;
    if (!apiKey) return json(res, 500, { error: 'gauntlet is not configured' });

    const upstream = await fetch(`${GAUNTLET_URL.replace(/\/+$/, '')}/runs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        goal: DEFAULT_GOAL,
        personas: Array.isArray(body.personas) ? body.personas : undefined,
        timeoutMs: Number(body.timeoutMs || 20000),
        saveHtml: body.saveHtml !== false,
        screenshots: body.screenshots !== false,
        llm: body.llm === true,
      }),
    });

    const run = await upstream.json().catch(() => ({ error: 'invalid_gauntlet_response' }));
    if (!upstream.ok) return json(res, upstream.status, run);

    return json(res, 200, {
      ok: true,
      payment,
      run,
      shareUrl: run.artifacts?.share ? `${GAUNTLET_URL}${run.artifacts.share}?token=${encodeURIComponent(run.accessToken)}` : run.shareUrl,
      statusUrl: `${GAUNTLET_URL}/runs/${run.id}?token=${encodeURIComponent(run.accessToken)}`,
    });
  } catch (error) {
    return json(res, 502, { error: error?.message || 'gauntlet_paid_failed' });
  }
}
