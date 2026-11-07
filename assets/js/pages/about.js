/* About the Nation: facts and an illustrated timeline from content/nation.json. */
(function () {
  const { ROOT, esc, showError } = window.CEDS;
  fetch(ROOT + "content/nation.json", { cache: "no-cache" }).then((r) => r.json()).then((c) => {
    const a = c.about;
    const link = (key) => { const s = c.sources[key]; return s ? `<a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a>` : ""; };
    document.querySelector("#about-lead").textContent = a.lead;
    document.querySelector("#about-facts").innerHTML = a.facts.map((f) => `
      <article class="fact"><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p><p class="source">Source: ${link(f.source)}</p></article>`).join("");
    document.querySelector("#timeline").innerHTML = a.timeline.map((t, i) => `
      <li class="tl-item" style="--i:${i}"><span class="tl-year">${esc(t.year)}</span><p>${esc(t.text)}</p></li>`).join("");
    document.querySelector("#timeline-source").innerHTML = `Source: ${link(a.timeline_source)}. Events are summarized from the source; read it for full context.`;
  }).catch((e) => showError("#about-facts", e));
})();
