import {
  connectWallet,
  getWalletState,
  initBuiltByEchoWallet,
  payErc20,
  readableWalletError,
  shortAddress,
  subscribeWallet,
} from './bbe-wallet.js';

let connectedAddress = '';
let latestQuote;

const $ = (selector) => document.querySelector(selector);

function setWalletStatus(message) {
  const target = $('#wallet-status');
  if (target) target.textContent = message;
}

function setPaidOutput(message, type = '') {
  const output = $('#paid-output');
  if (!output) return;
  output.className = `paid-output ${type}`.trim();
  output.textContent = message;
}

async function getQuote() {
  const response = await fetch('/api/echo-api-finder-quote');
  const data = await response.json();
  if (!response.ok || !data.echo) throw new Error(data.error || 'quote unavailable');
  latestQuote = data.echo;
  return latestQuote;
}

function readQuoteFromDom() {
  return latestQuote;
}

async function ensureQuote() {
  return readQuoteFromDom() || getQuote();
}

async function initReown() {
  await initBuiltByEchoWallet();
  subscribeWallet((state) => {
    connectedAddress = state.address;
    if (connectedAddress) {
      setWalletStatus(`Connected ${shortAddress(connectedAddress)} on Reown.`);
      const connectButton = $('#connect-wallet');
      if (connectButton) connectButton.textContent = 'Wallet connected';
    }
  });

  if (getWalletState().connected) setWalletStatus(`Connected ${shortAddress(getWalletState().address)} on Reown.`);
  else setWalletStatus('Wallet connect ready. Connect, then pay + search.');
}

async function payWithWallet() {
  setWalletStatus('Preparing wallet payment...');
  setPaidOutput('Preparing Reown wallet payment...');

  const quote = await ensureQuote();
  const payment = await payErc20({
    tokenAddress: quote.tokenAddress,
    receiver: quote.receiver,
    amountRaw: quote.amountRaw,
    status: (message) => {
      setWalletStatus(message);
      setPaidOutput(message);
    },
  });
  setPaidOutput(`Payment confirmed: ${payment.txHash}\nSubmitting to Echo Gate...`, 'success');
  await submitPaidSearch(payment.txHash);
}

async function submitPaidSearch(txHash) {
  const query = $('#paid-query')?.value || '';
  const response = await fetch('/api/echo-api-finder-paid', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, txHash, noAuth: true, https: true, limit: 6 }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'paid search failed');
  renderPaidResult(data);
}

function renderPaidResult(data) {
  const result = data.result || data;
  const results = Array.isArray(result.results) ? result.results : [];
  if (!results.length) {
    setPaidOutput(JSON.stringify(data, null, 2), data.error ? 'error' : 'success');
    return;
  }
  const lines = results.slice(0, 6).map((api, index) => {
    return `${index + 1}. ${api.name}\n   ${api.description}\n   ${api.url}\n   ${api.auth === 'No' ? 'No key needed' : 'Key may be needed'} | ${api.category || 'API'}`;
  });
  setPaidOutput(lines.join('\n\n'), 'success');
}

async function onWalletPaySearch() {
  try {
    await payWithWallet();
    setWalletStatus('Payment verified and API Finder results returned.');
  } catch (error) {
    const message = readableWalletError(error);
    setWalletStatus(message);
    setPaidOutput(`Wallet payment failed: ${message}`, 'error');
  }
}

$('#connect-wallet')?.addEventListener('click', () => {
  connectWallet().catch((error) => {
    setWalletStatus(error?.message || 'Wallet connect failed');
  });
});
$('#wallet-pay-search')?.addEventListener('click', onWalletPaySearch);

initReown().catch((error) => {
  setWalletStatus(`Wallet connect unavailable: ${error?.message || 'Reown failed to load'}`);
});
