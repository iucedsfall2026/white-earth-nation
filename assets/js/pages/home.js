/* Nation home page: SWOT snapshot counts. Key figures and map come from nation.js. */
(function () {
  const { ROOT, showError } = window.CEDS;
  fetch(ROOT + "content/nation.json", { cache: "no-cache" }).then((r) => r.json()).then((c) => {
    const count = (k) => c.swot.filter((i) => i.cat === k).length;
    document.querySelectorAll("[data-swot-count]").forEach((n) => (n.textContent = count(n.dataset.swotCount)));
    const first = (k) => c.swot.find((i) => i.cat === k);
    document.querySelectorAll("[data-swot-first]").forEach((n) => (n.textContent = first(n.dataset.swotFirst).title));
  }).catch((e) => showError("#swot-snapshot", e));
})();
