---
name: echo-skillforge-capture
description: Capture useful Hermes or agent runs as workflow bundles that Echo Skillforge can turn into installable skills.
---

# Echo Skillforge Capture

Use this skill when a user asks to turn an agent run, Hermes workflow, repeated process, prompt chain, tool sequence, or learned behavior into a reusable skill.

Also use this skill at the end of a successful Hermes run when the workflow looks reusable and the user wants Skillforge-style packaging.

## What To Capture

Create a workflow bundle with these sections:

```text
Goal:
What did the agent learn to do?

Inputs:
- What does the user provide?
- What tools, files, APIs, context, or permissions are required?

Working pattern:
1. What steps produced the result?
2. What order mattered?
3. What checks made the output useful?
4. What decisions or heuristics should be reused?

Failure modes:
- What went wrong?
- What should future agents avoid?
- What private data, secrets, local paths, or unsafe actions must not leak?

Example use:
"User-facing example request that should trigger the future skill."
```

## Capture Rules

- Preserve the reusable operating pattern, not the whole transcript.
- Separate verified facts from useful assumptions.
- Keep private context out of the bundle unless the user explicitly wants a private skill.
- Replace raw secrets, local credentials, tokens, and private file paths with placeholders.
- Include tool requirements only when they are actually needed.
- Keep the bundle concise enough that another agent can understand the workflow without reading the original run.

## Output Contract

Return:

1. A short skill idea name.
2. The workflow bundle in the template above.
3. Suggested visibility: private, public, or paid.
4. Suggested pricing if it is marketplace-worthy.
5. One sentence explaining why this is reusable.

## Marketplace Heuristic

Recommend a paid listing only when the workflow saves time, reduces risk, requires specialized knowledge, or can be reused by agents outside the original project.

Default pricing suggestions:

- Simple installable prompt/workflow skill: $3-$10.
- Specialized operational skill: $10-$50.
- Hosted execution skill: $0.05-$1 per run depending on tool/model/API cost.

## Example

```text
Skill idea:
Hermes Research Sprint

Workflow bundle:
Goal:
Turn a messy research run into a concise launch brief.

Inputs:
- research target
- web search
- source links
- relevant agent/project context

Working pattern:
1. Search primary sources first.
2. Extract facts, claims, timing, and open questions.
3. Separate verified facts from narrative inferences.
4. Identify the strongest wedge.
5. Return sources, risks, and next actions.

Failure modes:
- do not invent source support
- do not expose private memory
- do not treat stale info as current

Example use:
"Hermes, run a research sprint on x402 agent payment rails and give me the Echo wedge."

Suggested visibility:
Paid public listing after review.

Suggested pricing:
$5 install or $0.10 hosted run.

Why reusable:
Many agents need repeatable research briefs with source discipline and launch framing.
```
