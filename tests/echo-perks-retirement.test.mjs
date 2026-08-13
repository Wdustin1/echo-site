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
const utilityFeed = JSON.parse(read('data/echo-utility.json'));
const retiredApi = read('api/perks-retired.js');

const activeHtml = [
  'index.html',
  'echo.html',
  'products.html',
  'security.html',
  'gauntlet.html',
  'api-finder.html',
  'skills.html',
  'updates.html',
  'thesis.html',
  'vaultline.html',
  'vaultline-docs.html',
  'vaultline-skill.html',
  'agent-pack.html',
  'agent-wormhole.html',
  'agentor.html',
].map(read).join('\n');

const retiredFiles = [
  'perks.html',
  'assets/echo-perks.js',
  'assets/echo-perks-core.js',
  'assets/echo-perks.css',
  'api/perks.js',
  'api/perk-claims.js',
  'api/_perks.js',
];

const retiredUtilityIds = ['holder-perks', 'holder-request-pass', 'dual-holder-credits'];

test('Echo Perks pages, APIs, and active navigation are removed', () => {
  for (const file of retiredFiles) {
    assert.equal(existsSync(join(repoRoot, file)), false, `${file} should be removed`);
  }
  assert.doesNotMatch(activeHtml, /href="\/perks(?:\.html)?"/);
  assert.doesNotMatch(activeHtml, /Echo Perks|11 active claim paths|Holder Request Pass|Stacked credits/i);
});

test('legacy Perks URLs return an explicit gone response', () => {
  assert.ok(vercelConfig.rewrites.some((route) => route.source === '/perks' && route.destination === '/api/perks-retired'));
  assert.ok(vercelConfig.rewrites.some((route) => route.source === '/perks.html' && route.destination === '/api/perks-retired'));
  assert.match(retiredApi, /statusCode = 410/);
  assert.match(retiredApi, /new claims are closed/i);
});

test('current ECHO utility surfaces contain only live non-Perks paths', () => {
  assert.match(indexHtml, /Four current utility paths/);
  assert.match(echoHtml, /<b>4<\/b><span>Live paths<\/span>/);
  assert.equal(utilityFeed.utility.length, 3);
  assert.deepEqual(utilityFeed.utility.map((item) => item.id), [
    'gauntlet-payment',
    'api-finder-payment',
    'contract-verification',
  ]);
  for (const id of retiredUtilityIds) {
    assert.equal(utilityFeed.utility.some((item) => item.id === id), false);
  }
});
