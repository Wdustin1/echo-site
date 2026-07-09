import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const securityHtml = readFileSync(join(repoRoot, 'security.html'), 'utf8');
const vercelConfig = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8'));
const agentDocs = readFileSync(join(repoRoot, 'docs/echo-shield/agent-integration.md'), 'utf8');
const tokenTriageSkill = readFileSync(join(repoRoot, 'docs/echo-shield/agent-skills/echo-shield-token-triage/SKILL.md'), 'utf8');
const launchCardSkill = readFileSync(join(repoRoot, 'docs/echo-shield/agent-skills/echo-shield-launch-card/SKILL.md'), 'utf8');

test('security page exposes scanner tab and active B20 Watchtower tab', () => {
  assert.match(securityHtml, /role="tablist"[^>]*aria-label="Echo Security surfaces"/);
  assert.match(securityHtml, /data-security-tab="scanner"/);
  assert.match(securityHtml, /id="scanner-panel"[^>]*role="tabpanel"/);
  assert.match(securityHtml, /id="b20-watchtower-tab"[^>]*data-security-tab="b20-watchtower"/);
  assert.match(securityHtml, /id="b20-watchtower-panel"[^>]*role="tabpanel"/);
  assert.match(securityHtml, /B20 Watchtower/);
  assert.match(securityHtml, /B20 makes launches faster\. Echo Shield makes the launch controls readable\./);
  assert.match(securityHtml, /data-b20-control="supply-cap"/);
  assert.match(securityHtml, /data-b20-example="BCAT"/);
  assert.doesNotMatch(securityHtml, /B20 Watchtower\s*<span class="soon">Coming soon<\/span>/);
  assert.doesNotMatch(securityHtml, /id="b20-watchtower-tab"[^>]*disabled/);
});

test('security page includes tab switching script for the tabbed surface', () => {
  assert.match(securityHtml, /querySelectorAll\('\[data-security-tab\]'\)/);
  assert.match(securityHtml, /activateSecurityTab/);
});

test('security page ships a live B20 Launch Radar dashboard wired to Echo Shield API', () => {
  assert.match(securityHtml, /data-b20-dashboard="launch-radar"/);
  assert.match(securityHtml, /Every new B20 launch, decoded by Echo/);
  assert.match(securityHtml, /id="b20-radar-tracked"/);
  assert.match(securityHtml, /id="b20-radar-clean"/);
  assert.match(securityHtml, /id="b20-radar-changed"/);
  assert.match(securityHtml, /id="b20-launches"/);
  assert.match(securityHtml, /id="b20-radar-status"/);
  assert.match(securityHtml, /fetch\(`\$\{API\}\/api\/b20-launches\?limit=4`\)/);
  assert.match(securityHtml, /renderB20LaunchRadar/);
  assert.match(securityHtml, /Factory-confirmed/);
  assert.match(securityHtml, /Config diff monitor next/);
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

test('security page documents quick-first agent API usage', () => {
  assert.match(securityHtml, /Agents start here/);
  assert.match(securityHtml, /Plug Echo Shield into your agent without wasting deep-scan calls/);
  assert.match(securityHtml, /href="\/docs\/echo-shield\/agent-integration\.md"/);
  assert.match(securityHtml, /href="\/docs\/echo-shield\/agent-skills\/echo-shield-token-triage\/SKILL\.md"/);
  assert.match(securityHtml, /href="\/docs\/echo-shield\/agent-skills\/echo-shield-launch-card\/SKILL\.md"/);
  assert.match(securityHtml, /Quick \+ deep reports/);
  assert.match(securityHtml, /api\/deep-analysis\?address=0x/);
  assert.match(securityHtml, /Agent skills/);
  assert.match(securityHtml, /docs\/agent-skills\/echo-shield-token-triage\/SKILL\.md/);
});

test('security page includes a post-ready risk handoff surface', () => {
  assert.match(securityHtml, /data-update-id="shield-risk-handoff"/);
  assert.match(securityHtml, /Post-ready risk handoff/);
  assert.match(securityHtml, /score, level, card URL, top warnings, and caveats/);
  assert.match(securityHtml, /No buy\/sell calls/);
});

test('public Echo Shield docs and skill files are committed for linked agent entrypoints', () => {
  assert.match(agentDocs, /# Echo Shield Agent Integration Guide/);
  assert.match(agentDocs, /Do \*\*not\*\* call `\/api\/deep-analysis` automatically/);
  assert.match(tokenTriageSkill, /^---\r?\nname: echo-shield-token-triage/);
  assert.match(launchCardSkill, /^---\r?\nname: echo-shield-launch-card/);
});
