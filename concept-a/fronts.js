/* Soluções: enquanto os cards empilham (position: sticky no CSS), cada card escurece
   à medida que os seguintes passam por cima dele.
   Nível 0 = #f7f7f7 (livre), 1 = #ededed (um card por cima), 2 = #e0e0e0 (dois por cima),
   as cores dos cards de baixo no Figma 4525:184930. */
(function () {
  var page = document.getElementById('page');
  var cards = [].slice.call(document.querySelectorAll('.fronts__list .front'));
  if (!cards.length) return;

  var COLORS = [[247, 247, 247], [237, 237, 237], [224, 224, 224]];
  var FULL = 423; // sobreposição (px do artboard) quando o card de cima já parou: 526 − ~103
  var ticking = false;

  function color(level) {
    level = Math.min(Math.max(level, 0), COLORS.length - 1);
    var i = Math.min(Math.floor(level), COLORS.length - 2), t = level - i, a = COLORS[i], b = COLORS[i + 1];
    return 'rgb(' + [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * t); }).join(',') + ')';
  }

  function update() {
    ticking = false;
    var zoom = parseFloat(page && page.style.zoom) || 1;
    var rects = cards.map(function (c) { return c.getBoundingClientRect(); });
    // quanto cada card (a partir do 2º) já cobriu o anterior, de 0 a 1
    var p = rects.map(function (r, j) {
      if (!j) return 0;
      return Math.min(Math.max((rects[j - 1].bottom - r.top) / (FULL * zoom), 0), 1);
    });
    for (var i = 0; i < cards.length; i++) {
      var level = 0;
      for (var j = i + 1; j < cards.length; j++) level += p[j];
      cards[i].style.backgroundColor = color(level);
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
