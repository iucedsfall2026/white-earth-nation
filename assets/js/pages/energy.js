/* Energy and infrastructure for one Nation's reference counties. */
(function () {
  const { SITE, NATIONS, fmt, acs, loadData, esc, showError } = window.CEDS;
  const C = window.CEDSCharts;
  const nation = SITE.nation;
  const N = NATIONS[nation];
  const ST = nation === "Cherokee" ? "OK" : "MN";

  const FUELS = {
    NG: { short: "natural gas", label: "Natural gas", color: "#6f88a3" },
    SUB: { short: "coal", label: "Coal (subbituminous)", color: "#3f4a4c" },
    WAT: { short: "hydroelectric", label: "Hydroelectric", color: "#3d93b8" },
    DFO: { short: "fuel oil", label: "Fuel oil", color: "#b0703c" },
    MSW: { short: "municipal solid waste", label: "Municipal solid waste", color: "#8d7d5a" },
    SUN: { short: "solar", label: "Solar", color: "#d9a92b" },
  };
  const STATUS = {
    P: "Planned; regulatory approvals not yet started", L: "Regulatory approvals pending",
    T: "Approvals received; construction not started", U: "Under construction, 50% or less complete",
    V: "Under construction, more than 50% complete", TS: "Construction complete; not yet operating",
  };

  loadData().then((data) => { capacity(data); proposed(data); hazard(data); broadband(data); land(data); })
    .catch((e) => showError("#main", e));

  function capacity(data) {
    const E = data.energy.capacity.filter((r) => r.state === ST);
    const Y = d3.max(data.energy.capacity, (r) => r.year);
    document.querySelectorAll(".ey").forEach((n) => (n.textContent = Y));
    const latest = E.filter((r) => r.year === Y);
    const total = d3.sum(latest, (r) => r.mw);
    const byFuel = d3.rollups(latest, (rs) => d3.sum(rs, (r) => r.mw), (r) => r.fuel).sort((a, b) => b[1] - a[1]);
    const counties = new Set(latest.map((r) => r.county)).size;
    const fuelText = byFuel.map(([f, mw]) => `${FUELS[f] ? FUELS[f].short : f} (${fmt.pct(mw / total, 0)})`).join(", ");
    document.querySelector("#capacity-intro").textContent =
      `In ${Y}, operable generators in the ${N.counties} reference counties had ${fmt.mw(total)} of nameplate capacity in ${counties} of the ${N.counties} counties. By fuel: ${fuelText}.`;
    const keys = Object.keys(FUELS).filter((k) => latest.some((r) => r.fuel === k)).map((k) => ({ key: k, ...FUELS[k] }));
    C.legend("#fuel-legend", keys);
    const rows = d3.rollups(latest, (rs) => Object.fromEntries(rs.map((r) => [r.fuel, r.mw])), (r) => r.county)
      .map(([label, values]) => ({ label, values })).sort((a, b) => d3.sum(Object.values(b.values)) - d3.sum(Object.values(a.values)));
    C.stackedH("#capacity-chart", { keys, rows, format: fmt.mw, axisFormat: d3.format("~s"), labelWidth: 110, rowHeight: 32, label: `Operable capacity by county and fuel, ${Y}` });
    const years = [...new Set(E.map((r) => r.year))].sort();
    const series = keys.map((k) => ({ name: k.label, color: k.color, values: years.map((y) => ({ x: y, y: d3.sum(E.filter((r) => r.year === y && r.fuel === k.key), (r) => r.mw) })) }));
    C.legend("#fuel-trend-legend", series.map((s) => ({ label: s.name, color: s.color })));
    C.line("#capacity-trend", {
      series, band: false, zero: true, height: 280, yFormat: (v) => d3.format("~s")(v) + " MW", marginLeft: 62,
      label: `Operable capacity by fuel, ${years[0]} to ${years[years.length - 1]}`,
      tip: (d, s) => `<strong>${s.name}</strong><br>${d.x}: ${fmt.mw(d.y)}`,
    });
  }

  function proposed(data) {
    const P = data.energy.proposed.filter((p) => p.state === ST).sort((a, b) => b.mw - a.mw);
    const yr = data.energy.proposed_year;
    document.querySelectorAll(".py").forEach((n) => (n.textContent = yr));
    const body = document.querySelector("#proposed-table tbody");
    if (!P.length) {
      document.querySelector("#proposed-intro").textContent = `The ${yr} EIA-860 filing lists no proposed generators in the ${N.counties} reference counties.`;
      body.innerHTML = `<tr><td colspan="6">No proposed generators reported for these counties in ${yr}.</td></tr>`;
      return;
    }
    const solar = P.filter((p) => p.fuel === "SUN");
    const inside = P.filter((p) => p.tribal_geography);
    document.querySelector("#proposed-intro").textContent =
      `The ${yr} filing lists ${P.length} proposed generators totaling ${fmt.mw(d3.sum(P, (p) => p.mw))}. ${solar.length} are solar (${fmt.mw(d3.sum(solar, (p) => p.mw))}), and ${inside.length} sit inside the ${N.geoShort}.`;
    body.innerHTML = P.map((p) => `<tr><td>${esc(p.plant)}</td><td>${esc(p.county)}</td><td>${FUELS[p.fuel] ? FUELS[p.fuel].label : esc(p.fuel)}</td>
      <td class="num">${fmt.mw(p.mw)}</td><td>${STATUS[p.status] || esc(p.status)}</td><td>${p.tribal_geography ? "Yes" : "No"}</td></tr>`).join("");
  }

  function hazard(data) {
    const H = data.hazard.filter((h) => h.nation === nation).sort((a, b) => b.risk_score - a.risk_score);
    document.querySelectorAll(".nri").forEach((n) => (n.textContent = H[0].version + " release"));
    C.barH("#hazard-chart", {
      label: "FEMA National Risk Index score by county", labelWidth: 100, rowHeight: 24, domain: [0, 100],
      format: (v) => v.toFixed(1), axisFormat: d3.format("d"),
      data: H.map((h) => ({ label: h.county, value: h.risk_score, color: N.color,
        tip: `<strong>${h.county} County</strong><br>Risk score ${h.risk_score.toFixed(1)} (${h.risk_rating})<br>Expected annual loss ${fmt.usdShort(h.eal_usd)}` })),
    });
    document.querySelector("#hazard-table tbody").innerHTML = H.map((h) =>
      `<tr><td>${h.county}</td><td>${h.risk_rating}</td><td class="num">${fmt.usdShort(h.eal_usd)}</td><td>${h.sovi_rating}</td><td>${h.resilience_rating}</td></tr>`).join("");
  }

  function broadband(data) {
    const T = data.broadband.tribal.filter((t) => t.nation === nation);
    const Y = d3.max(data.acs, (r) => r.year);
    document.querySelectorAll(".fcc").forEach((n) => (n.textContent = new Date(T[0].as_of + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })));
    const sub = acs(data, nation, "broadband", Y);
    const fig = (v, label, note) => `<div><div class="value">${v}</div><div class="label">${label}</div><div class="moe">${note}</div></div>`;
    document.querySelector("#bb-figures").innerHTML = T.map((t) => fig(fmt.pct(t.coverage), `${esc(t.name)}: locations with 100/20 Mbps available`, `${fmt.int(t.units)} residential locations`)).join("") +
      fig(fmt.pct(sub.value), "Households subscribing to internet", fmt.pp(sub.moe) + " (90% MOE), ACS " + sub.period.replace("-", "–"));
    const Cn = data.broadband.county.filter((c) => c.nation === nation).sort((a, b) => a.coverage - b.coverage);
    C.barH("#bb-chart", {
      label: "Share of residential locations with 100/20 Mbps available, by county", labelWidth: 100, rowHeight: 24,
      domain: [0, 1], format: (v) => fmt.pct(v), axisFormat: (v) => (v * 100).toFixed(0) + "%",
      data: Cn.map((c) => ({ label: c.name.replace(/ County.*$/, ""), value: c.coverage, color: N.color, tip: `<strong>${c.name}</strong><br>${fmt.pct(c.coverage)} of ${fmt.int(c.units)} residential locations` })),
    });
  }

  function land(data) {
    const L = data.landcover.filter((r) => r.nation === nation);
    const Y = d3.max(L, (r) => r.year);
    document.querySelectorAll(".ly").forEach((n) => (n.textContent = Y));
    const keys = [
      { key: "forest", label: "Forest", color: "#3f6b45" }, { key: "agriculture", label: "Agriculture", color: "#cdb76a" },
      { key: "wetlands", label: "Wetlands", color: "#6fa59a" }, { key: "water", label: "Open water", color: "#4f8fb8" },
      { key: "developed", label: "Developed", color: "#8f6f73" }, { key: "other_land", label: "Other", color: "#b9bbaa" },
    ];
    C.legend("#land-legend", keys);
    C.stackedH("#land-chart", {
      keys, normalize: true, labelWidth: 140, rowHeight: 44, format: (v) => fmt.num(v, 0) + " km²", label: `Land cover share, ${Y}`,
      rows: L.filter((r) => r.year === Y).map((r) => ({ label: r.geography.replace("White Earth ", "").replace("Off-Reservation", "Off-reservation"), values: Object.fromEntries(keys.map((k) => [k.key, r[k.key]])) })),
    });
    document.querySelector("#roads-table tbody").innerHTML = data.roads.filter((r) => r.nation === nation).map((r) =>
      `<tr><td>${esc(r.area)}</td><td class="num">${fmt.int(r.area_km2)} km²</td><td class="num">${fmt.int(r.road_km)} km</td><td class="num">${r.road_density.toFixed(2)} km per km²</td></tr>`).join("");
  }
})();
