---
name: echo-skillforge-capture
description: Turn a useful Hermes or agent workflow into a complete Echo Skill package: SKILL.md, metadata, install notes, marketplace listing, and ready/not-ready decision.
---

# Echo Skillforge Maker

Use this skill when the user asks Hermes or another agent to make, package, forge, export, or list a useful workflow as an Echo Skill.

Trigger phrases include:

- "make this an Echo Skill"
- "make that workflow an Echo Skill"
- "forge this skill"
- "package this workflow"
- "turn this into a skill"
- "list this on the Echo marketplace"
- "ship this as a reusable skill"

## Job

Do the whole agent-side workflow. Do not ask the user to manually translate the run into a web form.

Produce a complete **Echo Skill package** from the useful workflow:

1. Decide whether the workflow is reusable.
2. Extract the repeatable pattern from the run.
3. Remove private data, secrets, personal details, raw transcripts, local paths, and irrelevant noise.
4. Write the final `SKILL.md`.
5. Add metadata, install notes, marketplace listing copy, pricing suggestion, and safety notes.
6. If requested, prepare the package for Echo Marketplace listing.

## If Not Reusable

If the workflow is too vague, one-off, unsafe, private, or missing clear repeatable steps, return this instead of forcing a bad skill:

```text
Not ready for Echo Skillforge:
[Brief reason]

What is missing:
- [Missing ingredient]
- [Missing ingredient]

Next run should capture:
- [What Hermes should do or record next time]
```

## Output Contract

When the workflow is reusable, return exactly this package shape:

```text
Echo Skill package:
[Short human-readable package name]

Status:
ready for review

Suggested slug:
[lowercase-kebab-case-slug]

Suggested visibility:
[private | public | paid public listing after review]

Suggested pricing:
[free | $3-$10 install | $10-$50 install | $0.05-$1 hosted run]

Install path:
skills/[slug]/SKILL.md

SKILL.md:
---
name: [slug]
description: [One sentence describing what the skill does and when to use it.]
---

# [Skill Name]

Use this skill when [clear trigger condition].

## What It Does

- [Concrete capability]
- [Concrete capability]

## Required Context

- [Only required tool/context]
- [Only required tool/context]

## Workflow

1. [Repeatable step]
2. [Repeatable step]
3. [Quality check or decision rule]
4. [Output step]

## Safety Boundaries

- [Privacy/security/failure boundary]
- [Privacy/security/failure boundary]

## Output Contract

- [What the skill must return]
- [What the skill must not claim]

## Example

"[User request that should trigger the skill]"

metadata.json:
{
  "name": "[slug]",
  "title": "[Skill Name]",
  "version": "0.1.0",
  "creator": "Hermes",
  "forgedBy": "Echo Skillforge",
  "visibility": "[private | public | paid]",
  "pricing": "[pricing suggestion]",
  "sourceWorkflow": "[short non-private source summary]"
}

Marketplace listing:
Title: [Skill Name]
Summary: [Short marketplace summary]
Use when: [When another agent/user should install it]
Includes:
- [Feature]
- [Feature]
Price: [pricing suggestion]

Install notes:
Save the SKILL.md section to `skills/[slug]/SKILL.md` in the target agent runtime.

Safety notes:
- [Review note]
- [Review note]
```

## Listing Mode

If the user says "list this on the Echo marketplace", produce the package above and add:

```text
Marketplace action:
ready_to_list

Listing checklist:
- SKILL.md complete
- metadata complete
- no private data
- pricing suggested
- human review recommended before public paid listing
```

Do not claim the listing is live unless the marketplace/publishing tool actually confirms it.

## Rules

- The user should only need to say: "Make this an Echo Skill."
- Output the full package. Do not output only a summary or a prompt.
- Prefer concrete workflow steps over generic advice.
- Keep `SKILL.md` concise enough for an agent to load.
- Do not include raw secrets, API keys, private repo paths, local file paths, or private user data.
- Replace sensitive specifics with placeholders such as `[private repo]`, `[API key]`, `[local file]`, or `[customer name]`.
- Do not invent tools, verification, pricing, or marketplace status.
- Mark public/paid listings as "after review" unless the user explicitly wants a private internal skill.

## Example Command

User:

```text
Make this an Echo Skill.
```

Hermes should return the complete Echo Skill package, not a webapp input.
