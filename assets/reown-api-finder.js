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
let busy = false;
let pendingSearch;

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
  const quote = data.echo;
  const amount = BigInt(quote.amountRaw);
  const scale = 10n ** 18n;
  const fraction = (amount % scale).toString().padStart(18, '0').replace(/0+$/, '');
  $('#quote-amount').textContent = `${(amount / scale).toLocaleString('en-US')}${fraction ? `.${fraction}` : ''} ECHO`;
  for (const [id, value] of [['#quote-token', quote.tokenAddress], ['#quote-receiver', quote.receiver]]) {
    $(id).textContent = shortAddress(value);
    $(id).title = value;
  }
  return quote;
}

async function initReown() {
  await initBuiltByEchoWallet();
  subscribeWallet((state) => {
    connectedAddress = state.address;
    if (connectedAddress) {
      setWalletStatus(`Connected ${shortAddress(connectedAddress)} on Reown.`);
      const connectButton = $('#connect-wallet');
      if (connectButton) connectButton.textContent = 'Wallet connected';
    } else {
      setWalletStatus('Connect your wallet to pay and search.');
      const connectButton = $('#connect-wallet');
      if (connectButton) connectButton.textContent = 'Connect wallet';
    }
  });

  if (getWalletState().connected) setWalletStatus(`Connected ${shortAddress(getWalletState().address)} on Reown.`);
  else setWalletStatus('Wallet connect ready. Connect, then pay + search.');
}

async function payWithWallet(query) {
  setWalletStatus('Preparing wallet payment...');
  setPaidOutput('Preparing Reown wallet payment...');

  const quote = await getQuote();
  const payment = await payErc20({
    tokenAddress: quote.tokenAddress,
    receiver: quote.receiver,
    amountRaw: quote.amountRaw,
    status: (message) => {
      setWalletStatus(message);
      setPaidOutput(message);
    },
  });
  pendingSearch = { query, txHash: payment.txHash };
  setPaidOutput(`Payment confirmed: ${payment.txHash}\nSubmitting to Echo Gate...`, 'success');
}

async function submitPaidSearch({ txHash, query }) {
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
  if (busy) return;
  const query = pendingSearch?.query || $('#paid-query')?.value.trim();
  if (!query) {
    setPaidOutput('Describe the API you need before paying.', 'error');
    $('#paid-query')?.focus();
    return;
  }
  busy = true;
  $('#wallet-pay-search').disabled = true;
  $('#paid-query').disabled = true;
  $('#load-echo-quote').disabled = true;
  try {
    if (!pendingSearch) await payWithWallet(query);
    await submitPaidSearch(pendingSearch);
    pendingSearch = undefined;
    setWalletStatus('Payment verified and API Finder results returned.');
  } catch (error) {
    const message = readableWalletError(error);
    setWalletStatus(message);
    setPaidOutput(pendingSearch
      ? `Payment confirmed: ${pendingSearch.txHash}\nSearch could not finish: ${message}\nRetry search uses this payment without sending another transfer. Keep this page open and save the transaction hash.`
      : `Wallet payment failed: ${message}`, 'error');
  } finally {
    busy = false;
    $('#wallet-pay-search').disabled = false;
    $('#wallet-pay-search').textContent = pendingSearch ? 'Retry search' : 'Pay + search';
    $('#paid-query').disabled = Boolean(pendingSearch);
    $('#load-echo-quote').disabled = false;
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
