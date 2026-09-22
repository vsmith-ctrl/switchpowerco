/* Switch Power Co — the one interactive moment on the site. */
(function () {
  "use strict";

  var flipSwitch = document.getElementById("flip-switch");
  if (flipSwitch) {
    var flip = flipSwitch.closest(".flip");
    var texts = flip.querySelectorAll(".flip__text");

    flipSwitch.addEventListener("click", function () {
      var on = flipSwitch.getAttribute("aria-checked") !== "true";
      flipSwitch.setAttribute("aria-checked", String(on));
      flip.classList.toggle("is-on", on);

      Array.prototype.forEach.call(texts, function (t) {
        t.classList.toggle("is-shown", t.dataset.state === (on ? "on" : "off"));
      });
    });
  }

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
