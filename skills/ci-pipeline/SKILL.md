---
name: ci-pipeline
description: Scaffold and manage CI/CD pipelines for web projects and Node packages. Use when adding tests, linting, GitHub Actions, Playwright E2E, deploy gates, or release checks before launch.
---

# CI Pipeline Skill

Use this skill to set up practical CI for a project before calling it release-ready.

## Core workflow

1. Detect whether the target is a web app or a package.
2. Add a fast gate first: lint, typecheck, and build.
3. Add browser smoke tests for web apps.
4. Add deeper E2E only when the product surface justifies the cost.
5. Keep deploys blocked on the checks that matter.

## Default commands

For web projects:

```bash
npx @builtbyecho/add-ci . --tier 2
```

For generic Node packages and CLIs:

```bash
npx @builtbyecho/add-ci . --framework generic --backend none --tier 2
```

Preview the plan first:

```bash
npx @builtbyecho/add-ci . --tier 2 --dry-run
```

## Gate design

- Tier 1: lint, typecheck, build
- Tier 2: browser smoke tests or package smoke checks
- Tier 3: longer user-flow tests on a schedule or manual trigger

## Rules

- Do not add browser tooling to package-only repos.
- Do not block deploys on long E2E suites unless the team expects that cost.
- Keep secrets in CI or hosting env vars, never in the repo.
- Prefer preview-environment smoke tests for web apps.
- Use `--dry-run` before modifying a repo you do not own.
