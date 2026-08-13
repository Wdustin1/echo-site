import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(repoRoot, path), 'utf8');
const vercelConfig = JSON.parse(read('vercel.json'));
const utilityFeed = JSON.parse(read('data/echo-utility.json'));

const removedFiles = [
  'perks.html',
  'assets/echo-perks.js',
  'assets/echo-perks-core.js',
  'assets/echo-perks.css',
  'api/perks.js',
  'api/perk-claims.js',
  'api/_perks.js',
  'api/perks-retired.js',
];

const activeTextFiles = [
  ...readdirSync(repoRoot, { recursive: true })
    .filter((path) => ['.html', '.js', '.mjs', '.json', '.py'].includes(extname(path)))
    .filter((path) => !String(path).startsWith('.git')),
].map(String);

const bannedProgramTerms = /Echo Perks|MiroShark|holder claims?|holder dashboard|partner credits?|11 active claim paths|Holder Request Pass|dual-holder|echo-perks:v1/i;

test('Echo Perks code, routes, and legacy handler are completely removed', () => {
  for (const file of removedFiles) {
    assert.equal(existsSync(join(repoRoot, file)), false, `${file} should be removed`);
  }
  assert.equal(vercelConfig.rewrites.some((route) => route.source === '/perks' || route.source === '/perks.html'), false);
});

test('site source contains no Echo Perks, MiroShark, holder-claim, or partner-credit program text', () => {
  for (const file of activeTextFiles) {
    if (file.replaceAll('\\', '/') === 'tests/echo-perks-retirement.test.mjs') continue;
    assert.doesNotMatch(read(file), bannedProgramTerms, `${file} still contains retired program language`);
  }
});

test('current ECHO utility feed contains only live product and contract paths', () => {
  assert.deepEqual(utilityFeed.utility.map((item) => item.id), [
    'gauntlet-payment',
    'api-finder-payment',
    'contract-verification',
  ]);
  assert.doesNotMatch(JSON.stringify(utilityFeed), bannedProgramTerms);
});
