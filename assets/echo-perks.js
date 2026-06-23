import {
  BANKR_TOKEN,
  DARKSOL_TOKEN,
  DEFAULT_PERKS,
  ECHO_TOKEN,
  MIROSHARK_TOKEN,
  echoFromRaw,
  formatEcho,
  isPartnerPerkEligible,
  makeClaimId,
  partnerById,
  partnersForPerks,
  perkState,
  summarizePerks,
  tierForBalance,
  tokenRequirementsForPerk,
} from "./echo-perks-core.js";
import {
  connectWallet,
  ensureBaseNetwork,
  getWalletState,
  readableWalletError,
  shortAddress,
  subscribeWallet,
  waitForProvider,
} from "./bbe-wallet.js";

const app = document.querySelector("#perks-app");
const walletStatus = document.querySelector("#wallet-status");
const DEMO_WALLET = "0xEch0000000000000000000000000000000Perks";
const DEMO_BALANCE = 12_750_000;
const PERKS_KEY = "echo-perks:v1:site:perks";
const CLAIMS_KEY = "echo-perks:v1:site:claims";
const FORCE_DEFAULT_PERK_IDS = new Set(["miroshark-paid-call", "miroshark-echo-boost-credit"]);
const MIROSHARK_ACTIVE_STATUSES = new Set([
  "miroshark run queued",
  "miroshark run paying",
  "miroshark run submitted",
  "miroshark run running",
]);
const params = new URLSearchParams(window.location.search);
const PREVIEW_BANKR = params.get("preview") === "bankr";

const state = {
  wallet: "",
  balance: 0,
  balances: { ECHO: 0 },
  mode: "holder",
  filter: "all",
  partnerFilter: "all",
  claimDraft: null,
  runDraft: null,
  loading: false,
  notice: "",
  error: "",
  perks: loadPerks(),
  claims: loadClaims(),
};

subscribeWallet((wallet) => {
  if (!wallet.connected || !wallet.address) return;
  state.wallet = wallet.address;
  render();
});

render();
loadServerPerks();
setInterval(() => refreshActiveMirosharkClaims({ silent: true }), 30000);
if (PREVIEW_BANKR) {
  usePreviewWallet();
}

function loadPerks() {
  const stored = localStorage.getItem(PERKS_KEY);
  if (!stored) return DEFAULT_PERKS;
  try {
    const parsed = JSON.parse(stored);
    return mergePerks(parsed);
  } catch {
    return DEFAULT_PERKS;
  }
}

function mergePerks(perks) {
  const defaultById = new Map(DEFAULT_PERKS.map((perk) => [perk.id, perk]));
  const storedIds = new Set(perks.map((perk) => perk.id));
  return [
    ...DEFAULT_PERKS.filter((perk) => !storedIds.has(perk.id)),
    ...perks.map((perk) => (FORCE_DEFAULT_PERK_IDS.has(perk.id) ? { ...perk, ...defaultById.get(perk.id) } : perk)),
  ];
}

function savePerks() {
  localStorage.setItem(PERKS_KEY, JSON.stringify(state.perks));
}

