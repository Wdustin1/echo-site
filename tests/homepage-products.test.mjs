import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');
const productsHtml = readFileSync(join(repoRoot, 'products.html'), 'utf8');

test('homepage leads with four user-operable products instead of a weekly product grab bag', () => {
  const useNow = indexHtml.match(/<section id="recent-builds">([\s\S]*?)<\/section>/)?.[1] ?? '';
  assert.match(useNow, /Use now/);
  assert.match(useNow, /Echo Shield/);
  assert.match(useNow, /Vaultline/);
  assert.match(useNow, /Public API Finder/);
  assert.match(useNow, /Echo Gauntlet/);
  assert.doesNotMatch(useNow, /Echo Infer/);
  assert.doesNotMatch(useNow, /Agent Email Layer/);
  assert.doesNotMatch(useNow, /Deal Sniper/);
  assert.doesNotMatch(useNow, /Echo Social/);
  assert.doesNotMatch(indexHtml, /MonstaJam/);
  assert.doesNotMatch(indexHtml, /Rallyn/);
});

test('homepage exposes six current ECHO utility paths instead of stale sprint boards', () => {
  assert.match(indexHtml, /id="echo-utility-now"/);
  assert.match(indexHtml, /data-utility-id="holder-perks"/);
  assert.match(indexHtml, /data-utility-id="gauntlet-payment"/);
  assert.match(indexHtml, /data-utility-id="api-finder-payment"/);
  assert.match(indexHtml, /data-utility-id="holder-request-pass"/);
  assert.match(indexHtml, /data-utility-id="contract-verification"/);
  assert.match(indexHtml, /data-utility-id="utility-feed"/);
  assert.doesNotMatch(indexHtml, /id="today-sprint"/);
});

test('products page separates user-operable surfaces from developer tooling and experiments', () => {
  const useNow = productsHtml.match(/<section id="current-builds">([\s\S]*?)<\/section>/)?.[1] ?? '';
  assert.match(useNow, /Use now/);
  assert.match(useNow, /Echo Shield/);
  assert.match(useNow, /Vaultline/);
  assert.match(useNow, /Public API Finder/);
  assert.match(useNow, /Echo Gauntlet/);
  assert.doesNotMatch(useNow, /Echo Infer/);
  assert.doesNotMatch(useNow, /Agent Email Layer/);
  assert.doesNotMatch(useNow, /Deal Sniper/);
  assert.doesNotMatch(useNow, /Echo Social/);
  assert.doesNotMatch(productsHtml, /MonstaJam/);
  assert.doesNotMatch(productsHtml, /Rallyn/);
});

test('products page exposes npm and developer tooling as a visible product lane', () => {
  assert.match(productsHtml, /id="npm-dev-tools"/);
  assert.match(productsHtml, /npm package lane/);
  assert.match(productsHtml, /@builtbyecho\/agent-brief/);
  assert.match(productsHtml, /agent-runlog/);
  assert.match(productsHtml, /public-api-finder/);
  assert.match(productsHtml, /@builtbyecho\/git-digest/);
  assert.match(productsHtml, /@builtbyecho\/agent-storage-sdk/);
});
