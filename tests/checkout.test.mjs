import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import gauntletHandler from '../api/gauntlet-paid.js';

const tick = () => new Promise((resolve) => setImmediate(resolve));
const txHash = `0x${'1'.repeat(64)}`;
const payer = `0x${'2'.repeat(40)}`;
const quote = { amountRaw: '2500000', decimals: 6, tokenSymbol: 'USDC', tokenAddress: payer, receiver: payer };
const response = (body, ok = true) => ({ ok, status: ok ? 200 : 502, json: async () => body });

function harness(file, { pay, fetch } = {}) {
  const elements = new Map();
  const payments = [];
  const requests = [];
  const timers = [];
  const element = (selector) => {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', disabled: false, textContent: '', innerHTML: '', dataset: {},
      classList: { toggle() {} }, listeners: {},
      focus() { this.focused = true; },
      reportValidity() { return true; },
      addEventListener(event, handler) { this.listeners[event] = handler; },
      querySelectorAll() { return [...elements.values()].filter((item) => item !== this); },
    });
    return elements.get(selector);
  };
  const tokenButtons = ['usdc', 'echo'].map((token) => {
    const button = element(`[data-payment-token="${token}"]`);
    button.dataset.paymentToken = token;
    return button;
  });
  const context = vm.createContext({
    document: {
      querySelector: element,
      querySelectorAll: (selector) => selector === '[data-payment-token]' ? tokenButtons : [],
    },
    window: { clearTimeout() {}, setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; } },
    URL,
    fetch: async (url, options) => {
      requests.push({ url, body: options?.body && JSON.parse(options.body) });
      if (fetch) return fetch(url, options);
      return response({ echo: { ...quote, decimals: 18, tokenSymbol: 'ECHO' }, usdc: quote });
    },
    wallet: {
      initBuiltByEchoWallet: async () => {},
      subscribeWallet: () => {},
      getWalletState: () => ({ address: payer, connected: false }),
      connectWallet: async () => {},
      shortAddress: (value) => value,
      readableWalletError: (error) => error.message,
      payErc20: async (options) => {
        payments.push(options);
        return pay ? pay(options) : { txHash, from: payer };
      },
    },
  });
  const source = readFileSync(new URL(`../assets/${file}`, import.meta.url), 'utf8')
    .replace(/import\s*\{([\s\S]*?)\}\s*from '\.\/bbe-wallet\.js';/, 'const {$1} = wallet;');
  vm.runInContext(source, context, { filename: file });
  return { context, element, payments, requests, timers, tokenButtons };
}

test('empty API searches never fetch a quote or request payment', async () => {
  const h = harness('reown-api-finder.js');
  h.element('#paid-query').value = '   ';
  await h.context.onWalletPaySearch();
  assert.equal(h.payments.length, 0);
  assert.equal(h.requests.length, 0);
  assert.match(h.element('#paid-output').textContent, /before paying/);
  assert.equal(h.element('#paid-query').focused, true);
});

test('API checkout blocks duplicate clicks and preserves the query approved for payment', async () => {
  let finishPayment;
  const h = harness('reown-api-finder.js', {
    pay: () => new Promise((resolve) => { finishPayment = resolve; }),
    fetch: async (url) => url.endsWith('quote') ? response({ echo: quote }) : response({ results: [] }),
  });
  h.element('#paid-query').value = 'weather API';
  const first = h.context.onWalletPaySearch();
  await tick();
  assert.equal(h.element('#wallet-pay-search').disabled, true);
  await h.context.onWalletPaySearch();
  h.element('#paid-query').value = 'different query';
  finishPayment({ txHash, from: payer });
  await first;
  assert.equal(h.payments.length, 1);
  assert.equal(h.requests.find((req) => req.url.endsWith('paid')).body.query, 'weather API');
  assert.equal(h.element('#wallet-pay-search').disabled, false);
});

test('API retry reuses the confirmed transaction and does not charge again', async () => {
  let searches = 0;
  const h = harness('reown-api-finder.js', {
    fetch: async (url) => url.endsWith('quote') ? response({ echo: quote })
      : ++searches === 1 ? response({ error: 'upstream unavailable' }, false) : response({ results: [] }),
  });
  h.element('#paid-query').value = 'weather';
  await h.context.onWalletPaySearch();
  assert.match(h.element('#paid-output').textContent, /Payment confirmed/);
  assert.match(h.element('#paid-output').textContent, new RegExp(txHash));
  assert.equal(h.element('#wallet-pay-search').textContent, 'Retry search');
  await h.context.onWalletPaySearch();
  assert.equal(h.payments.length, 1);
  assert.equal(searches, 2);
  assert.equal(h.element('#wallet-pay-search').textContent, 'Pay + search');
});

