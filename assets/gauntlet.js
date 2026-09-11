import {
  initBuiltByEchoWallet,
  payErc20,
  readableWalletError,
  shortAddress,
  subscribeWallet,
} from './bbe-wallet.js';

const form = document.querySelector('#gauntlet-form');
const statusBox = document.querySelector('#gauntlet-status');
const output = document.querySelector('#gauntlet-output');
const connectButton = document.querySelector('[data-wallet-connect]');
const payButton = document.querySelector('#wallet-pay-gauntlet');
const tokenButtons = [...document.querySelectorAll('[data-payment-token]')];

let quote;
let selectedToken = 'usdc';
let pollTimer = 0;
let pollGeneration = 0;
let busy = false;
let pendingRun;

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
    const fractionText = fraction ? `.${fraction.toString().padStart(decimals, '0').replace(/0+$/, '')}` : '';
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
  document.querySelector('#quote-amount').textContent = formatTokenAmount(active.amountRaw, active.decimals, active.tokenSymbol);
  document.querySelector('#quote-token').textContent = shortAddress(active.tokenAddress);
  document.querySelector('#quote-token').title = active.tokenAddress;
  document.querySelector('#quote-receiver').textContent = shortAddress(active.receiver);
  document.querySelector('#quote-receiver').title = active.receiver;
}

function setSelectedToken(value) {
  if (busy || pendingRun) return;
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
  if (busy) return;
  let targetUrl;
  try {
    targetUrl = new URL(String(document.querySelector('#target-url')?.value || '').trim());
    if (!['https:', 'http:'].includes(targetUrl.protocol) || targetUrl.username || targetUrl.password) throw new Error();
  } catch {
    setStatus('Enter a complete http:// or https:// URL before paying.', 'error');
    return;
  }
  if (!form.reportValidity()) return;
  busy = true;
  pollGeneration++;
  window.clearTimeout(pollTimer);
  const controls = [...form.querySelectorAll('input, select, button')];
  controls.forEach((control) => { control.disabled = true; });
  try {
    if (!pendingRun) {
      await loadQuote();
      const activeQuote = currentQuote();
      const request = {
        url: targetUrl.href,
        paymentToken: selectedToken,
        personas: selectedPersonas(),
        timeoutMs: Number(document.querySelector('#timeout-ms')?.value || 20000),
        saveHtml: true,
        screenshots: true,
        llm: document.querySelector('#llm')?.value === '1',
      };
      setStatus('Preparing wallet payment...');
      setOutput('Confirm the payment in your wallet. Gauntlet will start after the transaction is verified.');

      const payment = await payErc20({
        tokenAddress: activeQuote.tokenAddress,
        receiver: activeQuote.receiver,
        amountRaw: activeQuote.amountRaw,
        status: (message) => setStatus(message),
      });
      pendingRun = { ...request, txHash: payment.txHash, walletAddress: payment.from };
    }

    setOutput(`Payment confirmed: ${pendingRun.txHash}\nStarting Gauntlet...`, 'success');
    const response = await fetch('/api/gauntlet-paid', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pendingRun),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.reason || 'Gauntlet could not start');
    pendingRun = undefined;
    window.clearTimeout(pollTimer);
    renderRun(data);
    setStatus('Payment verified. Gauntlet has started.', 'success');
    if (data.statusUrl) pollRun(data.statusUrl);
  } catch (error) {
    const message = readableWalletError(error);
    setStatus(message, 'error');
    setOutput(pendingRun
      ? `Payment confirmed: ${pendingRun.txHash}\nGauntlet could not start: ${message}\nRetry run uses this payment without sending another transfer. Keep this page open and save the transaction hash.`
      : `Gauntlet payment failed: ${message}`, 'error');
  } finally {
    busy = false;
    controls.forEach((control) => { control.disabled = Boolean(pendingRun); });
    payButton.disabled = false;
    payButton.textContent = pendingRun ? 'Retry run' : 'Pay + run';
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

async function pollRun(statusUrl, generation = pollGeneration) {
  try {
    const response = await fetch(statusUrl);
    const record = await response.json();
    if (generation !== pollGeneration) return;
    if (!response.ok) throw new Error(`Report status returned ${response.status}`);
    setStatus(record.status === 'completed' ? 'Run complete. Your report is ready.' : `Gauntlet is ${record.status}.`, record.status === 'failed' ? 'error' : 'success');
    const shareUrl = record.artifacts?.share ? new URL(record.artifacts.share, statusUrl) : null;
    if (shareUrl) shareUrl.searchParams.set('token', new URL(statusUrl).searchParams.get('token') || '');
    setOutputHtml(`
      <div class="run-result">
        <div>
          <b>${escapeHtml(record.summary?.verdict || record.status)}</b>
          <span>${escapeHtml(record.request?.url || 'Gauntlet run')}</span>
        </div>
        <p>${record.status === 'completed' ? 'Run complete. Share page and report links are ready.' : `Run is ${escapeHtml(record.status)}.`}</p>
        <div class="run-links">
          ${shareUrl ? `<a href="${escapeHtml(shareUrl.href)}" target="_blank" rel="noopener">Open share page</a>` : ''}
          <a href="${escapeHtml(statusUrl)}" target="_blank" rel="noopener">Open status JSON</a>
        </div>
      </div>
    `, record.status === 'failed' ? 'error' : 'success');
    if (record.status === 'queued' || record.status === 'running') {
      pollTimer = window.setTimeout(() => pollRun(statusUrl, generation), 2000);
    }
  } catch {
    if (generation !== pollGeneration) return;
    setStatus('Report status is temporarily unavailable. Your payment is confirmed; retrying automatically. You can still use the report links below.', 'error');
    pollTimer = window.setTimeout(() => pollRun(statusUrl, generation), 5000);
  }
}

tokenButtons.forEach((button) => {
  button.addEventListener('click', () => setSelectedToken(button.dataset.paymentToken));
});

form?.addEventListener('submit', startPaidRun);

initBuiltByEchoWallet()
  .then(() => {
    subscribeWallet((state) => {
      if (state.connected) {
        setStatus(`Connected ${shortAddress(state.address)} on Base. Choose a payment token and run Gauntlet.`);
        if (connectButton) connectButton.textContent = 'Wallet connected';
      } else {
        setStatus('Connect once, then approve a transaction for each tool run.');
        if (connectButton) connectButton.textContent = 'Connect wallet';
      }
    });
  })
  .catch((error) => setStatus(`Wallet connect unavailable: ${error?.message || 'Reown failed to load'}`, 'error'));

loadQuote().catch((error) => setOutput(`Quote load failed: ${error.message}`, 'error'));
