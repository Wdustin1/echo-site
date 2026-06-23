import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const securityHtml = readFileSync(join(repoRoot, 'security.html'), 'utf8');
const vercelConfig = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'));

test('security page exposes scanner tab and disabled B20 Watchtower coming-soon tab', () => {
  assert.match(securityHtml, /role="tablist"[^>]*aria-label="Echo Security surfaces"/);
  assert.match(securityHtml, /data-security-tab="scanner"/);
  assert.match(securityHtml, /id="scanner-panel"[^>]*role="tabpanel"/);
  assert.match(securityHtml, /id="b20-watchtower-tab"[^>]*aria-disabled="true"[^>]*disabled/);
  assert.match(securityHtml, /B20 Watchtower\s*<span class="soon">Coming soon<\/span>/);
  assert.doesNotMatch(securityHtml, /id="b20-watchtower-tab"[^>]*data-security-tab="b20-watchtower"/);
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

test('security page keeps the first scan lightweight and lazy-loads deeper analysis', () => {
  assert.match(securityHtml, /id="deep-button"[^>]*>Deeper Echo Analysis<\/button>/);
  assert.match(securityHtml, /fetch\(`\$\{API\}\/api\/scan\?address=/);
  assert.match(securityHtml, /fetch\(`\$\{API\}\/api\/deep-analysis\?address=/);
  assert.doesNotMatch(securityHtml, /Promise\.all\(\[\s*fetch\(`\$\{API\}\/api\/scan[\s\S]*api\/launch-card/);
});
