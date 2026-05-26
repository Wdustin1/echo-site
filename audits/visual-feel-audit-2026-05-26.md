# BuiltByEcho Visual + Feel Audit

Date: 2026-05-26
Target: https://www.builtbyecho.xyz
Scope: live homepage plus Vaultline, API Finder, Skillforge, agenTOR, Agent Wormhole, Agent Pack, Skills, Vaultline Docs, and Vaultline Skill.

## Verdict

BuiltByEcho still has a strong core identity: dark workshop, cyan/green signal, proof-over-hype, agent-built tools, and a believable "Echo is the developer" story. The site has not lost the brand. It has lost hierarchy.

The current experience feels like a growing product attic: every new tool earned a page, but the navigation and page systems did not absorb those additions into a clear architecture. Visitors can see that a lot has shipped, but they have to work too hard to understand what matters first, what belongs together, and where to go next.

## What Is Working

- The homepage hero is still the best expression of the brand. "Built by Echo. Shipped for builders." is clear, ownable, and visually strong.
- The newer Bricolage Grotesque / DM Sans / IBM Plex Mono system feels more like BuiltByEcho than the older mono-heavy pages.
- The product proof section has the right idea: lead with concrete shipped tools instead of vague platform language.
- Wormhole, Skillforge, Skills, and Agent Pack mostly feel like they belong to the same family.
- The dark grid, green/cyan signal colors, pill nav, glass panels, and compact proof language are recognizable across several pages.
- All sampled internal live pages returned HTTP 200.

## Core Problems

### 1. Navigation Has Become A Dumping Ground

The homepage nav currently exposes: Story, Products, Token, Tools, Skillforge, agenTOR, Wormhole, Agent Pack, Skills, Proof, GitHub.

That is too many first-level choices, and several labels overlap:

- Products vs Tools
- Skillforge / agenTOR / Wormhole / Agent Pack as individual top-level items
- Skills as both a product-like page and a library
- Proof as both a page section and the overall site promise
- Token as a major story beat mixed into product navigation

Result: the site feels harder to move through because the nav is showing the site's growth history instead of a user-facing map.

Recommendation: reduce the primary nav to 5-6 items:

- Story
- Products
- Skills
- Token
- Proof
- GitHub

Then put the individual products inside a Products mega/dropdown or on the Products section/page. Product detail pages can keep local secondary links.

### 2. Page Visual Systems Are Split

There are two visible brand eras:

- Newer system: Bricolage Grotesque + DM Sans + IBM Plex Mono, bright logo lockup, glass panels, cyan/green dark workshop.
- Older system: Space Grotesk + IBM Plex Mono, heavier terminal tone, lower contrast, different nav shape and spacing.

Pages in the older system:

- Vaultline
- API Finder
- agenTOR
- Vaultline Docs
- Vaultline Skill

Pages in the newer system:

- Home
- Skillforge
- Agent Wormhole
- Agent Pack
- Skills

Result: users feel like they are being passed between microsites. Vaultline and API Finder are important products, but they currently feel less like BuiltByEcho than some newer pages.

Recommendation: make the newer homepage system the canonical site shell and migrate all public product pages into it.

### 3. Product Taxonomy Is Blurry

The homepage uses both "products as proof" and "toolchain." The same items appear in multiple forms. This makes the additions feel noisy even when each product is good.

Recommended hierarchy:

- Featured products: Vaultline, Public API Finder, Echo Gate
- Agent handoff tools: Agent Wormhole, Agent Pack, Repo Agent Brief, Trust Log
- Skill/workflow tools: Skillforge, Skills Library, BuiltByEcho Research
- Experimental or deep-cut pages: agenTOR, Vaultline Docs, RevenueCat package

This gives each item a lane instead of making every item compete equally.

### 4. Token Section Changes The Feel Abruptly

The token section is visually polished, but it changes the site's mental model from "agent developer workshop" to "token destination." That may be intentional, but it is currently placed high enough and heavily enough that it competes with the product story.

Also, long-term memory says Dustin wants Echo/BuiltByEcho positioning focused on builder tools and credible shipped work, and that `$ECHO` is abandoned unless explicitly relaunched. The live homepage currently presents `$ECHO` as part of the public build.

Recommendation: confirm current token strategy before any redesign. If token remains, frame it as a secondary ecosystem section after shipped products and proof. If not, remove or archive it quickly because it changes the brand promise.

### 5. Mobile Is Clean But The Menu Hides The Same Problem

The mobile homepage looks good visually. The hero stacks nicely and the large type works. The issue is not mobile layout polish; it is information architecture. Once the menu opens, the same overgrown top-level nav problem remains.

Vaultline mobile has a separate issue: the first viewport is much lower contrast than the homepage, and the hero text reads muted instead of confident. It feels like an old product page that has not been pulled into the new system.

### 6. Brand Voice Is Strong But Repetitive

The site repeats a few concepts heavily:

- receipts
- proof
- shipped
- rails
- handoffs
- agent work

Those are good BuiltByEcho concepts, but repeated too evenly they start to flatten the pages. Some product pages need sharper single-sentence jobs-to-be-done instead of repeating the general Echo philosophy.

Recommendation: keep the homepage philosophical. Make product pages more direct:

- Vaultline: "Store and sell agent artifacts through x402."
- API Finder: "Find real APIs before a coding agent invents one."
- Wormhole: "Send a one-time sealed payload between agents."
- Agent Pack: "Bundle a finished run into a clean delivery crate."
- Echo Gate: "Control local agent tool access before it gets expensive or dangerous."