function loadClaims() {
  const stored = localStorage.getItem(CLAIMS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveClaims() {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(state.claims));
}

function claimWallet() {
  return state.wallet || DEMO_WALLET;
}

function currentBalances() {
  return { ...state.balances, ECHO: state.balance };
}

function walletClaimIds() {
  return state.claims.filter((claim) => claim.wallet === claimWallet()).map((claim) => claim.perkId);
}

function setStatus(message) {
  if (walletStatus) walletStatus.textContent = message;
}

function setNotice(message) {
  state.notice = message;
  state.error = "";
  state.claimDraft = null;
  state.runDraft = null;
  render();
}

function setError(message) {
  state.error = message;
  state.notice = "";
  render();
}

async function connectAndReadBalance() {
  state.loading = true;
  render();
  try {
    setStatus("Opening BuiltByEcho Privy login...");
    await connectWallet();
    const provider = await waitForProvider();
    await ensureBaseNetwork(provider);
    const wallet = getWalletState();
    state.wallet = wallet.address || state.wallet;
    const [echoBalance, bankrBalance, darksolBalance, mirosharkBalance] = await Promise.all([
      readTokenBalance(provider, state.wallet, ECHO_TOKEN),
      readTokenBalance(provider, state.wallet, BANKR_TOKEN),
      readTokenBalance(provider, state.wallet, DARKSOL_TOKEN),
      readTokenBalance(provider, state.wallet, MIROSHARK_TOKEN),
    ]);
    state.balance = echoBalance;
    state.balances = { ECHO: echoBalance, BNKR: bankrBalance, DARKSOL: darksolBalance, MIROSHARK: mirosharkBalance };
    setStatus(`Connected ${shortAddress(state.wallet)} on Base.`);
    await loadServerClaims();
    await refreshActiveMirosharkClaims({ silent: true });
    const mirosharkNotice = mirosharkBalance > 0 ? `, and ${formatEcho(mirosharkBalance)} MiroShark` : "";
    setNotice(`Found ${formatEcho(echoBalance)} ECHO, ${formatEcho(bankrBalance)} BNKR, ${formatEcho(darksolBalance)} DARKSOL${mirosharkNotice}. Perks updated.`);
  } catch (error) {
    setStatus(readableWalletError(error));
    setError(readableWalletError(error));
  } finally {
    state.loading = false;
    render();
  }
}

async function readTokenBalance(provider, wallet, token) {
  const selector = "0x70a08231";
  const encodedWallet = wallet.toLowerCase().replace("0x", "").padStart(64, "0");
  const result = await provider.request({
    method: "eth_call",
    params: [{ to: token.address, data: `${selector}${encodedWallet}` }, "latest"],
  });
  return echoFromRaw(BigInt(result), token.decimals);
}

function usePreviewWallet() {
  state.wallet = DEMO_WALLET;
  state.balance = DEMO_BALANCE;
  state.balances = { ECHO: DEMO_BALANCE, BNKR: 42_000 };
  state.partnerFilter = "all";
  setStatus("Preview wallet loaded for internal review.");
  setNotice("");
}

async function loadServerPerks() {
  try {
    const response = await fetch("/api/perks", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const body = await response.json();
    if (!body.ok || !Array.isArray(body.perks)) return;
    state.perks = mergePerks(body.perks);
    savePerks();
    render();
  } catch {
    // Static local preview has no serverless API. Local perks are enough there.
  }
}

async function loadServerClaims() {
  if (!state.wallet || state.wallet === DEMO_WALLET) return;
  try {
    const params = new URLSearchParams({ wallet: state.wallet });
    const response = await fetch(`/api/perk-claims?${params.toString()}`, { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const body = await response.json();
    if (!body.ok || !Array.isArray(body.claims)) return;
    body.claims.forEach(upsertClaim);
  } catch {
    // Claims still work from local receipts if the server is unavailable.
  }
}

function openClaimForm(perkId) {
  const perk = state.perks.find((item) => item.id === perkId);
  if (!perk) return;
  if (!isPartnerPerkEligible(perk, currentBalances())) {
    setError(`This perk needs ${requirementText(perk)}.`);
    return;
  }
  state.claimDraft = { perkId };
  state.notice = "";
  state.error = "";
  render();
  app.querySelector("[data-claim-intake]")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function openMirosharkRunForm(perkId) {
  const claim = claimForPerk(perkId);
  if (!claim || !isUnusedMirosharkCredit(claim)) {
    setError("This MiroShark credit is already queued or used.");
    return;
  }
  state.runDraft = { perkId };
  state.claimDraft = null;
  state.notice = "";
  state.error = "";
  render();
  app.querySelector("[data-miroshark-run-intake]")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function claimPerk(form) {
  const data = new FormData(form);
  const perkId = String(data.get("perkId") || "");
  const perk = state.perks.find((item) => item.id === perkId);
  if (!perk) return;
  if (!isPartnerPerkEligible(perk, currentBalances())) {
    setError(`This perk needs ${requirementText(perk)}.`);
    return;
  }

  const claimDetails = {
    contactHandle: String(data.get("contactHandle") || "").trim(),
    contactEmail: String(data.get("contactEmail") || "").trim(),
    projectUrl: String(data.get("projectUrl") || "").trim(),
    requestNote: String(data.get("requestNote") || "").trim(),
  };
  const credit = isToolCreditPerk(perk);
  if (!claimDetails.contactHandle || (!credit && !claimDetails.requestNote)) {
    setError(credit ? "Add a contact handle before claiming this credit." : "Add a contact handle and a short fulfillment note before claiming.");
    return;
  }
  if (credit && !claimDetails.requestNote) claimDetails.requestNote = "Tool credit claimed for self-serve use.";

  state.loading = true;
  render();
  try {
    if (state.wallet && state.wallet !== DEMO_WALLET) {
      const response = await fetch("/api/perk-claims", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          wallet: state.wallet,
          perkId,
          ...claimDetails,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body.error || `claim_http_${response.status}`);
      }
      upsertClaim(body.claim);
      state.loading = false;
      setNotice(claimNotice(perk, credit));
      return;
    }
  } catch (error) {
    setError(`Backend claim failed: ${error.message}. Demo claims still work locally.`);
    state.loading = false;
    render();
    return;
  }

  const id = makeClaimId(claimWallet(), perkId);
  if (state.claims.some((claim) => claim.id === id)) {
    setNotice("Already claimed.");
    state.loading = false;
    return;
  }
  upsertClaim({
    id,
    wallet: claimWallet(),
    perkId,
    title: perk.title,
    ...claimDetails,
    createdAt: new Date().toISOString(),
    status: credit ? "tool credit available" : "pending fulfillment",
  });
  setNotice(claimNotice(perk, credit));
  state.loading = false;
  render();
}

function upsertClaim(claim) {
  state.claims = [claim, ...state.claims.filter((item) => item.id !== claim.id)];
  saveClaims();
}

async function sharePerk(perkId) {
  const perk = state.perks.find((item) => item.id === perkId);
  const text = `I unlocked ${perk?.title || "an Echo perk"} with my ECHO membership. Give your token something to do.`;
  try {
    await navigator.clipboard.writeText(text);
    setNotice("Share text copied.");
  } catch {
    setNotice(text);
  }
}

function addPerk(form) {
  const data = new FormData(form);
  const title = String(data.get("title") || "").trim();
  if (!title) {
    setError("Perk title is required.");
    return;
  }
  state.perks.unshift({
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    title,
    partner: String(data.get("partner") || "BuiltByEcho"),
    type: String(data.get("type") || "Access"),
    status: String(data.get("status") || "draft"),
    minEcho: Number(data.get("minEcho") || 1),
    expires: String(data.get("expires") || "TBD"),
    summary: String(data.get("summary") || ""),
    deliverable: String(data.get("deliverable") || "Claim link"),
    cta: String(data.get("cta") || "Claim"),
  });
  savePerks();
  saveServerPerks();
  form.reset();
  setNotice("Perk added locally.");
}

async function saveServerPerks() {
  try {
    await fetch("/api/perks", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ perks: state.perks }),
    });
  } catch {
    // Local static preview does not have API support.
  }
}

function resetDemo() {
  localStorage.removeItem(PERKS_KEY);
  localStorage.removeItem(CLAIMS_KEY);
  state.perks = DEFAULT_PERKS;
  state.claims = [];
  setNotice("Demo data reset.");
}

function visiblePerks() {
  const claimed = walletClaimIds();
  return publicPerks().filter((perk) => {
    if (state.partnerFilter !== "all" && (perk.partnerId || "builtbyecho") !== state.partnerFilter) return false;
    if (state.filter === "all") return true;
    return perkState(perk, state.balance, claimed, currentBalances()) === state.filter;
  });
}

function publicPerks() {
  return state.perks.filter((perk) => !isComingSoonPartner(perk.partnerId || "builtbyecho"));
}

function isComingSoonPartner(partnerId) {
  return partnerById(partnerId)?.status === "coming-soon";
}

function eligiblePartnerIds() {
  const balances = currentBalances();
  return partnersForPerks(publicPerks())
    .filter((partner) => publicPerks().some((perk) => (perk.partnerId || "builtbyecho") === partner.id && isPartnerPerkEligible(perk, balances)))
    .map((partner) => partner.id);
}

function stat(label, value) {
  return `
    <article class="mini-stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `;
}

function statusLabel(name) {
  if (name === "Visitor") return "Connect to check status";
  return `${name} status`;
}

function render() {
  if (!app) return;
  const tier = tierForBalance(state.balance);
  const claimedIds = walletClaimIds();
  const balances = currentBalances();
  const summary = summarizePerks(publicPerks(), state.balance, claimedIds, balances);
  const claims = state.claims.filter((claim) => claim.wallet === claimWallet()).slice(0, 5);
  const matchedPartners = eligiblePartnerIds();
  const hasWallet = Boolean(state.wallet);

  app.innerHTML = `
    <section class="perks-hero wide">
      <div class="hero-copy">
        <div class="hero-label-row">
          <p class="section-kicker">Echo Perks</p>
          <span>Multi-partner</span>
        </div>
        <h1>One wallet. Every partner perk it unlocks.</h1>
        <p class="perks-lede">
          Connect a Base wallet to see the ECHO perks, partner rooms, and tool credits
          available to that wallet.
        </p>
        <div class="perks-actions">
          <button class="btn btn-primary" data-connect>${state.wallet ? "Refresh wallet" : "Connect wallet"}</button>
        </div>
        <dl class="hero-proof">
          <div>
            <dt>Connect</dt>
            <dd>Check once</dd>
          </div>
          <div>
            <dt>Match</dt>
            <dd>${hasWallet ? `${matchedPartners.length || 0} dashboards` : "Your tokens"}</dd>
          </div>
          <div>
            <dt>Claim</dt>
            <dd>${hasWallet ? `${summary.available} ready` : "Credits"}</dd>
          </div>
        </dl>
      </div>
      <aside class="perks-card membership-card">
        <span class="pass-label">Your status</span>
        <strong>${statusLabel(tier.name)}</strong>
        ${
          state.wallet
            ? `<p>${walletSummary(balances)} ${tier.description}</p>`
            : `<p>No wallet checked yet. Connect once and Echo turns this into a personalized partner dashboard.</p>`
        }
        <div class="perks-progress"><i style="width:${tier.progress}%"></i></div>
        <small>${state.wallet ? tier.next ? `${formatEcho(tier.next - state.balance)} ECHO until next tier` : "Top tier reached" : "Connect to check token balances"}</small>
      </aside>
    </section>

    ${state.notice ? `<div class="perks-notice wide">${state.notice}</div>` : ""}
    ${state.error ? `<div class="perks-notice perks-error wide">${state.error}</div>` : ""}
    ${claimIntake()}
    ${mirosharkRunIntake()}

    ${holderView(claims, summary, hasWallet)}
  `;

  bindEvents();
}

function claimIntake() {
  if (!state.claimDraft) return "";
  const perk = state.perks.find((item) => item.id === state.claimDraft.perkId);
  if (!perk) return "";
  const credit = isToolCreditPerk(perk);
  return `
    <section class="wide perks-panel fulfillment-panel" data-claim-intake>
      <div class="fulfillment-copy">
        <p class="section-kicker">${credit ? "Tool credit" : "Claim intake"}</p>
        <h2>${escapeHtml(perk.title)}</h2>
        <p>${credit ? "Claim the credit now. The next step is a self-serve tool launcher instead of a manual Discord handoff." : "Tell us where to follow up and what you want fulfilled. Eligibility is checked before the claim is accepted."}</p>
      </div>
      <form class="claim-form" data-claim-form>
        <input type="hidden" name="perkId" value="${escapeAttribute(perk.id)}" />
        <label>
          Discord or TG handle
          <input name="contactHandle" autocomplete="username" placeholder="@yourhandle" required />
        </label>
        <label>
          Email optional
          <input name="contactEmail" type="email" autocomplete="email" placeholder="you@example.com" />
        </label>
        <label>
          Project or link optional
          <input name="projectUrl" inputmode="url" placeholder="Site, repo, doc, or post" />
        </label>
        ${
          credit
            ? `<input type="hidden" name="requestNote" value="Tool credit claimed for self-serve use." />`
            : `<label class="claim-note">
                What should we fulfill?
                <textarea name="requestNote" rows="4" placeholder="Example: review this landing page and tell me what to fix first." required></textarea>
              </label>`
        }
        <div class="perk-actions">
          <button class="btn btn-primary" type="submit" ${state.loading ? "disabled" : ""}>${credit ? "Claim credit" : "Submit claim"}</button>
          <button class="btn btn-secondary" type="button" data-cancel-claim>Cancel</button>
        </div>
      </form>
    </section>
  `;
}

function mirosharkRunIntake() {
  if (!state.runDraft) return "";
  const perk = state.perks.find((item) => item.id === state.runDraft.perkId);
  const claim = claimForPerk(state.runDraft.perkId);
  if (!perk || !claim) return "";
  return `
    <section class="wide perks-panel fulfillment-panel" data-miroshark-run-intake>
      <div class="fulfillment-copy">
        <p class="section-kicker">Use credit</p>
        <h2>${escapeHtml(perk.title)}</h2>
        <p>Enter one MiroShark run input. Echo queues the run, fronts the x402 charge from the Echo wallet, and keeps this credit from being used twice.</p>
      </div>
      <form class="claim-form" data-miroshark-run-form>
        <input type="hidden" name="perkId" value="${escapeAttribute(perk.id)}" />
        <label class="claim-note">
          Prompt
          <textarea name="prompt" rows="4" placeholder="Scenario, question, or brief to simulate"></textarea>
        </label>
        <label>
          URL
          <input name="url" inputmode="url" placeholder="https://example.com/post-or-page" />
        </label>
        <label>
          Prediction market optional
          <input name="predictionMarket" placeholder="YES/NO market question" />
        </label>
        <label class="claim-note">
          Article
          <textarea name="article" rows="5" placeholder="Paste article text instead of prompt or URL"></textarea>
        </label>
        <label class="checkbox-line">
          <input name="deepResearch" type="checkbox" value="1" />
          Deep research
        </label>
        <div class="perk-actions">
          <button class="btn btn-primary" type="submit" ${state.loading ? "disabled" : ""}>Queue run</button>
          <button class="btn btn-secondary" type="button" data-cancel-run>Cancel</button>
        </div>
      </form>
    </section>
  `;
}

async function submitMirosharkRun(form) {
  const data = new FormData(form);
  const perkId = String(data.get("perkId") || "");
  const claim = claimForPerk(perkId);
  if (!claim || !isUnusedMirosharkCredit(claim)) {
    setError("This MiroShark credit is already queued or used.");
    return;
  }

  const payload = {
    wallet: claimWallet(),
    perkId,
    prompt: String(data.get("prompt") || "").trim(),
    url: String(data.get("url") || "").trim(),
    article: String(data.get("article") || "").trim(),
    predictionMarket: String(data.get("predictionMarket") || "").trim(),
    deepResearch: Boolean(data.get("deepResearch")),
  };
  const supplied = [payload.prompt, payload.url, payload.article].filter(Boolean);
  if (supplied.length !== 1) {
    setError("Add exactly one input: prompt, URL, or article.");
    return;
  }

  state.loading = true;
  render();
  try {
    if (state.wallet && state.wallet !== DEMO_WALLET) {
      const response = await fetch("/api/miroshark-credit-runs", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) throw new Error(body.error || `miroshark_run_http_${response.status}`);
      upsertClaim(body.claim);
      state.loading = false;
      setNotice("MiroShark run queued. Echo will front the x402 run and reconcile the partner refund.");
      refreshActiveMirosharkClaims({ silent: true });
      return;
    }
  } catch (error) {
    setError(`MiroShark run queue failed: ${error.message}. Demo queue still works locally.`);
    state.loading = false;
    render();
    return;
  }

  upsertClaim({
    ...claim,
    status: "miroshark run queued",
    usedAt: new Date().toISOString(),
    mirosharkRun: {
      id: `demo_miroshark_${Date.now().toString(36)}`,
      status: "queued_for_echo_wallet",
      payer: "echo_wallet",
      refundPath: "affiliate_refund",
      input: {
        ...(payload.prompt ? { prompt: payload.prompt } : {}),
        ...(payload.url ? { url: payload.url } : {}),
        ...(payload.article ? { article: payload.article } : {}),
        ...(payload.deepResearch ? { deep_research: true } : {}),
        ...(payload.predictionMarket ? { prediction_market: payload.predictionMarket } : {}),
      },
      createdAt: new Date().toISOString(),
    },
  });
  state.loading = false;
  setNotice("Demo MiroShark run queued. Echo wallet payment is tracked against this credit.");
}

async function refreshActiveMirosharkClaims({ silent = false } = {}) {
  if (!state.wallet || state.wallet === DEMO_WALLET) return;
  const activeClaims = state.claims.filter((claim) => claim.wallet === claimWallet() && isActiveMirosharkClaim(claim));
  if (!activeClaims.length) return;

  try {
    const refreshed = await Promise.all(
      activeClaims.map(async (claim) => {
        const response = await fetch("/api/miroshark-credit-status", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ wallet: claimWallet(), perkId: claim.perkId }),
        });
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(body.error || `miroshark_status_http_${response.status}`);
        return body.claim;
      }),
    );
    refreshed.filter(Boolean).forEach(upsertClaim);
    if (!silent) setNotice("MiroShark run status refreshed.");
    else render();
  } catch (error) {
    if (!silent) setError(`MiroShark status refresh failed: ${error.message}`);
  }
}

