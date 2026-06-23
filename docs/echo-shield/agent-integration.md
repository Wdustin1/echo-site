# Echo Shield Agent Integration Guide

Echo Shield is a read-only Base token safety scanner for agents, bots, and public UI clients. It does not trade, connect wallets, custody funds, sign transactions, or make buy/sell calls.

## Production base URL

```txt
https://shield.builtbyecho.xyz
```

Use the custom domain above in agent instructions. The older Vercel hostname may work, but the custom domain is the stable integration surface.

## Scan depth model

Echo Shield deliberately separates the fast public scan from the expensive provider pass.

| Use case | Endpoint | Cost profile | Notes |
| --- | --- | --- | --- |
| First response, inline bot reply, page preview | `GET /api/scan?address=0x...` | Quick | Returns `depth: "quick"`, a lightweight `report`, and inline `card` metadata. |
| Share image / social card | `GET /api/launch-card?address=0x...&format=png` | Quick | Uses the quick scanner. Does not record scan memory or run deep-only providers. |
| User explicitly asks for full analysis | `GET /api/deep-analysis?address=0x...` | Deep | Runs Honeypot.is, top-holder reconstruction, website content checks, market history, DexScreener orders, and scan-memory diffs. |
| Cohort/pulse summaries | `GET /api/launch-cohorts` | Cached/DB | Summarizes stored scan memory when the database is configured. |

### Agent rule

Do **not** call `/api/deep-analysis` automatically after every quick scan. Only call it when the user asks for deeper review, presses a “Deeper Echo Analysis” button, or the workflow explicitly needs full evidence.

## Quick scan response contract

```bash
curl "https://shield.builtbyecho.xyz/api/scan?address=0x4ed4e862860bed51a9570b96d89af5e1b0efefed"
```

Expected high-level shape:

```json
{
  "ok": true,
  "depth": "quick",
  "report": {
    "chain": "base",
    "analysisDepth": "quick",
    "token": { "address": "0x...", "name": "...", "symbol": "..." },
    "score": 80,
    "level": "LOW",
    "summary": "...",
    "holders": { "count": 1234 },
    "sources": [
      { "key": "honeypot.is", "status": "partial", "note": "Simulation deferred" }
    ]
  },
  "card": {
    "cardUrl": "https://shield.builtbyecho.xyz/api/launch-card?address=0x...&format=png&scan=...",
    "scanUrl": "https://shield.builtbyecho.xyz/api/scan?address=0x...",
    "metrics": { "liquidityUsd": 12345, "holderCount": 1234 }
  }
}
```

Use `card.cardUrl` for previews. It includes a scan timestamp cache-buster so Discord/browser/CDN previews do not reuse stale card images.

## Deep analysis response contract

```bash
curl "https://shield.builtbyecho.xyz/api/deep-analysis?address=0x4ed4e862860bed51a9570b96d89af5e1b0efefed"
```

Expected high-level shape:

```json
{
  "ok": true,
  "depth": "deep",
  "report": {
    "analysisDepth": "deep",
    "buckets": [{ "label": "Contract", "score": 25, "max": 25, "findings": [] }],
    "security": { "honeypot": { "source": "honeypot.is", "risk": "low" } },
    "holders": { "echoMap": { "notes": [] } },
    "website": { "reachable": true, "riskyPatterns": [] },
    "history": { "enabled": true, "changes": [] }
  }
}
```

Deep scans may take longer and may partially degrade if a public provider is unavailable. Agents should summarize source status honestly instead of implying audit certainty.

## Recommended agent response flow

1. Validate the address locally with `^0x[a-fA-F0-9]{40}$` before calling Echo Shield.
2. Call `/api/scan` once.
3. Return a short quick verdict:
   - token name/symbol
   - score and risk level
   - one-sentence summary
   - liquidity, holder count, launch surface when available
   - card PNG URL
4. Ask or wait for an explicit deeper-analysis action.
5. If triggered, call `/api/deep-analysis` and add:
   - bucket breakdown
   - Honeypot/tax simulation
   - holder concentration / Echo Map notes
   - website/source status
   - scan-memory changes
6. End with the standard caveat: public-data triage, not an audit or trading advice.

## Error handling

| Status | Meaning | Agent behavior |
| --- | --- | --- |
| `400 invalid_address` | Missing or malformed address | Ask for a Base ERC-20 contract address. |
| `422 scan_error` | Address is not a readable ERC-20 or provider could not read required metadata | Say the scanner could not read it as a Base ERC-20. |
| `502 provider_failure` | Public data provider failure | Say the scan failed from public providers and suggest retrying later. |
| Image endpoint `200 image/png` | Valid PNG card | Attach or preview the image. |

## Copy guidance

Use language like:

```txt
Echo Shield quick scan: LOW risk, 80/100. Primary risk is holder concentration. Liquidity: $X. Holders: Y. Launch surface: Z. Public-data triage only — not an audit or trade call.
```

Avoid language like:

```txt
This token is safe.
Buy/sell now.
Echo guarantees this contract.
```

## Verification checklist for agent integrations

- [ ] Quick scan calls `/api/scan` once and uses `card.cardUrl` from that response.
- [ ] Launch-card image previews use `format=png` and preserve the `scan=` cache-buster when present.
- [ ] Deep analysis is only called after explicit user action.
- [ ] Agent surfaces `sources` and partial/unavailable provider status honestly.
- [ ] Agent includes the public-data / not-financial-advice caveat.
- [ ] Invalid-address and provider-failure errors are handled without retry loops that spam providers.
