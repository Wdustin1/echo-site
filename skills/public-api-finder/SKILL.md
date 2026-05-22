---
name: public-api-finder
description: Find and evaluate free or public APIs for projects, demos, agents, prototypes, integrations, or research. Use the public-api-finder CLI to choose APIs by category, auth requirements, HTTPS or CORS support, and practical fit before writing integration code.
---

# Public API Finder

Use this skill when a task needs a real public API candidate before implementation starts.

## Quick commands

```bash
npx --yes --package=@builtbyecho/public-api-finder -- public-api-finder "weather forecast" --no-auth --https
npx --yes --package=@builtbyecho/public-api-finder -- public-api-finder "crypto prices" --category Cryptocurrency --limit 5
npx --yes --package=@builtbyecho/public-api-finder -- public-api-finder "jobs" --json
npx --yes --package=@builtbyecho/public-api-finder -- public-api-finder "payments" --openapi
npx --yes --package=@builtbyecho/public-api-finder -- public-api-finder "weather forecast" --no-auth --https --check
```

## Output to user

Recommend 2-5 APIs. Include:

- API name and URL
- what it is good for
- auth requirement
- HTTPS or CORS notes
- one caveat to verify: rate limits, pricing, docs freshness, uptime, or terms
- a minimal example request only after checking docs or a live endpoint

## Heuristics

- Prefer HTTPS-enabled APIs.
- Prefer simple auth or no-auth for demos and agent workflows.
- Prefer documented APIs with a narrow match to the task.
- Use `--check` for quick reachability, but still verify docs and terms before committing to an integration.