function isToolCreditPerk(perk) {
  const text = `${perk?.type || ""} ${perk?.deliverable || ""} ${perk?.title || ""}`.toLowerCase();
  return text.includes("tool credit") || text.includes("partner credit") || text.includes("dual-holder credit");
}

function isMirosharkPerk(perkOrId) {
  const perk = typeof perkOrId === "string" ? state.perks.find((item) => item.id === perkOrId) : perkOrId;
  return (perk?.partnerId || "").toLowerCase() === "miroshark";
}

function claimForPerk(perkId) {
  return state.claims.find((claim) => claim.wallet === claimWallet() && claim.perkId === perkId);
}

function isUnusedMirosharkCredit(claim) {
  return ["tool credit available", "miroshark credit available"].includes(String(claim?.status || "").toLowerCase());
}

function isActiveMirosharkClaim(claim) {
  return isMirosharkPerk(claim?.perkId) && MIROSHARK_ACTIVE_STATUSES.has(String(claim?.status || "").toLowerCase());
}

function mirosharkRunLink(run) {
  return run?.shareUrl || run?.reportUrl || run?.waitUrl || run?.statusUrl || run?.result?.data?.share_url || run?.result?.data?.wait_url || run?.result?.data?.status_url || "";
}

function mirosharkRunSummary(claim) {
  const run = claim?.mirosharkRun || {};
  const status = String(run.status || claim?.status || "").replaceAll("_", " ");
  const progress = Number(run.progress || run.statusData?.data?.progress || 0);
  const stage = run.currentStage || run.statusData?.data?.current_stage || "";
  const message = run.message || run.statusData?.data?.message || "";
  const completed = String(claim?.status || "").toLowerCase() === "miroshark run completed";
  const failed = String(claim?.status || "").toLowerCase() === "miroshark run failed";
  const link = mirosharkRunLink(run);
  return { run, status, progress, stage, message, completed, failed, link };
}

