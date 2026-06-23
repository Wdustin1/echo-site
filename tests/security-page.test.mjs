import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const securityHtml = readFileSync(join(repoRoot, 'security.html'), 'utf8');
const vercelConfig = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'));

test('security page exposes Echo Security and B20 Watchtower as separate tabs', () => {
  assert.match(securityHtml, /role="tablist"[^>]*aria-label="Echo Security surfaces"/);
  assert.match(securityHtml, /data-security-tab="scanner"/);
  assert.match(securityHtml, /data-security-tab="b20-watchtower"/);
  assert.match(securityHtml, /id="scanner-panel"[^>]*role="tabpanel"/);
  assert.match(securityHtml, /id="b20-watchtower-panel"[^>]*role="tabpanel"/);
});

test('B20 Watchtower tab describes the launch feed and first-pass risk model', () => {
  assert.match(securityHtml, /B20 Watchtower/);
  assert.match(securityHtml, /track B20\/Base token launches/i);
  assert.match(securityHtml, /DexScreener/i);
  assert.match(securityHtml, /GoPlus/i);
  assert.match(securityHtml, /Low \/ Medium \/ High \/ Unknown risk/i);
  assert.match(securityHtml, /not an audit/i);
  assert.match(securityHtml, /not financial advice/i);
});

test('security page includes tab switching script for the tabbed surface', () => {
  assert.match(securityHtml, /querySelectorAll\('\[data-security-tab\]'\)/);
  assert.match(securityHtml, /activateSecurityTab/);
});

test('Vercel routes /security to the Echo Security page', () => {
  assert.ok(
    vercelConfig.rewrites.some((rewrite) => rewrite.source === '/security' && rewrite.destination === '/security.html'),
    'expected /security rewrite to /security.html'
  );
});
