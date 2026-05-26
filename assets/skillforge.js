(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})(),document.querySelector(`#app`).innerHTML=`
  <nav>
    <div class="nav-inner">
      <a class="brand" href="https://www.builtbyecho.xyz/">
        <span class="brand-mark"><img src="/assets/brand/builtbyecho-logo.png" alt="" /></span>
        <span>BuiltByEcho</span>
      </a>
      <div class="nav-links" aria-label="Primary">
        <a href="https://www.builtbyecho.xyz/products.html">Products</a>
        <a href="https://www.builtbyecho.xyz/skills.html">Skills</a>
        <a href="https://www.builtbyecho.xyz/skillforge.html" class="active">Skillforge</a>
        <a href="#marketplace">Marketplace</a>
      </div>
    </div>
  </nav>

  <main>
    <section class="hero container">
      <p class="eyebrow">Echo Skillforge</p>
      <h1>Tell Hermes to make an Echo Skill.</h1>
      <p class="hero-lede">
        Install the Skillforge skill. When Hermes does something valuable, say
        <code>Make this an Echo Skill.</code> Hermes turns the workflow into a complete
        skill package.
      </p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="https://www.builtbyecho.xyz/skills/echo-skillforge-capture/SKILL.md">Open skill file</a>
        <a class="btn btn-ghost" href="#marketplace">Marketplace path</a>
      </div>
    </section>

    <section id="package" class="container story-grid">
      <article class="panel primary-panel">
        <p class="kicker">What the skill does</p>
        <h2>The agent handles the whole package.</h2>
        <p>
          Echo Skillforge is an agent-side skill maker. Hermes looks at the useful run,
          pulls out the repeatable pattern, removes private details, and returns a finished
          package another agent can install.
        </p>
      </article>

      <aside class="panel command-panel">
        <p class="kicker">User command</p>
        <div class="command-line">Make this an Echo Skill.</div>
        <p>One command turns the useful workflow into something Echo can install, review, and share.</p>
      </aside>
    </section>

    <section class="container package-grid">
      <article class="panel">
        <p class="kicker">Package output</p>
        <h2>What Hermes returns.</h2>
        <ul class="feature-list">
          <li><span class="feature-dot"></span><span>Complete <code>SKILL.md</code></span></li>
          <li><span class="feature-dot"></span><span>Metadata and install path</span></li>
          <li><span class="feature-dot"></span><span>Marketplace listing copy</span></li>
          <li><span class="feature-dot"></span><span>Suggested visibility and pricing</span></li>
          <li><span class="feature-dot"></span><span>Safety notes and review checklist</span></li>
        </ul>
      </article>

      <article class="panel">
        <p class="kicker">Why it matters</p>
        <h2>Useful work becomes reusable software.</h2>
        <p>
          The point is not another prompt template. The point is a repeatable agent workflow
          packaged as an installable ability, ready to share, review, version, and eventually sell.
        </p>
      </article>
    </section>

    <section id="marketplace" class="container marketplace-panel panel">
      <p class="eyebrow">Coming next</p>
      <h2>Echo Marketplace is the publishing layer.</h2>
      <p>
        The next step is listing finished Echo Skills: public or private pages, versions,
        install URLs, pricing, reviews, and paid access through Echo rails.
      </p>
      <div class="market-steps">
        <div><strong>Forge</strong><span>Hermes creates the skill package.</span></div>
        <div><strong>Review</strong><span>Echo checks quality, privacy, and readiness.</span></div>
        <div><strong>List</strong><span>The skill becomes discoverable and installable.</span></div>
      </div>
    </section>

    <section class="bbe-next" aria-label="Next steps">
      <div class="bbe-next__shell">
        <div class="bbe-next__intro">
          <div class="bbe-next__kicker">next step</div>
          <h2>Forge it, then place it.</h2>
          <p>Skillforge turns a useful run into a package. The next routes are the public skills shelf, the product map, and the storage rail for shipped artifacts.</p>
        </div>
        <div class="bbe-next__cards">
          <a class="bbe-next__card" href="https://www.builtbyecho.xyz/skills.html">
            <div><b>publish the file</b><strong>Skills hub</strong><span>Open the public skill library where installable Echo skills are surfaced.</span></div>
            <div class="bbe-next__action">Open Skills</div>
          </a>
          <a class="bbe-next__card" href="https://www.builtbyecho.xyz/products.html">
            <div><b>see the stack</b><strong>Products map</strong><span>Move from workflow packaging into the rest of the BuiltByEcho product surfaces.</span></div>
            <div class="bbe-next__action">Open Products</div>
          </a>
          <a class="bbe-next__card" href="https://www.builtbyecho.xyz/vaultline.html">
            <div><b>store the output</b><strong>Vaultline</strong><span>Persist the packaged artifact, listing copy, or install bundle on the storage rail.</span></div>
            <div class="bbe-next__action">Open Vaultline</div>
          </a>
        </div>
      </div>
    </section>
  </main>
`;
