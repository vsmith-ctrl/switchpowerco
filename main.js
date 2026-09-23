/* Switch — interaction and motion. No dependencies, no network requests.
 *
 * Design rule for everything below: the page must be fully readable if any
 * of it fails. Animation is decoration layered on top of working content,
 * never the thing that makes content appear.
 */
(function () {
  "use strict";

  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the hero switch, which also powers the page on ---------- */

  var flipSwitch = document.getElementById("flip-switch");
  if (flipSwitch) {
    var flip = flipSwitch.closest(".flip");
    var hero = document.getElementById("hero");
    var texts = flip.querySelectorAll(".flip__text");

    flipSwitch.addEventListener("click", function () {
      var on = flipSwitch.getAttribute("aria-checked") !== "true";
      flipSwitch.setAttribute("aria-checked", String(on));
      flip.classList.toggle("is-on", on);

      Array.prototype.forEach.call(texts, function (t) {
        t.classList.toggle("is-shown", t.dataset.state === (on ? "on" : "off"));
      });

      if (hero) {
        hero.classList.remove("is-live");
        if (on) {
          void hero.offsetWidth;          // force reflow so the sweep replays
          hero.classList.add("is-live");
        }
      }
    });
  }

  /* ---------- scroll reveals ---------- */

  var revealables = document.querySelectorAll(
    ".reveal, .h2, .lede, .tenet, .rhythm__row, .step, .rung, .compare__col," +
    ".table-scroll, .callout, .qa li, .sub-h, .fineprint, .table-hint"
  );
  var items = Array.prototype.slice.call(revealables);

  function show(el) { el.classList.add("is-in"); }

  /* Reveals anything at or above the fold. Safe to call repeatedly. */
  function sweep() {
    var limit = window.innerHeight + 80;
    items.forEach(function (el) {
      if (el.classList.contains("is-in")) return;
      if (el.getBoundingClientRect().top < limit) show(el);
    });
  }

  function showAll() { items.forEach(show); }

  if (!("IntersectionObserver" in window) || reduced) {
    items.forEach(function (el) { el.classList.add("reveal"); show(el); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    items.forEach(function (el, idx) {
      el.classList.add("reveal");
      var order = el.getAttribute("data-reveal-order");
      if (order === null && el.parentNode) {
        var sibs = Array.prototype.filter.call(
          el.parentNode.children,
          function (n) { return n.tagName === el.tagName; }
        );
        order = Math.min(sibs.indexOf(el), 5);
      }
      el.style.setProperty("--reveal-delay", String(order || 0));
      io.observe(el);
    });

    // Safety nets. Observer callbacks are deferred in background tabs, and a
    // page that is scrolled or restored mid-load can miss them entirely.
    sweep();
    window.addEventListener("load", sweep);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) sweep();
    });
    // Last resort: nothing stays invisible, whatever went wrong.
    setTimeout(showAll, 4000);
  }

  /* ---------- figures that count up when they scroll into view ---------- */

  var counters = Array.prototype.slice.call(
    document.querySelectorAll("[data-count-to]")
  );

  counters.forEach(function (el) {
    var raw = el.getAttribute("data-count-to");
    var target = parseFloat(raw);
    var decimals = (raw.split(".")[1] || "").length;
    var done = false;

    // The true value is what the markup already says. It is only ever
    // replaced by a live animation, so a failure here shows the real number
    // rather than a zero, which would be plainly wrong on a rates page.
    function finish() {
      if (done) return;
      done = true;
      el.textContent = target.toFixed(decimals);
    }

    if (reduced || !("IntersectionObserver" in window)) { finish(); return; }

    function animate() {
      if (done) return;
      done = true;
      var start = null, dur = 1100;
      function step(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(step);
    }

    // Only blank it out if it is still below the fold, so nobody ever
    // watches a real figure drop to zero.
    if (el.getBoundingClientRect().top > window.innerHeight) el.textContent = "0";

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animate();
        cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    cio.observe(el);

    setTimeout(finish, 5000);
  });

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
