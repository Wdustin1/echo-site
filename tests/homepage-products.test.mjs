import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');
const productsHtml = readFileSync(join(repoRoot, 'products.html'), 'utf8');

test('homepage exposes a BuiltByEcho weekly build board', () => {
  assert.match(indexHtml, /id="recent-builds"/);
  assert.match(indexHtml, /Shipping this week/);
  assert.match(indexHtml, /Echo Shield/);
  assert.match(indexHtml, /Echo Infer/);
  assert.match(indexHtml, /Agent Email Layer/);
  assert.match(indexHtml, /Deal Sniper/);
  assert.match(indexHtml, /Echo Social/);
  assert.doesNotMatch(indexHtml, /MonstaJam/);
  assert.doesNotMatch(indexHtml, /Rallyn/);
});

test('products page promotes current BuiltByEcho product lanes without client builds', () => {
  assert.match(productsHtml, /id="current-builds"/);
  assert.match(productsHtml, /Echo Shield/);
  assert.match(productsHtml, /Echo Infer/);
  assert.match(productsHtml, /Agent Email Layer/);
  assert.match(productsHtml, /safe programmable inboxes/i);
  assert.doesNotMatch(productsHtml, /MonstaJam/);
  assert.doesNotMatch(productsHtml, /Rallyn/);
});
