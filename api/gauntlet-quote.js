import { ECHO_TOKEN_ADDRESS, PAYMENT_RECEIVER, USDC_TOKEN_ADDRESS, json } from './_payments.js';

const USDC_AMOUNT_RAW = process.env.GAUNTLET_USDC_AMOUNT_RAW || '2500000';
const ECHO_AMOUNT_RAW = process.env.GAUNTLET_ECHO_AMOUNT_RAW || '7375000000000000000000';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'GET required' });

  return json(res, 200, {
    tool: {
      slug: 'echo-gauntlet',
      name: 'Echo Gauntlet',
      description: 'Run a browser-persona teardown against a public web app.',
    },
    usdc: {
      method: 'usdc',
      network: 'eip155:8453',
      chainId: 8453,
      tokenAddress: USDC_TOKEN_ADDRESS,
      tokenSymbol: 'USDC',
      decimals: 6,
      receiver: PAYMENT_RECEIVER,
      amountRaw: USDC_AMOUNT_RAW,
      display: '$2.50 USDC',
    },
    echo: {
      method: 'echo',
      network: 'eip155:8453',
      chainId: 8453,
      tokenAddress: ECHO_TOKEN_ADDRESS,
      tokenSymbol: 'ECHO',
      decimals: 18,
      receiver: PAYMENT_RECEIVER,
      amountRaw: ECHO_AMOUNT_RAW,
      display: '7,375 ECHO',
    },
  });
}
