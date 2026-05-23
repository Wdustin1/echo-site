---
name: echo-skillforge-capture
description: Produce paste-ready Skillforge drops from useful Hermes or agent runs so Echo Skillforge can turn them into installable skills.
---

# Echo Skillforge Capture

Use this skill when the user asks Hermes to package, capture, export, summarize, or prepare a useful run for Echo Skillforge.

Also use it when a Hermes run produced a repeatable pattern and the user says something like:

- "package this for Echo"
- "give Echo the output"
- "make this reusable"
- "turn this into a skill"
- "prep this for Skillforge"
- "give me the thing to paste into the webapp"

## Job

Create a **Skillforge drop**: a clean, paste-ready block of text that Echo Skillforge can ingest.

The drop is not a transcript. It is the reusable pattern behind the run.

## Output Only This Shape

Return exactly this structure:

```text
Skill idea:
[Short name for the future skill]

Hermes output:
[One short paragraph explaining what Hermes did and what useful result came out of the run.]

What worked:
- [Repeatable step or decision that helped]
- [Repeatable step or decision that helped]
- [Quality check, heuristic, or ordering rule that should be reused]

Reusable pattern:
[Explain when another user or agent should use this pattern and what the future skill should produce.]

Tools used:
- [Only tools/context actually needed]
- [Only tools/context actually needed]

Avoid next time:
- [Failure mode, privacy rule, or thing that caused waste]
- [Failure mode, privacy rule, or thing that caused waste]

Example future request:
"[A user request that should trigger the future skill]"

Suggested visibility:
[private | public | paid public listing after review]

Suggested pricing:
[free | $3-$10 install | $10-$50 install | $0.05-$1 hosted run]

Why reusable:
[One sentence explaining why this deserves to become a skill.]
```

## Capture Rules

- Preserve the reusable operating pattern, not the whole transcript.
- Do not include raw private messages, personal data, secrets, tokens, API keys, local paths, or private file names.
- Replace sensitive details with placeholders like `[private repo]`, `[API key]`, `[local file]`, or `[customer name]`.
- Keep the drop concise enough to paste into a web form.
- Include only tools that are required to repeat the workflow.
- Write in plain operational language. No marketing copy.
- If the run was not reusable, say that directly and explain what is missing instead of forcing a skill.

## Reusability Test

Before returning a Skillforge drop, check:

- Would another agent benefit from repeating this pattern?
- Are the steps clear enough to become instructions?
- Are the failure modes known?
- Is the example future request obvious?
- Can this be shared without leaking private context?

If the answer is mostly no, return:

```text
Not ready for Skillforge:
[Brief reason]

What is missing:
- [Missing ingredient]
- [Missing ingredient]

Next run should capture:
- [What Hermes should do or record next time]
```

## Pricing Heuristic

Use these defaults:

- Simple prompt/workflow skill: `$3-$10 install`
- Specialized operational skill: `$10-$50 install`
- Hosted execution skill with live tools or paid APIs: `$0.05-$1 hosted run`
- Private/internal team workflow: `private`
- Weak or one-off workflow: `free` or `not ready`

## Example Drop

```text
Skill idea:
Hermes Research Sprint

Hermes output:
Hermes ran a research sprint on x402 agent payment rails and produced a concise Echo wedge with sources, risks, and next actions.

What worked:
- Clarified the target before searching.
- Started with primary sources, then checked credible secondary context.
- Pulled out facts, claims, timing, risks, and open questions.
- Separated verified facts from narrative angles.
- Ended with a short wedge and next actions.

Reusable pattern:
Use this when a user asks Hermes to investigate a market, protocol, repo, or product and return a concise brief with source discipline and launch framing.

Tools used:
- web search
- browser
- project context

Avoid next time:
- do not invent source support
- do not expose private memory
- do not treat stale information as current without checking live sources

Example future request:
"Hermes, run a research sprint on x402 agent payment rails and produce the top wedge for Echo."

Suggested visibility:
paid public listing after review

Suggested pricing:
$5 install or $0.10 hosted run

Why reusable:
Many agents need a repeatable way to turn messy research into source-backed launch briefs.
```
