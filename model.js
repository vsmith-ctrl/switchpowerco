/* Switch — the one modelled day. Single source of truth for the day chart
 * (charts.js) and the power flow panel (flow.js). Change numbers here only.
 *
 * A household using about 26 kWh/day, a system making about 43 kWh on a
 * clear Northern California summer day, and a 13.5 kWh battery.
 */
(function () {
  "use strict";
  var LOAD  = [0.50,0.45,0.40,0.40,0.45,0.60,0.90,1.20,1.00,0.80,0.70,0.70,
               0.75,0.80,0.90,1.10,1.60,2.20,2.60,2.40,2.00,1.50,1.00,0.70];
  var SOLAR = [0,0,0,0,0,0.05,0.40,1.30,2.60,3.90,5.00,5.70,
               5.90,5.60,4.90,3.80,2.50,1.30,0.45,0.05,0,0,0,0];
  var CAP = 13.5, RATE = 5.0;   // kWh usable; kW charge/discharge limit

  // Every hour: solar serves the house first, surplus charges the battery
  // (up to its rate and headroom), what is left is exported. Any shortfall
  // is met by the battery first, then the grid.
  var soc = 0, day = [];
  for (var h = 0; h < 24; h++) {
    var load = LOAD[h], sun = SOLAR[h];
    var direct  = Math.min(sun, load);
    var surplus = sun - direct;
    var socBefore = soc;
    var charge  = Math.min(surplus, CAP - soc, RATE);
    soc += charge;
    var exp = surplus - charge;
    var deficit = load - direct;
    var discharge = Math.min(deficit, soc, RATE);
    soc -= discharge;
    day.push({ h: h, load: load, solar: sun, direct: direct, charge: charge,
               export: exp, discharge: discharge, grid: deficit - discharge,
               socBefore: socBefore, soc: soc, pct: Math.round(soc / CAP * 100) });
  }
  window.SwitchModel = { LOAD: LOAD, SOLAR: SOLAR, CAP: CAP, RATE: RATE, day: day };
})();