test('Gauntlet rejects malformed and non-web URLs before any payment', async () => {
  const h = harness('gauntlet.js');
  for (const url of ['', 'not a URL', 'javascript:alert(1)', 'ftp://example.com', 'https://user:secret@example.com']) {
    h.element('#target-url').value = url;
    await h.context.startPaidRun();
  }
  assert.equal(h.payments.length, 0);
  assert.match(h.element('#gauntlet-status').textContent, /before paying/);
});

test('Gauntlet keeps token, wallet, and run settings fixed during payment', async () => {
  let finishPayment;
  const h = harness('gauntlet.js', {
    pay: () => new Promise((resolve) => { finishPayment = resolve; }),
    fetch: async (url) => url.endsWith('quote') ? response({ echo: quote, usdc: quote }) : response({ run: { id: 'run-1', status: 'queued' } }),
  });
  h.element('#target-url').value = 'https://example.com/';
  h.element('#timeout-ms').value = '15000';
  const first = h.context.startPaidRun();
  await tick();
  await h.context.startPaidRun();
  h.context.setSelectedToken('echo');
  h.element('#timeout-ms').value = '30000';
  finishPayment({ txHash, from: payer });
  await first;
  assert.equal(h.payments.length, 1);
  const request = h.requests.find((req) => req.url.endsWith('paid')).body;
  assert.equal(request.paymentToken, 'usdc');
  assert.equal(request.walletAddress, payer);
  assert.equal(request.timeoutMs, 15000);
});

test('Gauntlet retry reuses its receipt and original settings after a service failure', async () => {
  let starts = 0;
  const h = harness('gauntlet.js', {
    fetch: async (url) => url.endsWith('quote') ? response({ echo: quote, usdc: quote })
      : ++starts === 1 ? response({ error: 'unavailable' }, false) : response({ run: { id: 'run-1', status: 'queued' } }),
  });
  h.element('#target-url').value = 'https://example.com/';
  await h.context.startPaidRun();
  assert.equal(h.element('#wallet-pay-gauntlet').textContent, 'Retry run');
  await h.context.startPaidRun();
  assert.equal(h.payments.length, 1);
  assert.equal(starts, 2);
});

test('Gauntlet polling preserves report links on failure and schedules a retry', async () => {
  const h = harness('gauntlet.js', { fetch: async (url) => {
    if (url.endsWith('quote')) return response({ echo: quote, usdc: quote });
    throw new Error('network unavailable');
  } });
  h.element('#gauntlet-output').innerHTML = '<a>Existing report</a>';
  await h.context.pollRun('https://reports.example/runs/1?token=test');
  assert.equal(h.element('#gauntlet-output').innerHTML, '<a>Existing report</a>');
  assert.equal(h.timers.at(-1).delay, 5000);
  assert.match(h.element('#gauntlet-status').textContent, /payment is confirmed/);
});

test('Gauntlet report links use the returned host and preserve query parameters', async () => {
  const h = harness('gauntlet.js', { fetch: async (url) => url.endsWith('quote')
    ? response({ echo: quote, usdc: quote })
    : response({ status: 'completed', artifacts: { share: '/share/1?format=html' } }),
  });
  await h.context.pollRun('https://reports.example/runs/1?token=abc%2B123');
  assert.match(h.element('#gauntlet-output').innerHTML, /https:\/\/reports\.example\/share\/1\?format=html&amp;token=abc%2B123/);
  assert.equal(h.timers.length, 0);
});

test('Gauntlet validates requests and configuration before consuming payment receipts', async () => {
  const previousKey = process.env.ECHO_GAUNTLET_API_KEY;
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('should not call payment or storage providers'); };
  delete process.env.ECHO_GAUNTLET_API_KEY;
  try {
    for (const [body, status] of [
      [{ url: 'javascript:alert(1)' }, 400],
      [{ url: 'https://example.com', paymentToken: 'invalid' }, 400],
      [{ url: 'https://example.com', paymentToken: 'usdc', txHash }, 503],
    ]) {
      const res = { setHeader() {}, end(value) { this.body = JSON.parse(value); } };
      await gauntletHandler({ method: 'POST', body }, res);
      assert.equal(res.statusCode, status);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.ECHO_GAUNTLET_API_KEY;
    else process.env.ECHO_GAUNTLET_API_KEY = previousKey;
  }
});
