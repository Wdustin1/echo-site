import {
  getWalletState,
  initBuiltByEchoWallet,
  payErc20,
  readableWalletError,
  shortAddress,
  subscribeWallet,
} from './bbe-wallet.js';

const form = document.querySelector('#gauntlet-form');
const statusBox = document.querySelector('#gauntlet-status');
const output = document.querySelector('#gauntlet-output');
const connectButton = document.querySelector('#connect-wallet');
const payButton = document.querySelector('#wallet-pay-gauntlet');
const tokenButtons = [...document.querySelectorAll('[data-payment-token]')];

let quote;
let selectedToken = 'usdc';
let pollTimer = 0;

const personaDefaults = ['first_time_visitor', 'impatient_buyer', 'mobile_user', 'accessibility_scan', 'confused_input'];

function setStatus(message, type = '') {
  if (!statusBox) return;
  statusBox.className = `wallet-status ${type}`.trim();
  statusBox.textContent = message;
}

function setOutput(message, type = '') {
  if (!output) return;
  output.className = `gauntlet-output ${type}`.trim();
  output.textContent = message;
}

function setOutputHtml(html, type = '') {
  if (!output) return;
  output.className = `gauntlet-output ${type}`.trim();
  output.innerHTML = html;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

function formatTokenAmount(raw, decimals, symbol) {
  try {
    const value = BigInt(raw);
    const base = 10n ** BigInt(decimals);
    const whole = value / base;
    const fraction = value % base;
    const fractionText = fraction ? `.${fraction.toString().padStart(decimals, '0').replace(/0+$/, '').slice(0, 4)}` : '';
    return `${whole.toLocaleString('en-US')}${fractionText} ${symbol}`;
  } catch {
    return symbol;
  }
}

async function loadQuote() {
  const response = await fetch('/api/gauntlet-quote');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'quote unavailable');
  quote = data;
  renderQuote();
  return quote;
}

function currentQuote() {
  if (!quote) throw new Error('Payment quote is still loading');
  return selectedToken === 'echo' ? quote.echo : quote.usdc;
}

function renderQuote() {
  if (!quote) return;
  const active = currentQuote();
  document.querySelector('#quote-network').textContent = 'Base';
  document.querySelector('#quote-amount').textContent = active.display || formatTokenAmount(active.amountRaw, active.decimals, active.tokenSymbol);
  document.querySelector('#quote-token').textContent = shortAddress(active.tokenAddress);
  document.querySelector('#quote-token').title = active.tokenAddress;
  document.querySelector('#quote-receiver').textContent = shortAddress(active.receiver);
  document.querySelector('#quote-receiver').title = active.receiver;
}

function setSelectedToken(value) {
  selectedToken = value === 'echo' ? 'echo' : 'usdc';
  tokenButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.paymentToken === selectedToken);
  });
  renderQuote();
}

function selectedPersonas() {
  const checked = [...document.querySelectorAll('input[name="persona"]:checked')].map((input) => input.value);
  return checked.length ? checked : personaDefaults;
}

async function startPaidRun(event) {
  event?.preventDefault();
  window.clearTimeout(pollTimer);
  try {
    const targetUrl = String(document.querySelector('#target-url')?.value || '').trim();
    if (!targetUrl) throw new Error('Paste a target URL first');

    const activeQuote = currentQuote();
    payButton.disabled = true;
    setStatus('Preparing wallet payment...');
    setOutput('Confirm the payment in your wallet. Gauntlet will start after the transaction is verified.');

    const payment = await payErc20({
      tokenAddress: activeQuote.tokenAddress,
      receiver: activeQuote.receiver,
      amountRaw: activeQuote.amountRaw,
      status: (message) => setStatus(message),
    });

    setOutput(`Payment confirmed: ${payment.txHash}\nStarting Gauntlet...`, 'success');
    const response = await fetch('/api/gauntlet-paid', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl,
        txHash: payment.txHash,
        walletAddress: getWalletState().address,
        paymentToken: selectedToken,
        personas: selectedPersonas(),
        timeoutMs: Number(document.querySelector('#timeout-ms')?.value || 20000),
        saveHtml: true,
        screenshots: true,
        llm: document.querySelector('#llm')?.value === '1',
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.reason || 'Gauntlet could not start');
    renderRun(data);
    if (data.statusUrl) pollRun(data.statusUrl);
  } catch (error) {
    const message = readableWalletError(error);
    setStatus(message, 'error');
    setOutput(`Gauntlet payment failed: ${message}`, 'error');
  } finally {
    payButton.disabled = false;
  }
}

function renderRun(data) {
  const run = data.run || data;
  const shareUrl = data.shareUrl || run.shareUrl || '';
  const statusUrl = data.statusUrl || '';
  setOutputHtml(`
    <div class="run-result">
      <div>
        <b>${escapeHtml(run.status || 'queued')}</b>
        <span>${escapeHtml(run.id || 'run queued')}</span>
      </div>
      <div class="run-links">
        ${shareUrl ? `<a href="${escapeHtml(shareUrl)}" target="_blank" rel="noopener">Open share page</a>` : ''}
        ${statusUrl ? `<a href="${escapeHtml(statusUrl)}" target="_blank" rel="noopener">Open status JSON</a>` : ''}
      </div>
    </div>
  `, 'success');
}

async function pollRun(statusUrl) {
  const response = await fetch(statusUrl);
  const record = await response.json();
  if (!response.ok) return;
  const shareUrl = record.artifacts?.share ? new URL(record.artifacts.share, 'https://echo-gauntlet.46.202.177.190.sslip.io').toString() : '';
  setOutputHtml(`
    <div class="run-result">
      <div>
        <b>${escapeHtml(record.summary?.verdict || record.status)}</b>
        <span>${escapeHtml(record.request?.url || 'Gauntlet run')}</span>
      </div>
      <p>${record.status === 'completed' ? 'Run complete. Share page and report links are ready.' : `Run is ${escapeHtml(record.status)}.`}</p>
      <div class="run-links">
        ${shareUrl ? `<a href="${escapeHtml(`${shareUrl}?token=${new URL(statusUrl).searchParams.get('token') || ''}`)}" target="_blank" rel="noopener">Open share page</a>` : ''}
        <a href="${escapeHtml(statusUrl)}" target="_blank" rel="noopener">Open status JSON</a>
      </div>
    </div>
  `, record.status === 'failed' ? 'error' : 'success');
  if (record.status === 'queued' || record.status === 'running') {
    pollTimer = window.setTimeout(() => pollRun(statusUrl), 2000);
  }
}

tokenButtons.forEach((button) => {
  button.addEventListener('click', () => setSelectedToken(button.dataset.paymentToken));
});

form?.addEventListener('submit', startPaidRun);
payButton?.addEventListener('click', startPaidRun);

initBuiltByEchoWallet()
  .then(() => {
    subscribeWallet((state) => {
      if (state.connected) {
        setStatus(`Connected ${shortAddress(state.address)} on Base. Choose a payment token and run Gauntlet.`);
        if (connectButton) connectButton.textContent = 'Wallet connected';
      } else {
        setStatus('Connect once, then approve a transaction for each tool run.');
      }
    });
  })
  .catch((error) => setStatus(`Wallet connect unavailable: ${error?.message || 'Reown failed to load'}`, 'error'));

loadQuote().catch((error) => setOutput(`Quote load failed: ${error.message}`, 'error'));
