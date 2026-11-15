/* Passagem Soluções → Cases:
   - Soluções fica presa pela base (sticky) e a seção de cases fica presa por cima dela, transparente
     (sticky dentro de .case-pin, que começa sobre a última tela de Soluções).
   - Rolando, um fundo azul chapado cobre a tela toda, depois o degradê aparece por cima do azul e os dados
     entram um a um (título, botão, cliente, resultado, setas, categoria), subindo e ganhando opacidade.
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

  var BLUE = [0, 0.3];     // trecho da rolagem presa em que o azul cobre a tela
  var BG = [0.3, 0.55];    // trecho em que o degradê aparece
  var DATA = [0.5, 0.97];  // trecho em que os dados entram (cadenciados; completos um pouco antes da parada)
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
    bg.style.opacity = ease(clamp((p - BG[0]) / (BG[1] - BG[0]))).toFixed(3);
    var span = 1 - LAG * (items.length - 1);
    items.forEach(function (el, i) {
      var q = clamp(((p - DATA[0]) / (DATA[1] - DATA[0]) - i * LAG) / span);
      el.style.opacity = q.toFixed(3);
      el.style.transform = q < 1 ? 'translateY(' + (RISE * (1 - ease(q))).toFixed(1) + 'px)' : '';
    });
  }

  /* Parada no fim: descendo, quando a seção fica completa (todos os dados na tela) a rolagem para ali.
     O resto do gesto que trouxe a pessoa até aqui (inclusive a inércia do trackpad) é ignorado; só um
     novo gesto de rolagem (a "segunda tentativa") libera e segue para a próxima seção.
     Subindo de volta acima do trecho, a parada se arma de novo. */
  var QUIET = 220;            // ms sem eventos de rolagem que separam um gesto do outro
  var armed = true, locked = false, lastInput = 0, lastY = window.scrollY;
  function endY() {
    var r = pin.getBoundingClientRect();
    return r.top + window.scrollY + (r.height - section.getBoundingClientRect().height);
  }
  function lock(y) {
    locked = true; armed = false;
    window.scrollTo(0, y);
    lastInput = performance.now();
  }
  function onScrollGuard() {
    var y = window.scrollY, end = endY(), vh = window.innerHeight;
    if (locked && Math.abs(y - end) > 1) window.scrollTo(0, end);             // segura no ponto enquanto travado
    else if (armed && y > lastY && lastY < end && y >= end && y - end < vh) lock(end); // cruzou o fim descendo
    if (!armed && !locked && y < end - vh * 0.25) armed = true;                // voltou para cima: arma de novo
    lastY = window.scrollY;
  }
  // um gesto novo depois de uma pausa libera; enquanto o gesto que travou continua, ele é engolido
  function intent(ev, isNewGesture) {
    if (!locked) return;
    var now = performance.now();
    if (isNewGesture || now - lastInput > QUIET) { locked = false; return; }
    lastInput = now;
    if (ev.cancelable) ev.preventDefault();
  }
  if (!reduced) {
    window.addEventListener('wheel', function (ev) { intent(ev, false); }, { passive: false });
    window.addEventListener('touchstart', function (ev) { if (locked && performance.now() - lastInput > QUIET) locked = false; }, { passive: true });
    window.addEventListener('touchmove', function (ev) { intent(ev, false); }, { passive: false });
    window.addEventListener('keydown', function (ev) {
      if (locked && /^(ArrowDown|PageDown|Space| |End)$/.test(ev.key || ev.code)) locked = false; // tecla = nova tentativa
    });
    window.addEventListener('scroll', onScrollGuard, { passive: true });
  }

  measure();
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  if (document.fonts) document.fonts.ready.then(function () { measure(); update(); });
  update();
})();
