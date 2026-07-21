import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), 'utf8');
const vercelConfig = JSON.parse(read('vercel.json'));
const indexHtml = read('index.html');
const echoHtml = read('echo.html');
const updatesHtml = read('updates.html');
const utilityFeed = JSON.parse(read('data/echo-utility.json'));
const pulseFeed = JSON.parse(read('data/echo-pulse-2026-07-21.json'));

const updateIds = [
  'echo-utility-hub',
  'dual-echo-quotes',
  'echo-wallet-actions',
];

test('canonical ECHO hub is routed, linked, and grounded in the Base token', () => {
  assert.ok(vercelConfig.rewrites.some((route) => route.source === '/echo' && route.destination === '/echo.html'));
  assert.match(indexHtml, /href="\/echo"/);
  assert.match(echoHtml, /<link rel="canonical" href="https:\/\/www\.builtbyecho\.xyz\/echo"/);
  assert.match(echoHtml, /What can I do with <span>ECHO<\/span> today\?/);
  assert.match(echoHtml, /0xA7F63eB41779925803a3EEC30890742571e63Ba3/);
  assert.match(echoHtml, /data-copy-contract/);
  assert.match(echoHtml, /data-add-token/);
  assert.match(echoHtml, /wallet_watchAsset/);
  assert.match(echoHtml, /wallet_switchEthereumChain/);
  assert.match(echoHtml, /0x2105/);
  assert.match(echoHtml, /Chain ID 8453/);
  assert.match(echoHtml, /overflow-x: hidden/);
  assert.match(echoHtml, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(echoHtml, /text-wrap: wrap/);
  assert.match(echoHtml, /not a promise of price or returns/i);
});

test('ECHO hub exposes two inspectable live product quote lanes', () => {
  assert.match(echoHtml, /Pay for a Gauntlet teardown/);
  assert.match(echoHtml, /Find an API with ECHO/);
  assert.match(echoHtml, /loadQuote\('gauntlet', '\/api\/gauntlet-quote'\)/);
  assert.match(echoHtml, /loadQuote\('api-finder', '\/api\/echo-api-finder-quote'\)/);
  assert.match(echoHtml, /href="\/gauntlet"/);
  assert.match(echoHtml, /href="\/api-finder\.html#human-interface"/);
  assert.match(echoHtml, /Live amounts load from each product's public quote endpoint/);
});

test('machine-readable utility feed includes the verified API Finder payment path', () => {
  assert.equal(utilityFeed.date, '2026-07-21');
  assert.equal(utilityFeed.network.chainId, 8453);
  assert.equal(utilityFeed.utility.length, 6);
  assert.deepEqual(utilityFeed.utility.map((item) => item.id), [
    'holder-perks',
    'gauntlet-payment',
    'api-finder-payment',
    'holder-request-pass',
    'dual-holder-credits',
    'contract-verification',
  ]);
  const apiFinder = utilityFeed.utility.find((item) => item.id === 'api-finder-payment');
  assert.equal(apiFinder.status, 'live');
  assert.equal(apiFinder.proofUrl, 'https://www.builtbyecho.xyz/api/echo-api-finder-quote');
  assert.match(utilityFeed.disclaimer, /not a promise of price or returns/i);
});

test('July 21 mini-drop contains three X-ready posts and rendered cards', () => {
  assert.equal(pulseFeed.date, '2026-07-21');
  assert.deepEqual(pulseFeed.builds.map((build) => build.id), updateIds);
  assert.match(updatesHtml, /id="july-21"/);
  assert.match(updatesHtml, /Three small ECHO updates/);

  for (const build of pulseFeed.builds) {
    assert.equal(build.status, 'shipped');
    assert.ok(build.proofUrl.startsWith('https://'));
    assert.ok(build.socialPost.length >= 100, `${build.id} post needs substance`);
    assert.ok(build.socialPost.length <= 280, `${build.id} post is ${build.socialPost.length} characters`);
    assert.match(build.image, /^assets\/social\/echo-mini-drop-2026-07-21-/);
    assert.ok(existsSync(join(repoRoot, build.image)), `${build.image} should exist`);
    const png = readFileSync(join(repoRoot, build.image));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.ok(png.length > 20_000, `${build.image} should be a rendered card`);
    assert.match(updatesHtml, new RegExp(`data-update-id="${build.id}"`));
  }
});
