---
name: echo-shield-token-triage
description: Use when an agent needs to triage a Base ERC-20 token with Echo Shield. Run the quick scan first, summarize score/card/liquidity/holders, and only run deep analysis after explicit user intent.
version: 1.0.0
author: BuiltByEcho
license: MIT
metadata:
  hermes:
    tags: [echo-shield, base, token-safety, agents, quick-scan]
    related_skills: [echo-shield-launch-card]
---

# Echo Shield Token Triage

## Overview

Echo Shield is a public-data scanner for Base ERC-20 contracts. It produces an Echo risk score, source status, token metadata, holder/liquidity signals, and share-card metadata. It does not trade, connect wallets, custody funds, sign transactions, or make buy/sell calls.

The core discipline is **quick first, deep on intent**. A quick scan is suitable for first responses and social/card previews. A deep scan is slower and should only run when the user explicitly asks for deeper review.

## When to Use

Use this skill when:

- A user gives a Base token contract and asks “is this safe?”, “scan this,” “make a card,” or “what does Echo think?”
- A bot needs a concise token-safety reply in Discord, Telegram, Bankr, X, or another agent surface.
- A workflow needs a public launch-hygiene card plus structured JSON.

Do not use this skill for:

- Non-Base contracts unless Echo Shield adds chain support.
- Wallet balance checks, trading, swaps, approvals, or custody.
- Legal, audit, or buy/sell advice.

## Endpoints

Base URL:

```txt
https://shield.builtbyecho.xyz
```

| Intent | Endpoint | Rule |
| --- | --- | --- |
| Quick triage | `GET /api/scan?address=0x...` | Default first call. |
| Full review | `GET /api/deep-analysis?address=0x...` | Only after explicit user intent. |
| PNG card | `GET /api/launch-card?address=0x...&format=png` | Use for images if `card.cardUrl` is not already available. |
| Cohorts | `GET /api/launch-cohorts` | Use for aggregate launch-surface context. |

## Workflow

1. **Validate address.** Confirm the input matches `^0x[a-fA-F0-9]{40}$`. Completion: invalid input is rejected before any network call.
2. **Run quick scan.** Call `/api/scan?address=<address>` once. Completion: response has `ok: true`, `depth: "quick"`, `report.analysisDepth: "quick"`, and usually `card.cardUrl`.
3. **Summarize compactly.** Include token name/symbol, score, risk level, summary, liquidity, holders, launch surface, and the card URL. Completion: user can understand the first-pass result without reading raw JSON.
4. **Gate deep analysis.** Do not call `/api/deep-analysis` unless the user asks for deeper review or presses a dedicated button. Completion: expensive provider calls are not made for passive previews.
5. **Run deep analysis when requested.** Call `/api/deep-analysis?address=<address>`. Completion: response has `depth: "deep"` and `report.analysisDepth: "deep"`.
6. **Explain evidence.** Summarize bucket scores, Honeypot/tax simulation, holder concentration/Echo Map, website checks, source status, and scan-memory changes. Completion: deep summary names both findings and source availability.
7. **Close with caveat.** State that the result is public-data triage, not an audit or trading advice. Completion: no message implies guaranteed safety or a buy/sell call.

## Response Template

```txt
Echo Shield quick scan for SYMBOL — SCORE/100, LEVEL risk.
Summary: ...
Liquidity: ... · Holders: ... · Launch surface: ...
Card: CARD_URL

Public-data triage only — not an audit or buy/sell recommendation.
```

For deep analysis:

```txt
Deeper Echo Analysis:
- Contract: ...
- Honeypot/taxes: ...
- Holders/Echo Map: ...
- Website/source status: ...
- Scan memory: ...
```

## Common Pitfalls

1. **Calling deep automatically.** This wastes provider/API budget. Quick scan first; deep only on intent.
2. **Double-calling card endpoints.** `/api/scan` already returns `card.cardUrl`. Use it before making a separate `/api/launch-card` call.
3. **Dropping the cache-buster.** Preserve `scan=` in card URLs so previews do not show stale score/holder images.
4. **Overstating safety.** Say “no major automated red flags surfaced,” not “safe.”
5. **Ignoring partial sources.** If a source says `partial` or `unavailable`, surface that honestly.
6. **Retry spam.** On `502 provider_failure`, report provider failure and retry later instead of looping.

## Verification Checklist

- [ ] Address validated before request.
- [ ] First request is `/api/scan`, not `/api/deep-analysis`.
- [ ] Quick response has `depth: "quick"` and inline `card.cardUrl`.
- [ ] Deep analysis only runs after explicit intent.
- [ ] Summary includes score/risk, liquidity, holders, launch surface, and caveat.
- [ ] Source status and unavailable providers are not hidden.
- [ ] Card URLs keep `format=png` and `scan=` when provided.
