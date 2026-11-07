/* CEDS Evidence Atlas — guided navigator.
   A rule-based helper: it matches what people type to sections of the site
   and answers from text written here. It never generates numbers, so it
   cannot misstate the data. Edit INTENTS to change answers or add topics. */
(function () {
  const { ROOT, el, loadConfig } = window.CEDS;
  const link = (label, href) => ({ label, href: ROOT + href });

  const SITE = window.CEDS.SITE;
  const NAME = SITE.name;
  const INTENTS = [
    { keys: ["history", "about", "treaty", "timeline", "government", "council", "chief", "culture", "background", "who are"],
      text: `The About page covers ${NAME}'s government, land and history, with a timeline drawn from cited sources.`,
      links: [link("About the Nation", "about/")] },
    { keys: ["swot", "strength", "weakness", "opportunit", "threat", "analysis"],
      text: `The SWOT page lists every strength, weakness, opportunity and threat, each tagged quantitative or qualitative with its evidence and limits.`,
      links: [link("SWOT analysis", "swot/")] },
    { keys: ["population", "income", "poverty", "education", "degree", "community", "trend", "people"],
      text: "Community conditions over time, with 90% margins of error, are on the Community page.",
      links: [link("Community", "community/")] },
    { keys: ["housing", "vacan", "seasonal", "rent", "burden", "afford", "home", "rehab"],
      text: "Vacancy, cost burden and the age of homes are on the Housing page.",
      links: [link("Housing", "housing/")] },
    { keys: ["job", "work", "employ", "unemploy", "labor", "labour", "commut", "industry", "business", "construction", "econom"],
      text: "Industries, jobs, unemployment and commuting for the reference counties are on the Economy page.",
      links: [link("Economy", "economy/")] },
    { keys: ["energy", "battery", "bess", "power", "electric", "generator", "solar", "gas", "hazard", "risk", "broadband", "internet", "land cover", "road"],
      text: "Generation capacity, proposed projects, hazard risk, broadband, land cover and roads are on the Energy page.",
      links: [link("Energy & land", "energy/")] },
    { keys: ["scenario", "calculator", "what if", "break-even", "breakeven", "discount", "cost"],
      text: "The Scenario page has an interactive calculator showing how cost assumptions change the answer.",
      links: [link("Scenario", "scenario/")] },
    { keys: ["source", "data", "method", "census", "acs", "margin", "error", "moe", "cite", "citation", "fund", "grant"],
      text: "Every data source and history citation is on the Sources page, along with what the data cannot show.",
      links: [link("Sources", "sources/")] },
    { keys: ["contact", "email", "reach", "question", "professor", "instructor", "sponsor", "team", "who made", "who built", "student"],
      text: "You can reach the project team through the form on the Contact page.",
      links: [link("Contact", "team/")], contact: true },
    { keys: ["other nation", "cherokee", "white earth", "compare", "dashboard", "hub", "both"],
      text: "Both Nations are covered on the main CEDS dashboard, which links to each Nation's site.",
      links: [{ label: "All dashboards", href: SITE.hub }] },
    { keys: ["hello", "hi", "hey", "help", "start", "what is this"],
      text: `This site presents public data and history for ${NAME}, built by an Indiana University student team. Try a topic such as history, SWOT, housing, jobs or energy.`,
      links: [link("Home", ""), link("Sources", "sources/")] },
  ];

  const CHIPS = ["History", "SWOT", "Housing", "Energy", "Contact the team"];

  function match(text) {
    const q = text.toLowerCase();
    let best = null, bestScore = 0;
    for (const intent of INTENTS) {
      const score = intent.keys.reduce((s, k) => {
        const hit = k.length <= 4 ? new RegExp("\\b" + k).test(q) : q.includes(k);
        return s + (hit ? k.length : 0);
      }, 0);
      if (score > bestScore) { best = intent; bestScore = score; }
    }
    return best;
  }

  function build(config) {
    const email = config && config.contact && config.contact.email;
    const btn = el("button", { class: "nav-assist-btn", type: "button", "aria-expanded": "false", "aria-controls": "nav-assist" }, "Find something");
    const log = el("div", { class: "nav-log", role: "log", "aria-live": "polite" });
    const input = el("input", { type: "text", placeholder: "Try history, SWOT or housing", "aria-label": "What are you looking for?", maxlength: "200" });
    const chips = el("div", { class: "chips" }, CHIPS.map((c) => el("button", { type: "button", onclick: () => ask(c) }, c)));
    const panel = el("section", { class: "nav-assist", id: "nav-assist", "aria-label": "Site guide" },
      el("header", {}, el("h2", {}, "Site guide"), el("button", { type: "button", "aria-label": "Close guide", onclick: () => toggle(false) }, "×")),
      log, chips,
      el("form", { onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) { ask(input.value.trim()); input.value = ""; } } },
        input, el("button", { type: "submit" }, "Go")));

    function say(who, text, links) {
      const m = el("div", { class: `msg ${who}` }, el("p", {}, text));
      if (links && links.length) m.append(el("div", { class: "links" }, links.map((l) => el("a", { href: l.href }, l.label))));
      log.append(m);
      log.scrollTop = log.scrollHeight;
    }
    function ask(text) {
      say("user", text);
      const hit = match(text);
      if (!hit) {
        say("bot", "I could not match that to a section. Try a topic such as history, SWOT, housing, jobs, energy or sources, or contact the team.",
          [link("Home", ""), link("Contact", "team/")]);
        return;
      }
      const links = hit.links.slice();
      let text2 = hit.text;
      if (hit.contact && email) text2 += ` You can also email ${email}.`;
      say("bot", text2, links);
    }
    function toggle(open) {
      panel.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        if (!log.childElementCount) say("bot", "I can point you to the right part of the site. What are you looking for?");
        input.focus();
      } else btn.focus();
    }
    btn.addEventListener("click", () => toggle(!panel.classList.contains("open")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && panel.classList.contains("open")) toggle(false); });
    document.body.append(panel, btn);
  }

  loadConfig().then(build).catch(() => build(null));
})();
