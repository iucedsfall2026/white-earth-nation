/* Sources: background sources from content, reference geography from data. */
(function () {
  const { SITE, ROOT, NATIONS, loadData, esc, showError } = window.CEDS;
  fetch(ROOT + "content/nation.json", { cache: "no-cache" }).then((r) => r.json()).then((c) => {
    document.querySelector("#bg-sources").innerHTML = Object.values(c.sources).map((s) =>
      `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join("");
  }).catch((e) => showError("#bg-sources", e));
  loadData().then((data) => {
    const rows = data.crosswalk.filter((r) => r.nation === SITE.nation).sort((a, b) => b.type.localeCompare(a.type) || a.name.localeCompare(b.name));
    document.querySelector("#xwalk tbody").innerHTML = rows.map((r) =>
      `<tr><td>${esc(r.name)}${r.type === "Reference county" ? " County" : ""}</td><td>${esc(r.type)}</td><td>${esc(r.relationship)}</td></tr>`).join("");
    document.querySelector("#data-stamp").textContent = `Current data: ${data.meta.pipeline_release}, exported ${data.meta.generated_utc.replace("T", " ").replace("Z", " UTC")}. Fingerprint ${data.meta.sha256}.`;
  }).catch((e) => showError("#xwalk", e));
})();
