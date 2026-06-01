export const BASE_CHAIN_ID = 8453;
export const BASE_RPC_URL = process.env.BASE_RPC_URL || process.env.ECHO_GATE_BASE_RPC_URL || 'https://mainnet.base.org';
export const ECHO_TOKEN_ADDRESS = normalizeAddress(process.env.ECHO_TOKEN_ADDRESS || '0xA7F63eB41779925803a3EEC30890742571e63Ba3');
export const USDC_TOKEN_ADDRESS = normalizeAddress(process.env.USDC_BASE_TOKEN_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
export const PAYMENT_RECEIVER = normalizeAddress(process.env.BUILTBYECHO_PAYMENT_RECEIVER || '0x3dff7a5e979fce5de2e58f4317d02460911c95b4');
export const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const PAYMENT_REPLAY_TTL_SECONDS = Number(process.env.PAYMENT_REPLAY_TTL_SECONDS || 60 * 60 * 24 * 365);
const PAYMENT_REPLAY_PREFIX = process.env.PAYMENT_REPLAY_PREFIX || 'builtbyecho:payments';

export const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
};

export function normalizeAddress(value) {
  const text = String(value || '').trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(text)) throw new Error(`invalid address: ${text}`);
  return `0x${text.slice(2).toLowerCase()}`;
}

export function isTxHash(value) {
  return /^0x[a-fA-F0-9]{64}$/.test(String(value || ''));
}

export function parseBody(req) {
  return typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
}

export async function verifyErc20Payment({ txHash, tokenAddress, receiver, minimumAmountRaw, payer }) {
  if (!isTxHash(txHash)) return { ok: false, reason: 'invalid_tx_hash' };

  const receipt = await rpc('eth_getTransactionReceipt', [txHash]);
  if (!receipt) return { ok: false, reason: 'tx_not_found' };
  if (receipt.status !== '0x1') return { ok: false, reason: 'tx_failed' };

  const expectedToken = normalizeAddress(tokenAddress);
  const expectedReceiver = normalizeAddress(receiver);
  const expectedPayer = payer ? normalizeAddress(payer) : '';
  const minimum = BigInt(minimumAmountRaw);

  let sawToken = false;
  let sawReceiver = false;
  for (const log of receipt.logs || []) {
    if (normalizeAddress(log.address) !== expectedToken) continue;
    sawToken = true;
    const transfer = parseTransferLog(log);
    if (!transfer) continue;
    if (transfer.to !== expectedReceiver) continue;
    sawReceiver = true;
    if (expectedPayer && transfer.from !== expectedPayer) continue;
    const amount = BigInt(transfer.value);
    if (amount >= minimum) {
      return {
        ok: true,
        txHash,
        payer: transfer.from,
        receiver: expectedReceiver,
        tokenAddress: expectedToken,
        amountRaw: amount.toString(),
        blockNumber: receipt.blockNumber,
      };
    }
  }

  if (!sawToken) return { ok: false, reason: 'wrong_token' };
  if (!sawReceiver) return { ok: false, reason: 'wrong_receiver' };
  return { ok: false, reason: 'amount_too_low' };
}

export async function reservePaymentTx({ txHash, tokenAddress, product, amountRaw, payer, receiver, blockNumber }) {
  if (!isTxHash(txHash)) return { ok: false, reason: 'invalid_tx_hash' };
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { ok: false, reason: 'replay_protection_not_configured' };
  }

  const normalizedToken = normalizeAddress(tokenAddress);
  const normalizedTx = txHash.toLowerCase();
  const key = `${PAYMENT_REPLAY_PREFIX}:${BASE_CHAIN_ID}:${normalizedToken}:${normalizedTx}`;
  const value = JSON.stringify({
    product: String(product || 'unknown'),
    txHash: normalizedTx,
    tokenAddress: normalizedToken,
    amountRaw: String(amountRaw || ''),
    payer: payer ? normalizeAddress(payer) : '',
    receiver: receiver ? normalizeAddress(receiver) : '',
    blockNumber: String(blockNumber || ''),
    reservedAt: new Date().toISOString(),
  });

  const result = await redisCommand(['SET', key, value, 'NX', 'EX', String(PAYMENT_REPLAY_TTL_SECONDS)]);
  if (result !== 'OK') return { ok: false, reason: 'payment_tx_already_used' };
  return { ok: true, key };
}

function parseTransferLog(log) {
  if (log.topics?.[0]?.toLowerCase() !== TRANSFER_TOPIC || log.topics.length < 3) return null;
  return {
    from: topicToAddress(log.topics[1]),
    to: topicToAddress(log.topics[2]),
    value: BigInt(log.data).toString(),
  };
}

function topicToAddress(topic) {
  return normalizeAddress(`0x${String(topic).replace(/^0x/, '').slice(-40)}`);
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

async function redisCommand(command) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`redis_http_${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.error);
  return body.result;
}