function claimNotice(perk, credit) {
  if (isMirosharkPerk(perk)) return `${perk.title} claimed. Use credit when ready; Echo will front the MiroShark run and track the refund path.`;
  return credit ? `${perk.title} claimed. Tool credit is ready for use.` : `${perk.title} claimed. Fulfillment request created.`;
}

function holderView(claims, summary, hasWallet) {
  return `
    <section class="wide holder-shell">
      <div class="holder-header">
        <div>
          <p class="section-kicker">${hasWallet ? "Your dashboard" : "Holder dashboard"}</p>
          <h2>${hasWallet ? "Claim what this wallet unlocks." : "Connect to check eligibility."}</h2>
        </div>
        <div class="perks-filters">
          ${["all", "available", "locked", "claimed"]
            .map((filter) => `<button class="${state.filter === filter ? "active" : ""}" data-filter="${filter}">${filter}</button>`)
            .join("")}
        </div>
      </div>
      <section class="mini-stat-grid">
        ${stat("Can claim", summary.available)}
        ${stat("Locked", summary.locked)}
        ${stat("Claimed", summary.claimed)}
        ${stat("Preview", summary.preview)}
      </section>
      ${partnerDashboardRail()}
      ${partnerDetailPanel()}
      <div class="perks-grid">
        ${visiblePerks().map(perkCard).join("")}
      </div>
      <section class="perks-panel claim-ledger">
        <div>
          <p class="section-kicker">Receipts</p>
          <h2>Recent claims</h2>
        </div>
        <div class="claims-list">
          ${
            claims.length
              ? claims.map(claimRow).join("")
              : `<p class="empty">No claims yet. Claim an available perk to create the first receipt.</p>`
          }
        </div>
      </section>
    </section>
  `;
}

