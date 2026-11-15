/* Scroll do hero (ref. Figma 4521:141743).
   A malha e a frase ficam presas na tela (.hero__stage é sticky) enquanto os cards
   de números sobem por cima, sempre no alinhamento original.
   - Cada card aparece (fade + saindo do desfoque) quando o topo dele passa de 68% da altura
     da tela (um pouco antes do meio), e volta a se esconder se a pessoa rolar de volta.
     O último card (o mais baixo) dispara 200px antes, para não ficar um intervalo grande
     depois do penúltimo.
   - A frase some com fade + desfoque ao longo dos primeiros 806px de rolagem
     (estado final do Figma: opacidade 0,1 e blur 6,5px). */
(function () {
  var page = document.getElementById('page');
  var content = document.querySelector('.hero__content');
  var cards = [].slice.call(document.querySelectorAll('.hero .stat'));
  if (!page || !content) return;

  var DISTANCE = 806;   // rolagem (px do artboard) até o estado final da frase
  var END_OPACITY = 0.1, END_BLUR = 6.5;
  var TRIGGER = 0.68;   // fração da altura da tela em que o card aparece
  var LAST_EARLY = 200; // px do artboard que o último card adianta
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  // ao recarregar, começa do topo (o restauro automático foi desligado no <head>)
  if (!location.hash) window.scrollTo(0, 0);
  var last = cards.reduce(function (a, c) { return !a || c.offsetTop > a.offsetTop ? c : a; }, null);

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function update() {
    ticking = false;
    var zoom = parseFloat(page.style.zoom) || 1;
    var p = Math.min(Math.max(window.scrollY / zoom / DISTANCE, 0), 1);
    var e = ease(p);
    content.style.opacity = (1 - (1 - END_OPACITY) * e).toFixed(3);
    content.style.filter = e > 0.001 ? 'blur(' + (END_BLUR * e).toFixed(2) + 'px)' : '';

    if (reduced) return;
    var line = window.innerHeight * TRIGGER;
    for (var i = 0; i < cards.length; i++) {
      var early = cards[i] === last ? LAST_EARLY * zoom : 0;
      cards[i].classList.toggle('is-in', cards[i].getBoundingClientRect().top - early <= line);
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
