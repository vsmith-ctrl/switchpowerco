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

  /* ---------- scenarios: 1pm and 7pm from the modelled day ---------- */
  var SCEN = {
    day: {
      on:  { solar: 5.6, home: 0.8, batt: 4.0, battPct: 62, battMode: "charging", grid: 0.8, gridMode: "selling",
             s2h: 1, s2b: 1, s2g: 1, b2h: 0, g2h: 0,
             status: "Midday, grid connected. The panels run the house, bank the surplus in the battery, and sell what is left to the grid." },
      off: { solar: 5.6, home: 0.8, batt: 4.8, battPct: 62, battMode: "charging", grid: 0,   gridMode: "out",
             s2h: 1, s2b: 1, s2g: 0, b2h: 0, g2h: 0,
             status: "Midday, grid out. The house does not notice: panels keep running it and charging the battery. The only thing that stops is selling surplus." }
    },
    evening: {
      on:  { solar: 0, home: 2.4, batt: 2.4, battPct: 74, battMode: "powering home", grid: 0, gridMode: "idle",
             s2h: 0, s2b: 0, s2g: 0, b2h: 1, g2h: 0,
             status: "7pm, grid connected, the most expensive hour of the day. The battery is carrying the house and nothing is being bought." },
      off: { solar: 0, home: 2.4, batt: 2.4, battPct: 74, battMode: "powering home", grid: 0, gridMode: "out",
             s2h: 0, s2b: 0, s2g: 0, b2h: 1, g2h: 0,
             status: "7pm, grid out. Neighbours without a battery are in the dark. This house is running on what the panels banked at noon." }
    }
  };

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

  var G, N, R, J, flows = {}, cut, gridBus, nodes = {}, battFill;

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
  function kw(v) { return v.toFixed(1).replace(/\.0$/, "") + " kW"; }

  function render() {
    var s = SCEN[timeKey][gridOn ? "on" : "off"];
    Object.keys(flows).forEach(function (k) { flows[k].classList.toggle("is-on", !!s[k]); });

    nodes.solar.val.textContent = kw(s.solar);
    nodes.home.val.textContent = kw(s.home);
    nodes.battery.val.textContent = kw(s.batt) + " · " + s.battPct + "%";
    nodes.battery.lab.textContent = "Battery · " + s.battMode;
    nodes.grid.val.textContent = gridOn ? kw(s.grid) : "Out";
    nodes.grid.lab.textContent = "Grid · " + s.gridMode;

    // battery fill height tracks the percentage; the y is anchored to the bottom of the cell
    var hgt = Math.round(22 * s.battPct / 100);
    battFill.setAttribute("height", hgt);
    battFill.setAttribute("y", 11 - hgt);

    nodes.grid.g.classList.toggle("is-out", !gridOn);
    nodes.solar.g.classList.toggle("is-idle", s.solar === 0);
    nodes.home.g.classList.add("is-lit");                    // always. That is the point.
    cut.setAttribute("opacity", gridOn ? 0 : 1);
    gridBus.classList.toggle("is-cut", !gridOn);

    status.textContent = s.status;
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