function partnerDashboardRail() {
  const balances = currentBalances();
  const partners = partnersForPerks(state.perks);
  return `
    <section class="partner-dashboard-grid">
      ${partners.map((partner) => partnerDashboardCard(partner, balances)).join("")}
    </section>
  `;
}

function partnerDashboardCard(partner, balances) {
  const partnerPerks = state.perks.filter((perk) => (perk.partnerId || "builtbyecho") === partner.id);
  const available = partnerPerks.filter((perk) => perkState(perk, state.balance, walletClaimIds(), balances) === "available").length;
  const locked = partnerPerks.filter((perk) => perkState(perk, state.balance, walletClaimIds(), balances) === "locked").length;
  const balance = Number(balances[partner.tokenSymbol] || 0);
  const active = state.partnerFilter === partner.id;
  const comingSoon = partner.status === "coming-soon";
  const isEligible = available > 0;
  const cardAccent = comingSoon ? "oklch(0.62 0.034 220)" : partner.accent;
  const cardAccent2 = comingSoon ? "oklch(0.48 0.03 226)" : partner.accent2;
  return `
    <article class="partner-dashboard ${active ? "active" : ""} ${comingSoon ? "coming-soon" : ""}" style="--partner-accent:${cardAccent};--partner-accent-2:${cardAccent2}">
      <button type="button" ${comingSoon ? "" : `data-partner="${partner.id}"`} aria-pressed="${active ? "true" : "false"}" ${comingSoon ? "disabled" : ""}>
        <span class="partner-mark">${comingSoon ? "??" : partner.logo ? `<img src="${partner.logo}" alt="" />` : partner.shortName.slice(0, 2)}</span>
        <span>
          <b>${comingSoon ? "Partner room" : partner.name}</b>
          <small>${comingSoon ? "Coming soon" : isEligible ? `${available} perk${available === 1 ? "" : "s"} ready` : partner.requirement}</small>
        </span>
        <em>${comingSoon ? "soon" : balance ? `${formatEcho(balance)} ${partner.displayTokenSymbol || partner.tokenSymbol}` : locked ? "locked" : "open"}</em>
      </button>
      <p>${comingSoon ? "A new partner room is being finalized." : partner.tagline}</p>
    </article>
  `;
}

