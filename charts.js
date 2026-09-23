/* Switch — charts. Hand-built SVG, no library, no network requests.
 *
 * Palette is the validated categorical trio for a dark surface:
 *   solar #7E9C18 · battery #3987e5 · grid #d55181
 * All-pairs CVD dE 10.7, normal-vision 26.7, all >= 3:1 on black.
 * Every series is also direct-labelled or legended, so identity is never
 * carried by colour alone.
 */
(function () {
  "use strict";

  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ================= Chart A — rate comparison bars ================= */

  function growBars(root) {
    var bars = root.querySelectorAll(".bar");
    Array.prototype.forEach.call(bars, function (bar, i) {
      var pct = (parseFloat(bar.dataset.value) / parseFloat(bar.dataset.max)) * 100;
      var fill = bar.querySelector(".bar__fill");
      // Set the final width directly. The CSS transition does the animating,
      // so this cannot be stranded at zero by a paused frame callback — a bar
      // showing no width would be a chart reporting a rate of nothing.
      fill.style.transitionDelay = reduced ? "0ms" : (i * 110) + "ms";
      fill.style.width = pct + "%";
    });
  }

  var rates = document.getElementById("viz-rates");
  if (rates) {
    if (!("IntersectionObserver" in window) || reduced) growBars(rates);
    else {
      var bo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          growBars(rates);
          bo.unobserve(e.target);
        });
      }, { threshold: 0.35 });
      bo.observe(rates);
      // Failsafe: a bar stuck at zero width would read as a rate of nothing.
      setTimeout(function () { growBars(rates); }, 5000);
    }
  }

  /* ================= Chart B — one modelled day ================= */

  var svg = document.getElementById("day-chart");
  if (!svg) return;

  // The day comes from model.js, shared with the power flow panel, so the
  // two visuals can never disagree.
  var M = window.SwitchModel;
  var LOAD = M.LOAD, day = M.day;

  /* Geometry is chosen from the container width: a phone gets a squarer,
     taller chart so the curve is still readable at ~300px wide. */
  function dims() {
    var w = svg.parentNode.getBoundingClientRect().width || 900;
    return w < 560 ? { W: 520, H: 430 } : { W: 900, H: 420 };
  }

  var geo, W, H, M, iw, ih, x, y, clipRect, prod, loadLine, day_drawn = false;
  var yMax = 6.5;

  function areaPath(lower, upper) {
    var d = "M" + x(0) + " " + y(lower[0]);
    for (var i = 1; i < 24; i++) d += "L" + x(i) + " " + y(lower[i]);
    for (var j = 23; j >= 0; j--) d += "L" + x(j) + " " + y(upper[j]);
    return d + "Z";
  }
  function linePath(vals) {
    var d = "M" + x(0) + " " + y(vals[0]);
    for (var i = 1; i < 24; i++) d += "L" + x(i) + " " + y(vals[i]);
    return d;
  }

  var zero = day.map(function () { return 0; });
  var s1 = day.map(function (d) { return d.direct; });
  var s2 = day.map(function (d, i) { return s1[i] + d.discharge; });
  var s3 = day.map(function (d, i) { return s2[i] + d.grid; });

  var cross, dot;

  function build() {
    geo = dims();
    W = geo.W; H = geo.H;
    var narrow = W < 560;
    M = { t: 24, r: narrow ? 14 : 20, b: narrow ? 52 : 46, l: narrow ? 44 : 52 };
    iw = W - M.l - M.r; ih = H - M.t - M.b;
    x = function (i) { return M.l + (i / 23) * iw; };
    y = function (v) { return M.t + ih - (v / yMax) * ih; };

    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var gAxis = el("g", { class: "ax" });
    for (var v = 0; v <= 6; v += 2) {
      gAxis.appendChild(el("line", { x1: M.l, x2: W - M.r, y1: y(v), y2: y(v), class: "ax__grid" }));
      var ly = el("text", { x: M.l - 10, y: y(v) + 4, class: "ax__lab", "text-anchor": "end" });
      ly.textContent = v + (v === 6 ? " kW" : "");
      gAxis.appendChild(ly);
    }
    var ticks = narrow ? [[0, "12am"], [6, "6am"], [12, "noon"], [18, "6pm"], [23, "11pm"]]
                       : [[0, "12am"], [6, "6am"], [12, "noon"], [16, "4pm"], [21, "9pm"], [23, "11pm"]];
    ticks.forEach(function (t) {
      var lx = el("text", { x: x(t[0]), y: H - M.b + 26, class: "ax__lab", "text-anchor": "middle" });
      lx.textContent = t[1];
      gAxis.appendChild(lx);
    });
    svg.appendChild(gAxis);

    svg.appendChild(el("rect", { x: x(16), y: M.t, width: x(21) - x(16), height: ih, class: "peak-band" }));
    var peakLab = el("text", { x: (x(16) + x(21)) / 2, y: M.t + 16, class: "peak-lab", "text-anchor": "middle" });
    peakLab.textContent = narrow ? "4\u20139pm" : "4\u20139pm, the priciest hours";
    svg.appendChild(peakLab);

    var clip = el("clipPath", { id: "day-clip" });
    clipRect = el("rect", { x: M.l, y: 0, width: 0, height: H });
    clip.appendChild(clipRect);
    svg.appendChild(clip);

    var gAreas = el("g", { "clip-path": "url(#day-clip)" });
    gAreas.appendChild(el("path", { d: areaPath(zero, s1), class: "area", "data-series": "solar" }));
    gAreas.appendChild(el("path", { d: areaPath(s1, s2),   class: "area", "data-series": "battery" }));
    gAreas.appendChild(el("path", { d: areaPath(s2, s3),   class: "area", "data-series": "grid" }));
    svg.appendChild(gAreas);

    svg.appendChild(el("path", {
      d: areaPath(day.map(function (d) { return d.load; }),
                  day.map(function (d) { return Math.max(d.solar, d.load); })),
      class: "charge-area", "clip-path": "url(#day-clip)"
    }));

    prod = el("path", { d: linePath(day.map(function (d) { return d.solar; })), class: "prod-line" });
    svg.appendChild(prod);
    loadLine = el("path", { d: linePath(LOAD), class: "load-line" });
    svg.appendChild(loadLine);

    if (!narrow) {
      [["Solar production", 11, 6.25, "middle", "note--solar"],
       ["Your usage", 3.2, 1.35, "start", "note--load"],
       ["Battery charges", 12.4, 3.2, "middle", "note--batt"],
       ["Battery covers the evening", 18.6, 3.15, "middle", "note--batt"]]
      .forEach(function (n) {
        var t = el("text", { x: x(n[1]), y: y(n[2]), class: "note " + n[4], "text-anchor": n[3] });
        t.textContent = n[0];
        svg.appendChild(t);
      });
    }

    cross = el("line", { y1: M.t, y2: M.t + ih, class: "cross", opacity: 0 });
    svg.appendChild(cross);
    dot = el("circle", { r: 5, class: "cross-dot", opacity: 0 });
    svg.appendChild(dot);

    if (day_drawn) clipRect.setAttribute("width", iw);
  }

  build();

  /* ---------- hover layer ---------- */

  var tip = document.getElementById("day-tip");

  function fmt(n) { return n.toFixed(2).replace(/\.00$/, "") + " kW"; }
  function hourLabel(i) {
    var ampm = i < 12 ? "am" : "pm";
    var hh = i % 12 === 0 ? 12 : i % 12;
    return hh + ampm;
  }

  function moveTip(evt) {
    var box = svg.getBoundingClientRect();
    var px = (evt.clientX - box.left) / box.width * W;
    var i = Math.max(0, Math.min(23, Math.round((px - M.l) / iw * 23)));
    var d = day[i];
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
    cross.setAttribute("opacity", 1);
    dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(d.load));
    dot.setAttribute("opacity", 1);
    tip.hidden = false;
    tip.innerHTML =
      '<strong>' + hourLabel(i) + '</strong>' +
      '<span><i data-series="solar"></i>Solar direct<b>' + fmt(d.direct) + '</b></span>' +
      '<span><i data-series="battery"></i>Battery<b>' + fmt(d.discharge) + '</b></span>' +
      '<span><i data-series="grid"></i>Grid<b>' + fmt(d.grid) + '</b></span>' +
      '<span class="tip__tot">Using<b>' + fmt(d.load) + '</b></span>';
    var left = (x(i) / W) * box.width;
    tip.style.left = Math.max(8, Math.min(box.width - 8, left)) + "px";
  }
  function hideTip() {
    cross.setAttribute("opacity", 0);
    dot.setAttribute("opacity", 0);
    tip.hidden = true;
  }
  svg.addEventListener("pointermove", moveTip);
  svg.addEventListener("pointerleave", hideTip);

  // --- table view ---
  var tbl = document.getElementById("day-table");
  if (tbl) {
    var head = "<thead><tr><th scope='col'>Hour</th><th scope='col'>Using</th>" +
               "<th scope='col'>Solar made</th><th scope='col'>Solar direct</th>" +
               "<th scope='col'>Battery</th><th scope='col'>Grid</th></tr></thead><tbody>";
    var rows = day.map(function (d, i) {
      return "<tr><th scope='row'>" + hourLabel(i) + "</th><td>" + fmt(d.load) +
             "</td><td>" + fmt(d.solar) + "</td><td>" + fmt(d.direct) +
             "</td><td>" + fmt(d.discharge) + "</td><td>" + fmt(d.grid) + "</td></tr>";
    }).join("");
    tbl.innerHTML = head + rows + "</tbody>";
  }

  // --- reveal animation ---
  function drawDay() {
    if (reduced) { day_drawn = true; clipRect.setAttribute("width", iw); return; }

    [prod, loadLine].forEach(function (p) {
      var l = p.getTotalLength();
      p.style.transition = "none";
      p.style.strokeDasharray = l;
      p.style.strokeDashoffset = l;
      void p.getBoundingClientRect();        // flush, without waiting for a frame
      p.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.3,.7,.2,1)";
      p.style.strokeDashoffset = 0;
    });

    // A hidden tab gets no frame callbacks, so draw it complete instead.
    if (document.hidden) { clipRect.setAttribute("width", iw); return; }

    var t0 = null;
    function step(now) {
      if (t0 === null) t0 = now;
      var p = Math.min((now - t0) / 1500, 1);
      clipRect.setAttribute("width", iw * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
      else clipRect.setAttribute("width", iw);
    }
    requestAnimationFrame(step);   // must come from rAF, so `now` is a timestamp
    svg.classList.add("is-drawn");
    day_drawn = true;
  }

  if (!("IntersectionObserver" in window) || reduced) drawDay();
  else {
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        drawDay();
        dio.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    dio.observe(svg);
    // Failsafe: an unclipped chart is better than an invisible one.
    setTimeout(function () { clipRect.setAttribute("width", iw); }, 5000);
  }

  var lastNarrow = W < 560, rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var narrowNow = dims().W < 560;
      if (narrowNow !== lastNarrow) { lastNarrow = narrowNow; build(); }
    }, 150);
  });
})();
