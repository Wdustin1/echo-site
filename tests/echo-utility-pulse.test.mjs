import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), 'utf8');
const indexHtml = read('index.html');
const updatesHtml = read('updates.html');
const perksHtml = read('perks.html');
const gauntletHtml = read('gauntlet.html');
const perksCore = read('assets/echo-perks-core.js');
const vercelConfig = JSON.parse(read('vercel.json'));
const pulseFeed = JSON.parse(read('data/echo-pulse-2026-07-16.json'));
const utilityFeed = JSON.parse(read('data/echo-utility.json'));

const updateIds = [
  'echo-utility-map',
  'holder-dashboard-refresh',
  'gauntlet-echo-proof',
  'echo-utility-feed',
  'clean-updates-route',
];

test('homepage leads with a current ECHO utility map and archives stale sprint boards', () => {
  assert.match(indexHtml, /id="echo-utility-now"/);
  assert.match(indexHtml, /What ECHO does today/);
  assert.match(indexHtml, /11 active claim paths/);
  assert.match(indexHtml, /Pay for Gauntlet/);
  assert.match(indexHtml, /data-copy-echo-contract/);
  assert.match(indexHtml, /data\/echo-utility\.json/);
  assert.doesNotMatch(indexHtml, /id="july-10-sprint"/);
  assert.doesNotMatch(indexHtml, /id="july-8-sprint"/);
  assert.doesNotMatch(indexHtml, /id="today-sprint"/);
});

test('holder dashboard keeps live utility current and exposes proof links', () => {
  assert.doesNotMatch(perksCore, /June sprint/);
  assert.match(perksCore, /Rolling availability/);
  assert.match(perksCore, /basescan\.org\/token\/0xA7F63eB41779925803a3EEC30890742571e63Ba3/);
  assert.match(perksCore, /https:\/\/www\.builtbyecho\.xyz\/gauntlet/);
  assert.match(perksHtml, /href="\/updates"/);
});

test('Gauntlet exposes an inspectable ECHO quote and utility navigation', () => {
  assert.match(gauntletHtml, /Inspect live quote/);
  assert.match(gauntletHtml, /href="\/api\/gauntlet-quote"/);
  assert.match(gauntletHtml, /href="\/perks"/);
  assert.match(gauntletHtml, /href="\/updates"/);
});

test('clean updates route is configured and linked from the homepage', () => {
  assert.ok(vercelConfig.rewrites.some((route) => route.source === '/updates' && route.destination === '/updates.html'));
  assert.match(indexHtml, /href="\/updates"/);
  assert.match(updatesHtml, /<link rel="canonical" href="https:\/\/www\.builtbyecho\.xyz\/updates"/);
});

test('machine-readable ECHO utility feed stays grounded in live surfaces', () => {
  assert.equal(utilityFeed.date, '2026-07-16');
  assert.equal(utilityFeed.network.chainId, 8453);
  assert.equal(utilityFeed.token.address, '0xA7F63eB41779925803a3EEC30890742571e63Ba3');
  assert.equal(utilityFeed.utility.length, 5);
  for (const item of utilityFeed.utility) {
    assert.equal(item.status, 'live');
    assert.ok(item.proofUrl.startsWith('https://'));
  }
  assert.match(utilityFeed.disclaimer, /not a promise of price or returns/i);
});

test('July 16 Pulse pack contains five proof-backed updates and one X-ready post', () => {
  assert.equal(pulseFeed.date, '2026-07-16');
  assert.deepEqual(pulseFeed.builds.map((build) => build.id), updateIds);
  assert.ok(pulseFeed.socialPost.length >= 120);
  assert.ok(pulseFeed.socialPost.length <= 280, `X post is ${pulseFeed.socialPost.length} characters`);
  assert.match(updatesHtml, /id="july-16"/);
  assert.match(updatesHtml, /ECHO utility got easier to verify/);
  for (const id of updateIds) {
    assert.match(updatesHtml, new RegExp(`data-update-id="${id}"`));
  }
  assert.match(updatesHtml, /assets\/social\/echo-pulse-2026-07-16-utility\.png/);
  const png = readFileSync(join(repoRoot, pulseFeed.image));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.length > 20_000);
});
