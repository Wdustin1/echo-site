(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`Hermes output:
I ran the x402 agent payments research sprint.

What worked:
- Clarified the target before searching.
- Started with primary sources and protocol docs, then checked credible secondary context.
- Pulled out facts, claims, timing, risks, and open questions.
- Separated verified facts from narrative angles so the final brief did not overclaim.
- Ended with a short Echo wedge and next actions.

Reusable pattern:
When someone asks for a market, protocol, repo, or product investigation, Hermes can run the same research sprint and return a concise brief with source links, risks, and a launch angle.

Tools used:
- web search
- browser
- memory
- file context

Avoid next time:
- do not invent source support
- do not expose private memory
- do not treat old information as current without checking live sources

Example future request:
"Hermes, run a research sprint on x402 agent payment rails and produce the top wedge for Echo."`,t=new Set([`agent`,`skill`,`workflow`,`the`,`and`,`for`,`with`,`from`,`into`,`source`,`sources`,`that`,`this`,`should`,`when`,`user`,`users`,`output`,`input`,`hermes`,`output`,`finished`]),n=/\/Users\/|\.env\b|api[_-]?key|secret|token\s*[:=]|bearer\s+[a-z0-9._-]+|sk-[a-z0-9]/i,r=[`Echo Skillforge library`,`GitHub skill repo`,`ClawHub`,`paid Echo Gate endpoint`];function i(e){return e.split(/[\s-]+/).filter(Boolean).map(e=>e[0].toUpperCase()+e.slice(1).toLowerCase()).join(` `)}function a(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,`-`).replace(/(^-|-$)/g,``).slice(0,48)}function o(e){let n=new Map;return e.toLowerCase().match(/[a-z0-9]{4,}/g)?.forEach(e=>{t.has(e)||n.set(e,(n.get(e)||0)+1)}),[...n.entries()].sort((e,t)=>t[1]-e[1]).slice(0,6).map(([e])=>e)}function s(e){let t=e.split(/\r?\n/),n={},r=`notes`;for(let e of t){let t=e.match(/^([A-Za-z][A-Za-z\s]+):\s*$/);if(t){r=t[1].trim().toLowerCase(),n[r]=[];continue}n[r]||=[],e.trim()&&n[r].push(e.trim())}return n}function c(e,t){let n=e.map(e=>e.replace(/^[-*\d.]+\s*/,``).trim()).filter(Boolean).slice(0,8);return n.length?n:t}function l(e,t,n){let r=e.split(/\r?\n/).map(e=>e.trim()).filter(Boolean).filter(e=>t.some(t=>t.test(e))).map(e=>e.replace(/^[-*\d.]+\s*/,``).trim()).slice(0,8);return r.length?r:n}function u(e){let t=[],n=e.toLowerCase();return(n.includes(`web`)||n.includes(`source`))&&t.push(`web search`),n.includes(`browser`)&&t.push(`browser automation`),(n.includes(`file`)||n.includes(`repo`))&&t.push(`filesystem`),n.includes(`memory`)&&t.push(`memory`),(n.includes(`github`)||n.includes(`repo`))&&t.push(`GitHub`),n.includes(`calendar`)&&t.push(`calendar`),t.length?t:[`local reasoning`,`file context`]}function d(e,t){let n=e.toLowerCase();return/research/.test(n)?`research`:/triage/.test(n)?`triage`:/deploy|release/.test(n)?`deployment`:/repo/.test(n)?`repo`:t[0]||`workflow`}function f({text:e,skillName:t,description:r,tools:i}){return[{label:`Hermes output captured`,passed:/hermes/i.test(e)||e.length>160,detail:`The input includes enough Hermes output to extract a reusable pattern.`},{label:`Reusable pattern detected`,passed:/when|reusable|pattern|worked|steps|future request|example/i.test(e),detail:`The skill tells an agent when to reach for it.`},{label:`Safety boundaries present`,passed:/do not|never|failure|risk|private|secret/i.test(e),detail:`The package includes constraints that prevent sloppy reuse.`},{label:`No obvious private paths`,passed:!n.test(e),detail:`The forged package should be safe to list publicly.`},{label:`Install metadata ready`,passed:!!(t&&r&&i.length),detail:`Marketplace and install surfaces have the basics they need.`}]}function p(t){let n=(t||e).trim(),p=s(n),m=d(n,o(n)),h=`Hermes ${i(m)} Sprint`,g=a(h),_=u(n),v=c(p.goal||p.goals||[],[`Package a useful Hermes ${m} output into a reusable agent skill.`]),y=c(p[`working pattern`]||p[`what worked`]||p[`reusable pattern`]||p.steps||p.notes||[],l(n,[/worked/i,/clarif/i,/search/i,/extract/i,/separate/i,/return/i],[`Read the current request and identify the reusable workflow target.`,`Gather source context and separate facts from assumptions.`,`Run the workflow with explicit checks for quality and privacy.`,`Return a compact brief, examples, and next actions.`])),b=c(p[`failure modes`]||p[`avoid next time`]||p.risks||[],[`Do not invent source support.`,`Do not expose private memory, secrets, keys, or local-only paths.`,`Do not present stale information as current without verification.`]),x=c(p[`example use`]||p[`example future request`]||p.examples||[],[`Hermes, run this ${m} sprint and give me the reusable brief.`]),S=`A Hermes ${m} output packaged by Echo Skillforge as a reusable installable agent skill.`,C=f({text:n,skillName:h,description:S,tools:_}),w=Math.round(C.filter(e=>e.passed).length/C.length*100),T=`---
name: ${g}
description: ${S}
---

# ${h}

Use this skill when a user drops a Hermes ${m} output, asks Hermes to repeat the pattern behind that output, or wants the run packaged into a reusable agent ability.

## What This Skill Does

${v.map(e=>`- ${e}`).join(`
`)}

## Required Context

${_.map(e=>`- ${e}`).join(`
`)}

## Workflow

${y.map((e,t)=>`${t+1}. ${e}`).join(`
`)}

## Safety Boundaries

${b.map(e=>`- ${e}`).join(`
`)}

## Output Contract

- Start with the highest-signal conclusion.
- Mark verified facts separately from useful narrative inferences.
- Include source links when live research is involved.
- End with concrete next actions or a publishable skill improvement.

## Examples

${x.map(e=>`- "${e.replace(/^"|"$/g,``)}"`).join(`
`)}
`;return{input:n,skillName:h,slug:g,description:S,score:w,checks:C,metadata:{name:g,title:h,description:S,version:`0.1.0`,creator:`Hermes`,forgedBy:`Echo Skillforge`,compatibility:[`OpenClaw`,`Codex-style skills`],pricing:{mode:`paid-install-ready`,suggestedInstallPriceUsd:5,suggestedRunPriceUsd:.1,marketplaceFeePercent:15},install:{app:`Run Echo Skillforge to extract Hermes output into packages.`,captureSkillPath:`skills/echo-skillforge-capture/SKILL.md`,generatedSkillPath:`skills/${g}/SKILL.md`},publishTargets:r,validationScore:w,tools:_},skillMd:T,install:`Install Echo Skillforge Capture:
Copy skills/echo-skillforge-capture/SKILL.md into the agent runtime's skills folder so Hermes can turn useful output into forgeable source material.

Generated skill install path:
skills/${g}/SKILL.md

Marketplace listing:
${h}
${S}

Suggested pricing:
- $5 paid install
- $0.10 hosted execution later through Echo Gate/x402
- 15% marketplace fee

Next publish targets:
${r.map(e=>`- ${e}`).join(`
`)}`,tools:_}}var m=document.querySelector(`#app`),h=p(e),g=null;function _(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`)}function v(e,t){navigator.clipboard?.writeText(e);let n=document.querySelector(`[data-status]`);n&&(n.textContent=`${t} copied`,window.setTimeout(()=>{n.textContent=`${h.score}% ready`},1600))}function y(e){return`
    <li class="check">
      <span class="check-dot ${e.passed?`passed`:``}" aria-hidden="true"></span>
      <span>${e.label}</span>
    </li>
  `}function b(){m.innerHTML=`
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
          Drop in Hermes output. Skillforge extracts the reusable pattern and turns it into a clean
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
              <p class="kicker">Hermes output</p>
              <h2>Paste the run. We package the skill.</h2>
            </div>
            <span class="status" data-status>${h.score}% ready</span>
          </div>
          <form class="forge-form">
            <label for="workflow">Hermes output, notes, or workflow bundle</label>
            <textarea id="workflow" spellcheck="true">${h.input}</textarea>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Pack into skill</button>
              <button class="btn btn-ghost" type="button" data-reset>Reset sample</button>
            </div>
          </form>
        </div>

        <aside class="side-stack">
          <div class="panel result-card">
            <p class="kicker">Reusable skill</p>
            <h2>${h.skillName}</h2>
            <p>${h.description}</p>
            ${g?`<div class="forged-banner">Forged package ready. Copy the SKILL.md or install notes below.</div>`:``}
            <div class="meta-list">
              <span>${h.slug}</span>
              <span>$5 install</span>
              <span>$0.10 run</span>
            </div>
          </div>

          <div class="panel checks-panel">
            <p class="kicker">Validation</p>
            <ul class="checks">
              ${h.checks.map(y).join(``)}
            </ul>
          </div>
        </aside>
      </section>

      <section class="container output-grid">
        <article class="panel package-panel">
          <div class="panel-head">
            <div>
              <p class="kicker">${g?`Just forged`:`Generated`}</p>
              <h2>SKILL.md</h2>
            </div>
            <button class="small-btn" type="button" data-copy-skill>Copy SKILL.md</button>
          </div>
          <div class="package-summary">
            <strong>${h.skillName}</strong>
            <span>${h.slug}</span>
          </div>
          <pre><code>${_(h.skillMd)}</code></pre>
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
            People can also paste raw Hermes output here; Skillforge extracts the reusable pattern and packages it.
          </p>
          <pre>${_(h.install)}</pre>
        </article>
      </section>

      <section class="container roadmap">
        <p class="eyebrow">What ships now</p>
        <div class="roadmap-list">
          <div><strong>Drop</strong><span>Paste raw Hermes output.</span></div>
          <div><strong>Pack</strong><span>Extract the reusable pattern.</span></div>
          <div><strong>List</strong><span>Marketplace preview and pricing defaults.</span></div>
        </div>
      </section>
    </main>
  `,document.querySelector(`.forge-form`).addEventListener(`submit`,e=>{e.preventDefault(),h=p(document.querySelector(`#workflow`).value),g=Date.now(),b(),document.querySelector(`.status`).textContent=`forged package ready`,document.querySelector(`.output-grid`).scrollIntoView({behavior:`smooth`,block:`center`})}),document.querySelector(`[data-reset]`).addEventListener(`click`,()=>{h=p(e),g=null,b()}),document.querySelector(`[data-copy-skill]`).addEventListener(`click`,()=>{v(h.skillMd,`SKILL.md`)}),document.querySelector(`[data-copy-install]`).addEventListener(`click`,()=>{v(h.install,`install notes`)})}b();