function partnerDetailPanel() {
  if (state.partnerFilter === "all") return "";
  const partner = partnerById(state.partnerFilter);
  if (!partner) return "";
  const partnerPerks = state.perks.filter((perk) => (perk.partnerId || "builtbyecho") === partner.id);
  const balances = currentBalances();
  const balance = Number(balances[partner.tokenSymbol] || 0);
  const ready = partnerPerks.filter((perk) => perkState(perk, state.balance, walletClaimIds(), balances) === "available").length;
  const links = Array.isArray(partner.links) ? partner.links : [];
  const headerFit = partner.headerFit || "cover";
  const headerStyle = partner.header
    ? ` style="background-image:url('${escapeAttribute(partner.header)}');background-size:${escapeAttribute(headerFit)};background-repeat:no-repeat"`
    : "";
  return `
    <section class="partner-detail perks-panel" style="--partner-accent:${partner.accent};--partner-accent-2:${partner.accent2}">
      <div class="partner-detail-media"${headerStyle}>
        <span class="partner-mark partner-detail-logo">${partner.logo ? `<img src="${escapeAttribute(partner.logo)}" alt="" />` : escapeHtml(partner.shortName.slice(0, 2))}</span>
      </div>
      <div class="partner-detail-copy">
        <p class="section-kicker">Partner room</p>
        <h2>${escapeHtml(partner.name)}</h2>
        <p>${escapeHtml(partner.tagline)}</p>
        <dl class="partner-detail-facts">
          <div><dt>Audience</dt><dd>${escapeHtml(partner.audience)}</dd></div>
          <div><dt>Requirement</dt><dd>${escapeHtml(partner.requirement)}</dd></div>
          <div><dt>Balance</dt><dd>${balance ? `${formatEcho(balance)} ${escapeHtml(partner.displayTokenSymbol || partner.tokenSymbol)}` : "Not checked"}</dd></div>
          <div><dt>Ready</dt><dd>${ready} of ${partnerPerks.length}</dd></div>
          ${partner.tokenAddress ? `<div><dt>CA</dt><dd class="mono">${escapeHtml(partner.tokenAddress)}</dd></div>` : ""}
        </dl>
        ${
          links.length
            ? `<div class="partner-links">${links
                .map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`)
                .join("")}</div>`
            : ""
        }
      </div>
      <div class="partner-detail-perks">
        ${partnerPerks
          .map((perk) => `<article><span>${escapeHtml(perk.type)}</span><strong>${escapeHtml(perk.title)}</strong><p>${escapeHtml(perk.deliverable)}</p></article>`)
          .join("")}
      </div>
    </section>
  `;
}

function perkCard(perk) {
  const stateName = perkState(perk, state.balance, walletClaimIds(), currentBalances());
  const partner = partnerById(perk.partnerId || "builtbyecho");
  const claim = claimForPerk(perk.id);
  const mirosharkUnused = isMirosharkPerk(perk) && isUnusedMirosharkCredit(claim);
  const actionLabel =
    stateName === "claimed"
      ? isMirosharkPerk(perk)
        ? mirosharkUnused
          ? "Use credit"
          : "Run queued"
        : "Claimed"
      : stateName === "locked"
        ? `Needs ${requirementText(perk)}`
        : stateName === "preview"
          ? "Coming later"
          : perk.cta;
  return `
    <article class="perks-panel perk ${stateName} ${perk.featured ? "featured" : ""}" style="--partner-accent:${partner.accent};--partner-accent-2:${partner.accent2}">
      <div class="perk-top">
        <span>${perk.type}</span>
        <em>${stateName}</em>
      </div>
      <h3>${perk.title}</h3>
      <p>${perk.summary}</p>
      <dl>
        <div><dt>Source</dt><dd>${perk.partner}</dd></div>
        <div><dt>Needs</dt><dd>${requirementText(perk)}</dd></div>
        <div><dt>Delivers</dt><dd>${perk.deliverable}</dd></div>
        <div><dt>Window</dt><dd>${perk.expires}</dd></div>
      </dl>
      ${stateName === "claimed" && isMirosharkPerk(perk) ? mirosharkCreditPanel(claim) : ""}
      <div class="perk-actions">
        <button class="btn btn-primary" ${stateName === "claimed" && isMirosharkPerk(perk) ? `data-use-miroshark="${perk.id}"` : `data-claim="${perk.id}"`} ${stateName === "locked" || (stateName === "claimed" && !isMirosharkPerk(perk)) || (stateName === "claimed" && isMirosharkPerk(perk) && !mirosharkUnused) || stateName === "preview" ? "disabled" : ""}>
          ${actionLabel}
        </button>
        <button class="btn btn-secondary" data-share="${perk.id}">Share</button>
      </div>
    </article>
  `;
}

function requirementText(perk) {
  const requirements = tokenRequirementsForPerk(perk);
  if (!requirements.length) return `${formatEcho(perk.minEcho)} ECHO`;
  return requirements.map((requirement) => `${formatEcho(requirement.min)} ${displayTokenSymbol(requirement.token)}`).join(" + ");
}

function walletSummary(balances) {
  const detected = Object.entries(balances)
    .filter(([token, value]) => Number(value || 0) > 0 && !isComingSoonPartnerToken(token))
    .map(([token, value]) => `${formatEcho(value)} ${displayTokenSymbol(token)}`);
  if (!detected.length) return "No eligible token balance detected yet.";
  return `${detected.join(" + ")} detected.`;
}

function isComingSoonPartnerToken(token) {
  const symbol = String(token || "").toUpperCase();
  return partnersForPerks(state.perks).some((partner) => partner.status === "coming-soon" && partner.tokenSymbol === symbol);
}

function displayTokenSymbol(token) {
  const symbol = String(token || "ECHO").toUpperCase();
  if (symbol === BANKR_TOKEN.symbol) return BANKR_TOKEN.displaySymbol;
  if (symbol === MIROSHARK_TOKEN.symbol) return MIROSHARK_TOKEN.displaySymbol;
  return symbol;
}

function claimRow(claim) {
  const miroshark = isMirosharkPerk(claim.perkId);
  const run = miroshark ? mirosharkRunSummary(claim) : null;
  return `
    <article class="claim-row ${miroshark ? "miroshark-claim" : ""}">
      <div class="claim-main">
        <strong>${claim.title}</strong>
        ${miroshark && run?.stage ? `<small>${escapeHtml(run.stage)}${run.message ? ` · ${escapeHtml(run.message)}` : ""}</small>` : ""}
        ${miroshark && Number(run?.progress || 0) > 0 ? `<div class="run-progress"><span style="width:${Math.min(100, Math.max(0, run.progress))}%"></span></div>` : ""}
      </div>
      <span>${claim.status}</span>
      <time>${new Date(claim.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
      ${miroshark && isUnusedMirosharkCredit(claim) ? `<button class="btn btn-secondary claim-command-button" type="button" data-use-miroshark="${escapeAttribute(claim.perkId)}">Use credit</button>` : ""}
      ${miroshark && isActiveMirosharkClaim(claim) ? `<button class="btn btn-secondary claim-command-button" type="button" data-refresh-miroshark="${escapeAttribute(claim.perkId)}">Refresh</button>` : ""}
      ${miroshark && run?.link ? `<a class="btn btn-secondary claim-command-button" href="${escapeAttribute(run.link)}" target="_blank" rel="noopener">${run.completed ? "Open report" : "View run"}</a>` : ""}
    </article>
  `;
}

function mirosharkCreditPanel(claim) {
  const run = mirosharkRunSummary(claim);
  const queued = isActiveMirosharkClaim(claim);
  const completed = run.completed;
  const failed = run.failed;
  return `
    <div class="perk-command">
      <span>${completed ? "Report ready" : failed ? "Run failed" : queued ? "Run in progress" : "Echo-fronted run"}</span>
      ${
        Number(run.progress || 0) > 0
          ? `<div class="run-progress"><span style="width:${Math.min(100, Math.max(0, run.progress))}%"></span></div>`
          : ""
      }
      <small>${mirosharkPanelCopy({ queued, completed, failed, run })}</small>
      ${run.link ? `<a href="${escapeAttribute(run.link)}" target="_blank" rel="noopener">${completed ? "Open MiroShark report" : "Open MiroShark run"}</a>` : ""}
    </div>
  `;
}

function mirosharkPanelCopy({ queued, completed, failed, run }) {
  if (completed) return "MiroShark finished this run. The report link is saved on this claim.";
  if (failed) return run.run?.error ? `MiroShark returned an error: ${run.run.error}` : "MiroShark returned an error for this run.";
  if (queued) {
    const stage = run.stage ? `${run.stage}${run.progress ? ` (${run.progress}%)` : ""}` : "waiting for status";
    return `Echo paid the x402 run. Current MiroShark state: ${stage}.`;
  }
  return "Use this credit inside Echo. Echo pays the $1 x402 run from its wallet, attaches the affiliate refund marker, and records the credit as used.";
}

function bindEvents() {
  app.querySelectorAll("[data-connect]").forEach((button) => {
    button.addEventListener("click", connectAndReadBalance);
  });
  app.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      render();
    });
  });
  app.querySelectorAll("[data-partner]").forEach((button) => {
    button.addEventListener("click", () => {
      state.partnerFilter = state.partnerFilter === button.dataset.partner ? "all" : button.dataset.partner;
      render();
    });
  });
  app.querySelectorAll("[data-claim]").forEach((button) => {
    button.addEventListener("click", () => openClaimForm(button.dataset.claim));
  });
  app.querySelectorAll("[data-use-miroshark]").forEach((button) => {
    button.addEventListener("click", () => openMirosharkRunForm(button.dataset.useMiroshark));
  });
  app.querySelectorAll("[data-refresh-miroshark]").forEach((button) => {
    button.addEventListener("click", () => refreshActiveMirosharkClaims({ silent: false }));
  });
  app.querySelector("[data-claim-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    claimPerk(event.currentTarget);
  });
  app.querySelector("[data-miroshark-run-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitMirosharkRun(event.currentTarget);
  });
  app.querySelector("[data-cancel-claim]")?.addEventListener("click", () => {
    state.claimDraft = null;
    render();
  });
  app.querySelector("[data-cancel-run]")?.addEventListener("click", () => {
    state.runDraft = null;
    render();
  });
  app.querySelectorAll("[data-share]").forEach((button) => {
    button.addEventListener("click", () => sharePerk(button.dataset.share));
  });
  app.querySelector("[data-add-perk]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    addPerk(event.currentTarget);
  });
  app.querySelector("[data-reset]")?.addEventListener("click", resetDemo);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
