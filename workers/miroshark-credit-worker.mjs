import { readFile } from "node:fs/promises";
import { x402Client } from "@x402/core/client";
import { x402HTTPClient } from "@x402/core/http";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const CLAIMS_INDEX_KEY = process.env.ECHO_PERKS_CLAIMS_INDEX_KEY || "echo-perks:v1:claims";
const WORKER_WALLET_FILE =
  process.env.MIROSHARK_WORKER_WALLET_FILE || "/Users/dustin/.openclaw/vault/miroshark-credit-worker-wallet.json";
const MIROSHARK_ENDPOINT = "https://x402.miroshark.xyz/run";
const MIROSHARK_AFFILIATE = "0xDEADBEEFCAFEBABEFEEDFACEBAADF00DDEADC0DE";
const MAX_AMOUNT_ATOMIC = BigInt(process.env.MIROSHARK_X402_MAX_AMOUNT_ATOMIC || "1000000");
const LOOP = process.argv.includes("--watch");
const DRY_RUN = process.argv.includes("--dry-run");
const CHECK_QUEUE = process.argv.includes("--check-queue");
const POLL_MS = Number(process.env.MIROSHARK_WORKER_POLL_MS || 15000);

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN");
  process.exit(1);
}

const wallet = await readWorkerWallet(WORKER_WALLET_FILE);
const account = privateKeyToAccount(wallet.privateKey);
const client = new x402Client().register("eip155:*", new ExactEvmScheme(toClientEvmSigner(account)));
const httpClient = new x402HTTPClient(client);

console.log(`MiroShark worker wallet: ${account.address}`);
console.log(`Mode: ${CHECK_QUEUE ? "check-queue" : DRY_RUN ? "dry-run" : LOOP ? "watch" : "once"}`);

if (CHECK_QUEUE) {
  const queued = await listQueuedClaims();
  console.log(`Queued MiroShark runs: ${queued.length}`);
  for (const claim of queued) {
    console.log(`${claim.id} ${claim.perkId} ${claim.mirosharkRun?.id || "no_run_id"}`);
  }
  process.exit(0);
}

do {
  const processed = await runOnce();
  if (!LOOP) {
    console.log(`Processed ${processed} queued run${processed === 1 ? "" : "s"}.`);
    break;
  }
  if (!processed) await sleep(POLL_MS);
} while (LOOP);

async function runOnce() {
  const queued = await listQueuedClaims();
  for (const { key, claim } of queued) {
    await processClaim(key, claim);
  }
  return queued.length;
}

async function listQueuedClaims() {
  const keys = await redis(["LRANGE", CLAIMS_INDEX_KEY, "0", "250"]);
  const queued = [];
  for (const key of keys || []) {
    const claim = await readClaim(key);
    if (!isQueuedMirosharkClaim(claim)) continue;
    queued.push({ key, claim });
  }
  return queued;
}

async function processClaim(key, claim) {
  const run = claim.mirosharkRun;
  const input = run?.input || {};
  const requestBody = {
    ...input,
    affiliate: MIROSHARK_AFFILIATE,
  };
  const startedAt = new Date().toISOString();

  await writeClaim(key, {
    ...claim,
    status: "miroshark run paying",
    mirosharkRun: {
      ...run,
      status: "paying",
      payer: "miroshark_credit_worker",
      workerWallet: account.address,
      startedAt,
    },
  });

  try {
    const result = DRY_RUN
      ? { status: 200, headers: {}, body: { dryRun: true, requestBody } }
      : await paidMirosharkFetch(requestBody);
    const finishedAt = new Date().toISOString();
    const nextClaim = {
      ...claim,
      status: "miroshark run submitted",
      mirosharkRun: {
        ...run,
        status: "submitted",
        payer: "miroshark_credit_worker",
        workerWallet: account.address,
        affiliate: MIROSHARK_AFFILIATE,
        endpoint: MIROSHARK_ENDPOINT,
        requestBody,
        httpStatus: result.status,
        paymentResponse: result.headers["payment-response"] || null,
        result: result.body,
        startedAt,
        finishedAt,
      },
      updatedAt: finishedAt,
    };
    await writeClaim(key, nextClaim);
    console.log(`Submitted ${claim.id}: HTTP ${result.status}`);
  } catch (error) {
    const failedAt = new Date().toISOString();
    await writeClaim(key, {
      ...claim,
      status: "miroshark run failed",
      mirosharkRun: {
        ...run,
        status: "failed",
        payer: "miroshark_credit_worker",
        workerWallet: account.address,
        affiliate: MIROSHARK_AFFILIATE,
        endpoint: MIROSHARK_ENDPOINT,
        requestBody,
        error: error?.message || "unknown_error",
        startedAt,
        failedAt,
      },
      updatedAt: failedAt,
    });
    console.error(`Failed ${claim.id}: ${error?.message || error}`);
  }
}

async function paidMirosharkFetch(body) {
  const init = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
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
  const evmAccepts = accepts.filter((item) => String(item.network || "").startsWith("eip155:"));
  if (!evmAccepts.length) throw new Error("no_evm_payment_option");
  const overLimit = evmAccepts.find((item) => BigInt(item.amount || 0) > MAX_AMOUNT_ATOMIC);
  if (overLimit) throw new Error(`payment_amount_over_limit:${overLimit.amount}`);
  const wrongEndpoint = paymentRequired?.resource?.url && paymentRequired.resource.url !== MIROSHARK_ENDPOINT;
  if (wrongEndpoint) throw new Error(`unexpected_payment_resource:${paymentRequired.resource.url}`);
}

async function readClaim(key) {
  const stored = await redis(["GET", key]);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

async function writeClaim(key, claim) {
  await redis(["SET", key, JSON.stringify({ ...claim, updatedAt: new Date().toISOString() })]);
}

function isQueuedMirosharkClaim(claim) {
  return (
    claim &&
    String(claim.perkId || "").startsWith("miroshark-") &&
    String(claim.status || "").toLowerCase() === "miroshark run queued" &&
    String(claim.mirosharkRun?.status || "").toLowerCase() === "queued_for_echo_wallet"
  );
}

async function redis(command) {
  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${REDIS_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error(`redis_http_${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(body.error);
  return body.result;
}

async function readWorkerWallet(file) {
  const parsed = JSON.parse(await readFile(file, "utf8"));
  const wallet = Array.isArray(parsed) ? parsed[0] : parsed;
  const privateKey = String(wallet.private_key || wallet.privateKey || "").trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error("invalid_worker_private_key");
  return { ...wallet, privateKey };
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
