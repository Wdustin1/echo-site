import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');
const productsHtml = readFileSync(join(repoRoot, 'products.html'), 'utf8');
const securityHtml = readFileSync(join(repoRoot, 'security.html'), 'utf8');
const updatesHtml = readFileSync(join(repoRoot, 'updates.html'), 'utf8');
const pulseFeed = JSON.parse(readFileSync(join(repoRoot, 'data', 'echo-pulse-2026-07-08.json'), 'utf8'));

test('homepage exposes the July 8 shipping board', () => {
  assert.match(indexHtml, /id="july-8-sprint"/);
  assert.match(indexHtml, /data-update-id="pulse-update-system"/);
  assert.match(indexHtml, /data-update-id="windows-desktop-release"/);
  assert.match(indexHtml, /data-update-id="shield-reply-kit"/);
  assert.match(indexHtml, /data-update-id="product-hotlinks"/);
  assert.match(indexHtml, /data-update-id="npm-dev-tooling"/);
  assert.match(indexHtml, /updates.html#july-8/);
});

test('updates page gives social manager a copy-ready July 8 pack', () => {
  assert.match(updatesHtml, /id="july-8"/);
  assert.match(updatesHtml, /Social manager handoff/);
  assert.match(updatesHtml, /Copy-ready posts/);
  assert.match(updatesHtml, /Echo Pulse update system/);
  assert.match(updatesHtml, /Windows desktop beta release/);
  assert.match(updatesHtml, /Shield reply kit/);
  assert.match(updatesHtml, /No fake roadmap language/);
});

test('daily Echo Pulse JSON feed has five real builds and social copy', () => {
  assert.equal(pulseFeed.date, '2026-07-08');
  assert.equal(pulseFeed.builds.length, 5);
  assert.deepEqual(pulseFeed.builds.map((build) => build.id), [
    'pulse-update-system',
    'windows-desktop-release',
    'shield-reply-kit',
    'product-hotlinks',
    'npm-dev-tooling',
  ]);
  for (const build of pulseFeed.builds) {
    assert.equal(build.status, 'shipped');
    assert.ok(build.socialPost.length > 120, `${build.id} social post should be handoff-ready`);
    assert.ok(build.proofUrl, `${build.id} should include a proof URL`);
  }
});

test('security page includes the Echo Shield community reply kit', () => {
  assert.match(securityHtml, /id="community-reply-kit"/);
  assert.match(securityHtml, /Community reply kit/);
  assert.match(securityHtml, /card first/);
  assert.match(securityHtml, /Never say safe/);
  assert.match(securityHtml, /Open PNG card/);
});

test('products page exposes product hotlinks for social follow-up', () => {
  assert.match(productsHtml, /id="product-hotlinks"/);
  assert.match(productsHtml, /Social follow-up hotlinks/);
  assert.match(productsHtml, /Echo Shield scanner/);
  assert.match(productsHtml, /npm developer lane/);
  assert.match(productsHtml, /Echo Pulse pack/);
  assert.match(productsHtml, /Windows desktop beta/);
});
