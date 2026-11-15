/* Passagem Soluções → Cases:
   - Soluções fica presa pela base (sticky) e a seção de cases sobe por cima dela, num azul chapado.
   - Quando cases cobre a tela, ela fica presa (sticky dentro de .case-pin) por uma altura de tela de rolagem:
     primeiro o degradê aparece por cima do azul, depois os dados entram um a um (título, botão, cliente,
     resultado, setas, categoria), subindo e ganhando opacidade.
   - Tudo acompanha a rolagem, nos dois sentidos. */
(function () {
  var page = document.getElementById('page');
  var fronts = document.querySelector('.fronts');
  var pin = document.querySelector('.case-pin');
  var section = document.querySelector('.case');
  if (!page || !pin || !section) return;
  var bg = section.querySelector('.case__bg');
  var items = [].slice.call(section.querySelectorAll('.case__intro > *, .case__client, .case__result, .case__nav, .case__category'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BG = [0, 0.35];      // trecho da rolagem presa em que o degradê aparece
  var DATA = [0.25, 1];    // trecho em que os dados entram (cadenciados)
  var LAG = 0.1, RISE = 40;

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function ease(t) { return 1 - Math.pow(1 - t, 2); }
  function zoom() { return parseFloat(page.style.zoom) || 1; }

  // Soluções presa pela base: o sticky precisa da altura dela
  function measure() { if (fronts) page.style.setProperty('--fronts-h', fronts.offsetHeight + 'px'); }

  var ticking = false;
  function update() {
    ticking = false;
    if (reduced) return;
    var r = pin.getBoundingClientRect(), s = section.getBoundingClientRect();
    var hold = r.height - s.height;                      // rolagem em que cases fica presa
    var p = hold > 0 ? clamp(-r.top / hold) : 1;
    bg.style.opacity = ease(clamp((p - BG[0]) / (BG[1] - BG[0]))).toFixed(3);
    var span = 1 - LAG * (items.length - 1);
    items.forEach(function (el, i) {
      var q = clamp(((p - DATA[0]) / (DATA[1] - DATA[0]) - i * LAG) / span);
      el.style.opacity = q.toFixed(3);
      el.style.transform = q < 1 ? 'translateY(' + (RISE * (1 - ease(q))).toFixed(1) + 'px)' : '';
    });
  }

  measure();
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  if (document.fonts) document.fonts.ready.then(function () { measure(); update(); });
  update();
})();
