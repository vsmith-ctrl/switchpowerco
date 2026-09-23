/* Switch — power flow, app-style. Hand-built SVG, no library, no requests.
 *
 * Dark-surface palette, validated all-pairs on black:
 *   solar #7E9C18 · battery #3987e5 · grid #d55181
 * Every node carries its own kW and label, so identity never rides on colour.
 */
(function () {
  "use strict";
  var svg = document.getElementById("flow-svg");
  if (!svg) return;

  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(n);
    return n;
  }
  function text(str, attrs, parent) { var t = el("text", attrs, parent); t.textContent = str; return t; }

  /* ---------- scenarios, computed from model.js ----------
     11am is the hour the battery is charging hardest with only a sliver
     exported; 7pm is the priciest hour of the day. Grid-out cases keep the
     same physics but export becomes curtailment and any import is lost. */
  var M = window.SwitchModel;
  var HOURS = { day: 11, evening: 19 };

  // anything under 0.075 kW is noise at this scale and would print as "0.1"
  function z(v) { return v < 0.075 ? 0 : v; }

  function scenario(hour, gridOn) {
    var r0 = M.day[hour];
    var r = { load: r0.load, solar: z(r0.solar), direct: z(r0.direct), charge: z(r0.charge),
              export: z(r0.export), discharge: z(r0.discharge), grid: z(r0.grid) };
    var s = { s2h: r.direct, s2b: r.charge, b2h: r.discharge,
              s2g: gridOn ? r.export : 0, g2h: gridOn ? r.grid : 0,
              home: r.load, batt: r.charge > 0 ? r.charge : r.discharge,
              // state of charge at the start of the hour, so "charging" pairs with room to charge
              pct: Math.round(r0.socBefore / M.CAP * 100), gridOn: gridOn,
              battMode: r.charge > 0.05 ? "charging" : r.discharge > 0.05 ? "powering home" : "idle",
              curtailed: gridOn ? 0 : r.export };
    s.solar = r.solar - s.curtailed;             // panels throttle what has nowhere to go
    s.gridMode = !gridOn ? "out" : r.export > 0.05 ? "selling" : r.grid > 0.05 ? "buying" : "idle";
    return s;
  }
  function kw(v) { return v.toFixed(1).replace(/\.0$/, "") + " kW"; }
  function hr(h) { return (h % 12 || 12) + (h < 12 ? "am" : "pm"); }
  function statusFor(hour, s) {
    var t = hr(hour), parts = [];
    if (s.s2h > 0.05) parts.push(kw(s.s2h) + " runs the house");
    if (s.s2b > 0.05) parts.push(kw(s.s2b) + " charges the battery");
    if (s.s2g > 0.05) parts.push(kw(s.s2g) + " is sold to the grid");
    if (s.gridOn) {
      if (s.solar > 0.05) return t + ": " + kw(s.solar) + " from the roof. " + parts.join(", ") + ".";
      return t + ", the most expensive hour of the day. The battery delivers " + kw(s.b2h) + " and nothing is bought.";
    }
    if (s.solar > 0.05) return t + ", grid out. The house does not notice: " + parts.join(", ") +
      (s.curtailed > 0.05 ? ". The " + kw(s.curtailed) + " that had nowhere to go is simply not made." : ".");
    return t + ", grid out. Neighbours without a battery are in the dark. This house is running on " + kw(s.b2h) + " the panels banked earlier.";
  }

  /* ---------- geometry: a cross, lines meeting at a junction ----------
     Two layouts. A phone gets a portrait box with bigger nodes, since the
     whole diagram renders at about 300px wide there. Everything below is
     derived from N and R, so both layouts share one drawing routine. */
  function layout() {
    var w = svg.parentNode.getBoundingClientRect().width || 720;
    return w < 560
      ? { W: 440, H: 620, R: 52, N: { solar: [220, 92], grid: [72, 310], home: [368, 310], battery: [220, 528] } }
      : { W: 720, H: 600, R: 46, N: { solar: [360, 96], grid: [118, 300], home: [602, 300], battery: [360, 504] } };
  }

  var G, N, R, J, flows = {}, flowLabs = {}, cut, gridBus, nodes = {}, battFill;

  function build() {
    G = layout(); N = G.N; R = G.R; J = [N.solar[0], N.grid[1]];
    svg.setAttribute("viewBox", "0 0 " + G.W + " " + G.H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    flows = {}; nodes = {};

    var sx = N.solar[0], gy = N.grid[1];
    var top = N.solar[1] + R, bot = N.battery[1] - R, left = N.grid[0] + R, right = N.home[0] - R;

    // the bus, drawn once
    var bus = el("g", { class: "bus" });
    el("path", { d: "M" + sx + " " + top + " V" + bot, class: "bus__line" }, bus);
    gridBus = el("path", { d: "M" + left + " " + gy + " H" + right, class: "bus__line", "data-bus": "grid" }, bus);

    // composed flow paths, each in its own direction. Shared segments are
    // offset by a few units so two streams sit side by side instead of on
    // top of each other.
    var P = {
      s2h: "M" + (sx + 3) + " " + top + " V" + (gy - 3) + " H" + right,
      s2b: "M" + (sx - 3) + " " + top + " V" + bot,
      s2g: "M" + (sx + 3) + " " + top + " V" + (gy + 3) + " H" + left,
      b2h: "M" + (sx + 3) + " " + bot + " V" + (gy + 3) + " H" + right,
      g2h: "M" + left + " " + gy + " H" + right
    };
    var SERIES = { s2h: "solar", s2b: "solar", s2g: "solar", b2h: "battery", g2h: "grid" };
    var gF = el("g", { class: "flows" });
    Object.keys(P).forEach(function (k, i) {
      flows[k] = el("path", { d: P[k], class: "flow", "data-series": SERIES[k],
                              style: "animation-delay:" + (-i * 0.35) + "s" }, gF);
    });

    // one kW label per stream, on the segment that belongs to it alone
    var midX = (J[0] + right) / 2, midL = (left + J[0]) / 2, midY = (J[1] + bot) / 2, topY = (top + J[1]) / 2;
    var LAB = {
      s2h: [midX, gy - 14, "middle"],            // junction -> home (horizontal, above)
      b2h: [midX, gy - 14, "middle"],            // same segment, never active at the same time
      s2b: [sx + 16, midY, "start"],             // junction -> battery (vertical, right side)
      s2g: [midL, gy - 14, "middle"],            // junction -> grid (horizontal, above)
      g2h: [midL, gy - 14, "middle"]
    };
    flowLabs = {};
    Object.keys(LAB).forEach(function (k) {
      flowLabs[k] = text("", { x: LAB[k][0], y: LAB[k][1], class: "flow-kw", "text-anchor": LAB[k][2] }, gF);
    });
    void topY;

    // severed mark, midway between the grid node and the junction
    var cx = (left + J[0]) / 2;
    cut = el("g", { class: "cut", opacity: 0 });
    el("line", { x1: cx - 10, y1: gy - 12, x2: cx + 10, y2: gy + 12, class: "cut__x" }, cut);
    el("line", { x1: cx + 10, y1: gy - 12, x2: cx - 10, y2: gy + 12, class: "cut__x" }, cut);

    function node(id, label, series, labelAbove, draw) {
      var g = el("g", { class: "node", "data-node": id, "data-series": series,
                        transform: "translate(" + N[id][0] + " " + N[id][1] + ")" });
      el("circle", { r: R + 10, class: "node__halo" }, g);
      el("circle", { r: R, class: "node__ring" }, g);
      var ic = el("g", { class: "node__icon", transform: "translate(0 -13)" }, g);
      draw(ic);
      var val = text("", { y: 22, class: "node__val", "text-anchor": "middle" }, g);
      // Solar's label goes above the node: the stream runs straight down
      // through the space beneath it.
      var lab = text(label, { y: labelAbove ? -(R + 16) : R + 26, class: "node__lab", "text-anchor": "middle" }, g);
      nodes[id] = { g: g, val: val, lab: lab };
    }

    node("solar", "Solar", "solar", true, function (g) {
      el("circle", { r: 6, class: "ic" }, g);
      for (var a = 0; a < 360; a += 45) {
        var r = a * Math.PI / 180;
        el("line", { x1: Math.cos(r) * 10, y1: Math.sin(r) * 10, x2: Math.cos(r) * 14, y2: Math.sin(r) * 14, class: "ic" }, g);
      }
    });
    node("grid", "Grid", "grid", false, function (g) {
      el("path", { d: "M-9 14 L-3 -14 H3 L9 14 M-12 -5 H12 M-9 4 H9 M-6 14 L6 -5 M6 14 L-6 -5", class: "ic" }, g);
    });
    node("home", "Home", "home", false, function (g) {
      el("path", { d: "M-14 1 L0 -12 L14 1 M-10 -2 V13 H10 V-2", class: "ic" }, g);
      el("rect", { x: -3.5, y: 4, width: 7, height: 9, class: "ic ic--win" }, g);
    });
    node("battery", "Battery", "battery", false, function (g) {
      el("rect", { x: -9, y: -14, width: 18, height: 28, rx: 3, class: "ic" }, g);
      el("rect", { x: -3, y: -18, width: 6, height: 4, rx: 1, class: "ic ic--cap" }, g);
      battFill = el("rect", { x: -6, y: -11, width: 12, height: 22, rx: 1.5, class: "ic--fill" }, g);
    });
  }

  build();

  /* ---------- state ---------- */
  var timeKey = "day", gridOn = true;
  var status = document.getElementById("flow-status");
  var gridCtl = document.getElementById("grid-ctl");
  var gridSw = document.getElementById("grid-switch");
  var gridState = document.getElementById("grid-state");

  function render() {
    var hour = HOURS[timeKey], s = scenario(hour, gridOn);

    Object.keys(flows).forEach(function (k) {
      var on = s[k] > 0.05;
      flows[k].classList.toggle("is-on", on);
      flowLabs[k].textContent = on ? kw(s[k]) : "";
    });

    nodes.solar.val.textContent = kw(s.solar);
    nodes.home.val.textContent = kw(s.home);
    nodes.battery.val.textContent = kw(s.batt) + " \u00b7 " + s.pct + "%";
    nodes.battery.lab.textContent = "Battery \u00b7 " + s.battMode;
    nodes.grid.val.textContent = !gridOn ? "Out" : s.s2g > 0.05 ? kw(s.s2g) : s.g2h > 0.05 ? kw(s.g2h) : "0 kW";
    nodes.grid.lab.textContent = "Grid \u00b7 " + s.gridMode;

    var hgt = Math.round(22 * s.pct / 100);
    battFill.setAttribute("height", hgt);
    battFill.setAttribute("y", 11 - hgt);

    nodes.grid.g.classList.toggle("is-out", !gridOn);
    nodes.solar.g.classList.toggle("is-idle", s.solar < 0.05);
    nodes.home.g.classList.add("is-lit");
    cut.setAttribute("opacity", gridOn ? 0 : 1);
    gridBus.classList.toggle("is-cut", !gridOn);

    status.textContent = statusFor(hour, s);
    gridCtl.classList.toggle("is-on", gridOn);
    gridSw.setAttribute("aria-checked", String(gridOn));
    gridState.textContent = gridOn ? "Connected" : "Out";
  }

  gridSw.addEventListener("click", function () { gridOn = !gridOn; render(); });
  Array.prototype.forEach.call(document.querySelectorAll(".seg__btn"), function (b) {
    b.addEventListener("click", function () {
      timeKey = b.dataset.time;
      Array.prototype.forEach.call(document.querySelectorAll(".seg__btn"), function (o) {
        var on = o === b; o.classList.toggle("is-on", on); o.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  });

  if (reduced) svg.classList.add("no-motion");
  render();

  var lastNarrow = G.W < 560, rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var narrowNow = layout().W < 560;
      if (narrowNow !== lastNarrow) { lastNarrow = narrowNow; build(); render(); }
    }, 150);
  });
})();