## Page-by-Page Notes

### Home

Strongest page overall. The hero is memorable, the brand signal is clear, and the first viewport feels like BuiltByEcho.

Main fixes:

- Cut the nav down.
- Decide whether Token deserves a top-level nav slot.
- Avoid showing every product twice.
- Rename or merge "Products" and "Tools" so the homepage does not create two competing catalogs.

### Vaultline

Important product, weaker brand fit. It uses the older Space Grotesk/mono treatment and feels more like a standalone x402 microsite than the flagship BuiltByEcho product.

Main fixes:

- Move to the homepage shell.
- Increase hero contrast, especially mobile.
- Lead with the practical job: paid artifact storage for agents.
- Keep Bankr/x402 proof, but do not let endpoint mechanics dominate the first impression.

### Public API Finder

Clear product concept, but visually in the same older family as Vaultline. The page is readable, but it does not carry the newer BuiltByEcho warmth and brand lockup.

Main fixes:

- Migrate to the canonical shell.
- Put the demo/result surface higher.
- Emphasize the pain: coding agents invent fake APIs when they do not have grounded options.

### Skillforge

Visually aligned with the new brand and probably one of the better-feeling child pages. It reads as part of the same workshop.

Main fixes:

- Add clearer route back to Products/Skills.
- Make the page's relationship to the Skills library obvious.

### Agent Wormhole

Strong visual fit and strong product vibe. "Wormholes, not inboxes." is good. The page has enough attitude without becoming vague.

Main fixes:

- Keep it in the new system.
- Make it one item inside a Handoffs group instead of a permanent top-level nav item.

### Agent Pack

Feels aligned enough, but it reads more like a coming-soon concept than a stable product. The nav is sparse and local, which makes it feel slightly detached.

Main fixes:

- Clarify status: live, prototype, coming soon, or docs-only.
- Use the shared site nav.
- Tie it directly to Vaultline and Wormhole as the "delivery" family.

### Skills

Useful page and visually aligned. It should probably be a top-level destination because it is a clear library/pickup point.

Main fixes:

- Keep top-level.
- Make it the canonical place for skill files, not another product catalog.
- Add grouping/filtering if the skill count keeps growing.

### Vaultline Docs / Vaultline Skill

Useful but visually older and much more utilitarian. That is acceptable for docs, but the header/nav should still feel like BuiltByEcho.

Main fixes:

- Use the shared brand shell.
- Keep docs content dense, but align typography, nav, and footer.
- Make "Back to Vaultline" and "Skills Library" obvious.

### agenTOR

Strong concept but visually older and slightly disconnected from the core BuiltByEcho story. It currently feels like a separate technical demo rather than a product in the workshop.

Main fixes:

- Decide whether agenTOR is a featured product or a deep-cut tool.
- If featured, migrate it into the new shell.
- If not, remove it from global nav and keep it reachable from the product/tool library.

## Recommended Redesign Direction

### Site Shell

Create one shared shell pattern across all public pages:

- Same logo lockup
- Same fonts: Bricolage Grotesque, DM Sans, IBM Plex Mono
- Same nav behavior
- Same footer
- Same section rhythm
- Same button treatments
- Same product-card vocabulary

Even if the site stays static HTML, the CSS should be centralized enough that new pages cannot drift this far again.

### Primary Nav

Recommended global nav:

- Story
- Products
- Skills
- Token
- Proof
- GitHub

If Token is not part of current strategy, replace it with "Docs" or remove it.

Product pages should use a local subnav:

- Overview
- Demo
- Docs
- Skill
- Source

### Homepage Flow

Recommended homepage order:

1. Hero: Built by Echo. Shipped for builders.
2. Operating loop: observe, build, verify, reuse
3. Featured products: Vaultline, API Finder, Echo Gate
4. Tool families: Handoffs, Skills, Research, CI/verification
5. Proof: shipped packages, evals, live rails, source links
6. Token/ecosystem only if active strategy confirms it
7. Footer

### Product Grouping

Use product families instead of flat lists:

- Store and monetize artifacts: Vaultline
- Find and verify sources: Public API Finder, BuiltByEcho Research
- Move work between agents: Agent Wormhole, Agent Pack, Repo Agent Brief
- Control execution: Echo Gate, CI Kit, Trust Log
- Package workflows: Skillforge, Skills Library
- Experimental browser/network tools: agenTOR

## Priority Fix List

### High

- Collapse global nav to a stable IA.
- Migrate Vaultline, API Finder, and agenTOR to the newer visual system.
- Resolve token positioning against current strategy.
- Remove duplicate product/tool cataloging on the homepage.

### Medium

- Create a shared CSS/site shell for all pages.
- Add product families and route each tool into one family.
- Tighten product page hero copy to one concrete job.
- Normalize footer links and active nav states.

### Low

- Add filtering/grouping to Skills.
- Add a small "status" indicator per product: live, docs, npm, prototype.
- Archive or hide one-off application surfaces from global navigation.

## Best Next Move

Do not redesign everything at once. First fix the information architecture and shell:

1. Define the canonical nav.
2. Define product families.
3. Update homepage nav and product sections.
4. Migrate Vaultline/API Finder/agenTOR into the shared shell.
5. Recheck mobile and first-viewport screenshots.

That will recover the original feel without throwing away the useful additions.
