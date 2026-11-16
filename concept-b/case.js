/* Passagem Soluções → Cases:
   - Soluções fica presa pela base (sticky) e a seção de cases fica presa por cima dela, transparente
     (sticky dentro de .case-pin, que começa sobre a última tela de Soluções).
   - Rolando, um fundo azul chapado cobre a tela toda, depois o degradê aparece por cima do azul e os dados
     entram um a um (título, botão, cliente, resultado, setas, categoria), subindo e ganhando opacidade.
   - Enquanto o azul entra ou sai, Soluções continua andando com a rolagem: voltando, a página já se mexe
     antes de a seção de cases sumir por completo.
   - Tudo acompanha a rolagem, nos dois sentidos (a página não rola sozinha). */
(function () {
  var page = document.getElementById('page');
  var fronts = document.querySelector('.fronts');
  var pin = document.querySelector('.case-pin');
  var section = document.querySelector('.case');
  if (!page || !pin || !section) return;
  var bg = section.querySelector('.case__bg');
  // grupos que entram em sequência (cada grupo pode ter vários elementos: um por case do carrossel)
  var items = [':scope .case__intro > :nth-child(1)', ':scope .case__intro > :nth-child(2)', '.case__client', '.case__result', '.case__nav', '.case__category']
    .map(function (sel) { return [].slice.call(section.querySelectorAll(sel)); });
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BLUE = [0, 0.3];     // trecho da rolagem presa em que o azul cobre a tela
  var BG = [0.3, 0.55];    // trecho em que o degradê aparece
  var DATA = [0.5, 1];     // trecho em que os dados entram (cadenciados)
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
    var blue = clamp((p - BLUE[0]) / (BLUE[1] - BLUE[0]));
    section.style.setProperty('--case-blue', blue.toFixed(3));
    section.classList.toggle('is-off', blue < 0.5);
    // enquanto o azul entra/sai, Soluções continua andando com a rolagem (em vez de ficar parada até o azul
    // sumir de todo); depois que o azul cobre a tela ela fica onde parou, escondida atrás dele
    if (fronts) {
      var d = Math.min(Math.max(-r.top, 0), BLUE[1] * hold);
      fronts.style.transform = d > 0 ? 'translateY(' + (-d / zoom()).toFixed(1) + 'px)' : '';
    }
    bg.style.opacity = ease(clamp((p - BG[0]) / (BG[1] - BG[0]))).toFixed(3);
    var span = 1 - LAG * (items.length - 1);
    items.forEach(function (group, i) {
      var q = clamp(((p - DATA[0]) / (DATA[1] - DATA[0]) - i * LAG) / span);
      group.forEach(function (el) {
        el.style.opacity = q.toFixed(3);
        el.style.transform = q < 1 ? 'translateY(' + (RISE * (1 - ease(q))).toFixed(1) + 'px)' : '';
      });
    });
  }

  measure();
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  if (document.fonts) document.fonts.ready.then(function () { measure(); update(); });
  update();
})();
