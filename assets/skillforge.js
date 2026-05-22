(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`Hermes finds a repeatable workflow:

Goal:
Turn a messy agent research run into a clean reusable research sprint skill.

Inputs:
- user asks for a market, protocol, repo, or product investigation
- agent has web search, browser, memory, and file tools
- output should include sources, risks, next actions, and a short launch angle

Working pattern:
1. Clarify the investigation target from current context.
2. Search primary sources first, then credible secondary sources.
3. Extract facts, claims, open questions, and timing.
4. Separate verified facts from narrative inferences.
5. Produce a concise brief with source links and a reusable checklist.

Failure modes:
- do not invent source support
- do not expose private memory
- do not treat old information as current without checking live sources

Example use:
"Hermes, run a research sprint on x402 agent payment rails and produce the top wedge for Echo."`,t=new Set([`agent`,`skill`,`workflow`,`the`,`and`,`for`,`with`,`from`,`into`,`source`,`sources`,`that`,`this`,`should`,`when`,`user`,`users`,`output`,`input`]),n=/\/Users\/|\.env\b|api[_-]?key|secret|token\s*[:=]|bearer\s+[a-z0-9._-]+|sk-[a-z0-9]/i,r=[`Echo Skillforge library`,`GitHub skill repo`,`ClawHub`,`paid Echo Gate endpoint`];function i(e){return e.split(/[\s-]+/).filter(Boolean).map(e=>e[0].toUpperCase()+e.slice(1).toLowerCase()).join(` `)}function a(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/(^-|-$)/g,``).slice(0,48)}function o(e){let n=new Map;return e.toLowerCase().match(/[a-z0-9]{4,}/g)?.forEach(e=>{t.has(e)||n.set(e,(n.get(e)||0)+1)}),[...n.entries()].sort((e,t)=>t[1]-e[1]).slice(0,6).map(([e])=>e)}function s(e){let t=e.split(/\r?\n/),n={},r=`notes`;for(let e of t){let t=e.match(/^([A-Za-z][A-Za-z\s]+):\s*$/);if(t){r=t[1].trim().toLowerCase(),n[r]=[];continue}n[r]||=[],e.trim()&&n[r].push(e.trim())}return n}function c(e,t){let n=e.map(e=>e.replace(/^[-*\d.]+\s*/,``).trim()).filter(Boolean).slice(0,8);return n.length?n:t}function l(e){let t=[],n=e.toLowerCase();return(n.includes(`web`)||n.includes(`source`))&&t.push(`web search`),n.includes(`browser`)&&t.push(`browser automation`),(n.includes(`file`)||n.includes(`repo`))&&t.push(`filesystem`),n.includes(`memory`)&&t.push(`memory`),(n.includes(`github`)||n.includes(`repo`))&&t.push(`GitHub`),n.includes(`calendar`)&&t.push(`calendar`),t.length?t:[`local reasoning`,`file context`]}function u({text:e,skillName:t,description:r,tools:i}){return[{label:`Hermes workflow captured`,passed:/hermes/i.test(e)||e.length>160,detail:`The input includes enough source material to forge a reusable pattern.`},{label:`Trigger rules are concrete`,passed:/when|use|goal|input/i.test(e),detail:`The skill tells an agent when to reach for it.`},{label:`Safety boundaries present`,passed:/do not|never|failure|risk|private|secret/i.test(e),detail:`The package includes constraints that prevent sloppy reuse.`},{label:`No obvious private paths`,passed:!n.test(e),detail:`The forged package should be safe to list publicly.`},{label:`Install metadata ready`,passed:!!(t&&r&&i.length),detail:`Marketplace and install surfaces have the basics they need.`}]}function d(t){let n=(t||e).trim(),d=s(n),f=o(n),p=/research/i.test(n)?`research`:f[0]||`research`,m=`Hermes ${i(p)} Sprint`,h=a(m),g=l(n),_=c(d.goal||d.goals||[],[`Turn a repeatable Hermes ${p} workflow into a reusable agent skill.`]),v=c(d[`working pattern`]||d.steps||d.notes||[],[`Read the current request and identify the reusable workflow target.`,`Gather source context and separate facts from assumptions.`,`Run the workflow with explicit checks for quality and privacy.`,`Return a compact brief, examples, and next actions.`]),y=c(d[`failure modes`]||d.risks||[],[`Do not invent source support.`,`Do not expose private memory, secrets, keys, or local-only paths.`,`Do not present stale information as current without verification.`]),b=c(d[`example use`]||d.examples||[],[`Hermes, run this ${p} sprint and give me the reusable brief.`]),x=`A forged Hermes workflow for repeatable ${p} work, packaged by Echo Skillforge as an installable agent skill.`,S=u({text:n,skillName:m,description:x,tools:g}),C=Math.round(S.filter(e=>e.passed).length/S.length*100),w=`---
name: ${h}
description: ${x}
---

# ${m}

Use this skill when a user asks Hermes to repeat the ${p} workflow, turn a messy run into a reusable operating pattern, or produce a concise agent-ready brief from live context.

## What This Skill Does

${_.map(e=>`- ${e}`).join(`
`)}

## Required Context

${g.map(e=>`- ${e}`).join(`
`)}

## Workflow

${v.map((e,t)=>`${t+1}. ${e}`).join(`
`)}

## Safety Boundaries

${y.map(e=>`- ${e}`).join(`
`)}

## Output Contract

- Start with the highest-signal conclusion.
- Mark verified facts separately from useful narrative inferences.
- Include source links when live research is involved.
- End with concrete next actions or a publishable skill improvement.

## Examples

${b.map(e=>`- "${e.replace(/^"|"$/g,``)}"`).join(`
`)}
`;return{input:n,skillName:m,slug:h,description:x,score:C,checks:S,metadata:{name:h,title:m,description:x,version:`0.1.0`,creator:`Hermes`,forgedBy:`Echo Skillforge`,compatibility:[`OpenClaw`,`Codex-style skills`],pricing:{mode:`paid-install-ready`,suggestedInstallPriceUsd:5,suggestedRunPriceUsd:.1,marketplaceFeePercent:15},install:{app:`Run Echo Skillforge to forge bundles into packages.`,captureSkillPath:`skills/echo-skillforge-capture/SKILL.md`,generatedSkillPath:`skills/${h}/SKILL.md`},publishTargets:r,validationScore:C,tools:g},skillMd:w,install:`Install Echo Skillforge Capture:
Copy skills/echo-skillforge-capture/SKILL.md into the agent runtime's skills folder so Hermes can create workflow bundles after useful runs.

Generated skill install path:
skills/${h}/SKILL.md

Marketplace listing:
${m}
${x}

Suggested pricing:
- $5 paid install
- $0.10 hosted execution later through Echo Gate/x402
- 15% marketplace fee

Next publish targets:
${r.map(e=>`- ${e}`).join(`
`)}`,tools:g}}var f=document.querySelector(`#app`),p=d(e),m=null;function h(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`)}function g(e,t){navigator.clipboard?.writeText(e);let n=document.querySelector(`[data-status]`);n&&(n.textContent=`${t} copied`,window.setTimeout(()=>{n.textContent=`${p.score}% ready`},1600))}function _(e){return`
    <li class="check">
      <span class="check-dot ${e.passed?`passed`:``}" aria-hidden="true"></span>
      <span>${e.label}</span>
    </li>
  `}function v(){f.innerHTML=`
    <nav>
      <div class="nav-inner">
        <a class="brand" href="https://www.builtbyecho.xyz/">
          <span class="brand-mark"><img src="/assets/brand/builtbyecho-logo.png" alt="" /></span>
          <span>BuiltByEcho</span>
        </a>
        <div class="nav-links" aria-label="Primary">
          <a href="https://www.builtbyecho.xyz/skills.html">Skills</a>
          <a href="#forge">Forge</a>
          <a href="https://github.com/BuiltByEcho/echo-skillforge" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    </nav>

    <main>
      <section class="hero container">
        <p class="eyebrow">Echo Skillforge</p>
        <h1>Hermes workflows become installable skills.</h1>
        <p class="hero-lede">
          Drop in a reusable Hermes run. Skillforge turns it into a clean
          <code>SKILL.md</code>, install notes, validation, and a marketplace-ready listing.
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#forge">Forge a skill</a>
          <a class="btn btn-ghost" href="#capture">Install capture skill</a>
        </div>
      </section>

      <section id="forge" class="container workspace">
        <div class="panel input-panel">
          <div class="panel-head">
            <div>
              <p class="kicker">Workflow bundle</p>
              <h2>Paste the reusable pattern.</h2>
            </div>
            <span class="status" data-status>${p.score}% ready</span>
          </div>
          <form class="forge-form">
            <label for="workflow">Hermes workflow</label>
            <textarea id="workflow" spellcheck="true">${p.input}</textarea>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Forge package</button>
              <button class="btn btn-ghost" type="button" data-reset>Reset sample</button>
            </div>
          </form>
        </div>

        <aside class="side-stack">
          <div class="panel result-card">
            <p class="kicker">Current package</p>
            <h2>${p.skillName}</h2>
            <p>${p.description}</p>
            ${m?`<div class="forged-banner">Forged package ready. Copy the SKILL.md or install notes below.</div>`:``}
            <div class="meta-list">
              <span>${p.slug}</span>
              <span>$5 install</span>
              <span>$0.10 run</span>
            </div>
          </div>

          <div class="panel checks-panel">
            <p class="kicker">Validation</p>
            <ul class="checks">
              ${p.checks.map(_).join(``)}
            </ul>
          </div>
        </aside>
      </section>

      <section class="container output-grid">
        <article class="panel package-panel">
          <div class="panel-head">
            <div>
              <p class="kicker">${m?`Just forged`:`Generated`}</p>
              <h2>SKILL.md</h2>
            </div>
            <button class="small-btn" type="button" data-copy-skill>Copy SKILL.md</button>
          </div>
          <div class="package-summary">
            <strong>${p.skillName}</strong>
            <span>${p.slug}</span>
          </div>
          <pre><code>${h(p.skillMd)}</code></pre>
        </article>

        <article id="capture" class="panel install-panel">
          <div class="panel-head">
            <div>
              <p class="kicker">Install story</p>
              <h2>Two pieces.</h2>
            </div>
            <button class="small-btn" type="button" data-copy-install>Copy install notes</button>
          </div>
          <p>
            Install the capture skill into Hermes so it can create workflow bundles after useful runs.
            Then use the app to forge those bundles into packages.
          </p>
          <pre>${h(p.install)}</pre>
        </article>
      </section>

      <section class="container roadmap">
        <p class="eyebrow">What ships now</p>
        <div class="roadmap-list">
          <div><strong>Capture</strong><span>Agent-side workflow bundle skill.</span></div>
          <div><strong>Forge</strong><span>Browser package generator.</span></div>
          <div><strong>List</strong><span>Marketplace preview and pricing defaults.</span></div>
        </div>
      </section>
    </main>
  `,document.querySelector(`.forge-form`).addEventListener(`submit`,e=>{e.preventDefault(),p=d(document.querySelector(`#workflow`).value),m=Date.now(),v(),document.querySelector(`.status`).textContent=`forged package ready`,document.querySelector(`.output-grid`).scrollIntoView({behavior:`smooth`,block:`center`})}),document.querySelector(`[data-reset]`).addEventListener(`click`,()=>{p=d(e),m=null,v()}),document.querySelector(`[data-copy-skill]`).addEventListener(`click`,()=>{g(p.skillMd,`SKILL.md`)}),document.querySelector(`[data-copy-install]`).addEventListener(`click`,()=>{g(p.install,`install notes`)})}v();