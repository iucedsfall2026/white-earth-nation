/* SWOT analysis page: quadrant overview plus filterable item cards. */
(function () {
  const { SITE, ROOT, esc, showError } = window.CEDS;
  const CATS = [
    { key: "Strength", plural: "Strengths", icon: "S", note: "Internal assets the evidence supports" },
    { key: "Weakness", plural: "Weaknesses", icon: "W", note: "Conditions in the data that hold things back" },
    { key: "Opportunity", plural: "Opportunities", icon: "O", note: "Openings the region or policy offers" },
    { key: "Threat", plural: "Threats", icon: "T", note: "External risks to plan around" },
  ];
  let state = { type: "All", cat: "All" };

  fetch(ROOT + "content/nation.json", { cache: "no-cache" }).then((r) => r.json()).then((c) => {
    const items = c.swot;
    const quad = document.querySelector("#swot-quad");
    quad.innerHTML = CATS.map((k) => {
      const list = items.filter((i) => i.cat === k.key);
      const q = list.filter((i) => i.type === "Quantitative").length;
      return `<button type="button" class="quad quad-${k.key.toLowerCase()}" data-cat="${k.key}" aria-pressed="false">
        <span class="quad-letter" aria-hidden="true">${k.icon}</span>
        <span class="quad-count">${list.length}</span>
        <span class="quad-name">${k.plural}</span>
        <span class="quad-note">${k.note}</span>
        <span class="quad-mix">${q} quantitative, ${list.length - q} qualitative</span>
      </button>`;
    }).join("");
    document.querySelector("#swot-total").textContent = `${items.length} items: ${items.filter((i) => i.type === "Quantitative").length} quantitative and ${items.filter((i) => i.type === "Qualitative").length} qualitative.`;

    quad.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.cat = state.cat === b.dataset.cat ? "All" : b.dataset.cat;
      render();
      document.querySelector("#swot-list").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    document.querySelector("#swot-type").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.type = b.dataset.type; render();
    });
    document.querySelector("#swot-cat").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.cat = b.dataset.cat; render();
    });

    function render() {
      quad.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat)));
      document.querySelectorAll("#swot-type button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.type === state.type)));
      document.querySelectorAll("#swot-cat button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat)));
      const shown = items.filter((i) => (state.type === "All" || i.type === state.type) && (state.cat === "All" || i.cat === state.cat));
      document.querySelector("#swot-count").textContent = `Showing ${shown.length} of ${items.length}`;
      document.querySelector("#swot-list").innerHTML = CATS.filter((k) => shown.some((i) => i.cat === k.key)).map((k) => `
        <section class="swot-group swot-${k.key.toLowerCase()}" aria-label="${k.plural}">
          <h3>${k.plural}</h3>
          <div class="swot-cards">${shown.filter((i) => i.cat === k.key).map(card).join("")}</div>
        </section>`).join("") || "<p>No items match these filters.</p>";
    }
    function card(i) {
      const src = (i.sources || []).map((s) => c.sources[s]).filter(Boolean)
        .map((s) => `<a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a>`).join("; ");
      return `<article class="swot-card">
        <header><span class="swot-id">${esc(i.id)}</span><span class="tag ${i.type === "Quantitative" ? "reference" : "qual"}">${esc(i.type)}</span></header>
        <h4>${esc(i.title)}</h4>
        <p class="ev">${esc(i.evidence)}</p>
        <p class="lim"><strong>Limit:</strong> ${esc(i.limit)}</p>
        ${src ? `<p class="src">Source: ${src}</p>` : `<p class="src">Source: project data, see <a href="${ROOT}sources/">Sources</a>.</p>`}
      </article>`;
    }
    render();
  }).catch((e) => showError("#swot-list", e));
})();
