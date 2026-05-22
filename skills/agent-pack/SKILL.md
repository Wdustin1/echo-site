---
name: agent-pack
description: Use Agent Pack to package completed agent work into portable delivery bundles with manifests, receipts, file inventories, artifacts, command checks, archives, and optional Vaultline upload. Use for agent handoffs, release proof, review bundles, and inspectable work delivery.
---

# Agent Pack

Agent Pack turns an agent run into a portable delivery bundle: manifest, receipt, files, artifacts, checks, and archive.

Use this skill when a task involves:

- packaging completed agent work
- creating a handoff bundle for a human or another agent
- attaching artifacts/screenshots/logs to a delivery
- preserving command/check output
- preparing a Vaultline-ready bundle
- proving what an agent changed before a release or review

## Quick Commands

Run without installing:

```bash
npx @builtbyecho/agent-pack . --task "agent finished the release candidate"
```

From a local checkout:

```bash
agent-pack . --task "agent fixed the API route" --run-checks --out .agent-pack
agent-pack . --task "release bundle" --artifact archive/screenshots/release.png --run-checks
agent-pack . --task "vaultline delivery" --run-checks --vaultline --yes
```

## Output

```text
.agent-pack/
  manifest.json
  receipt.json
  summary.md
  files.txt
  checks.txt
  files/
  artifacts/
  checks/
  bundle.tgz
```

## Safety

- Inspect `manifest.json` and copied files before public upload.
- Keep `.env`, keys, credentials, and private local paths out of bundles.
- Use `--no-file-copies` for metadata-only handoffs.
- Use `--max-files` and `--max-file-bytes` to control bundle size.
- Only use `--vaultline` when paid upload through Bankr/Vaultline is intended.

## Verification

Run the verification commands from the package root:

```bash
npm test
npm run smoke
npm pack --json --dry-run
```
