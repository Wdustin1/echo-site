---
name: echo-shield-launch-card
description: Use when an agent needs to generate, attach, or share an Echo Shield Base launch-card image. Prefer card.cardUrl from the quick scan and preserve the scan cache-buster.
version: 1.0.0
author: BuiltByEcho
license: MIT
metadata:
  hermes:
    tags: [echo-shield, launch-card, image, discord, social-preview]
    related_skills: [echo-shield-token-triage]
---

# Echo Shield Launch Card

## Overview

Echo Shield launch cards are shareable PNG/SVG/JSON artifacts for Base token launch hygiene. They are designed for Discord, Telegram, X, Bankr-style replies, and agent summaries.

The most important rule is **reuse the quick scan card URL**. `/api/scan` returns `card.cardUrl`; using it avoids an unnecessary extra request and preserves the scan-specific cache-buster.

## When to Use

Use this skill when:

- A user asks for a launch card, image, preview, or shareable scan artifact.
- An agent needs to attach an Echo Shield PNG in a Discord/Telegram reply.
- A workflow needs card JSON metrics for a short launch summary.

Do not use this skill for:

- Deep risk analysis. Use `echo-shield-token-triage` and `/api/deep-analysis` only after explicit intent.
- Trading signals, buy/sell calls, or wallet actions.

## Endpoints

Base URL:

```txt
https://shield.builtbyecho.xyz
```

```txt
GET /api/scan?address=0x...                         # returns card.cardUrl inline
GET /api/launch-card?address=0x...                   # JSON card payload
GET /api/launch-card?address=0x...&format=png        # PNG image
GET /api/launch-card?address=0x...&format=svg        # SVG image
```

## Workflow

1. **Prefer existing card URL.** If a quick scan was just run, use `scanResponse.card.cardUrl`. Completion: no extra card request is needed.
2. **Generate if needed.** If no quick scan exists, call `/api/launch-card?address=<address>&format=png` for a direct image, or omit `format` for JSON. Completion: response is either `image/png` or `{ ok: true, card: ... }`.
3. **Preserve cache-busting.** Do not strip `scan=<timestamp>` from `card.cardUrl`. Completion: Discord/browser/CDN previews point to the current scan image.
4. **Attach with context.** Pair the card with a one-line score/risk summary and the public-data caveat. Completion: image is not sent without context.
5. **Verify binary images.** If downloading, confirm content type is `image/png` and bytes start with the PNG magic header. Completion: broken HTML/error responses are not attached as images.

## Response Template

```txt
Echo Shield launch card for SYMBOL: SCORE/100, LEVEL risk.
PNG: CARD_URL
Public-data triage only — not an audit or buy/sell call.
```

## Common Pitfalls

1. **Re-rendering immediately after quick scan.** Use `card.cardUrl` from `/api/scan` unless you specifically need a different format.
2. **Using stale image URLs.** Always keep the `scan=` query parameter when present.
3. **Assuming image generation means deep scan.** Launch-card endpoints use quick scan data and should not trigger deep provider calls.
4. **Attaching an error page.** Check HTTP status/content type before attaching downloaded images.
5. **Missing alt/context text.** Social surfaces need a compact text summary beside the image.

## Verification Checklist

- [ ] Used `card.cardUrl` from quick scan when available.
- [ ] PNG URL includes `format=png`.
- [ ] `scan=` cache-buster is preserved when present.
- [ ] Direct image response is `200 image/png` with PNG magic bytes.
- [ ] Message includes score/risk summary and public-data caveat.
- [ ] No deep-analysis call was made solely to render the card.
