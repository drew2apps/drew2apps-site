// drew2apps — small shared behaviors
(function () {
  // footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // live clock on the Transition card
  var clocks = document.querySelectorAll("[data-mini-clock]");
  if (clocks.length) {
    var tick = function () {
      var d = new Date();
      var h = d.getHours() % 12 || 12;
      var m = String(d.getMinutes()).padStart(2, "0");
      clocks.forEach(function (c) { c.textContent = h + ":" + m; });
    };
    tick();
    setInterval(tick, 10000);
  }

  // Colorize card: random hue + random odd square
  document.querySelectorAll("[data-mini-colorize]").forEach(function (grid) {
    var hue = Math.floor(Math.random() * 360);
    var cells = grid.querySelectorAll("i");
    var odd = Math.floor(Math.random() * cells.length);
    cells.forEach(function (c, i) {
      c.style.background = "hsl(" + hue + " 70% " + (i === odd ? "63%" : "56%") + ")";
      c.classList.toggle("odd", i === odd);
    });
  });
})();
