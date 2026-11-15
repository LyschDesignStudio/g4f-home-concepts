/* Scroll do hero (ref. Figma 4521:141743).
   A malha e a frase ficam presas na tela (.hero__stage é sticky) enquanto os cards
   de números sobem por cima. Conforme os cards passam, a frase some com fade + desfoque.
   Estado final do Figma (após 806px de rolagem): frase com opacidade 0,1 e blur 6,5px,
   cards deslocados 48px para a direita. */
(function () {
  var page = document.getElementById('page');
  var content = document.querySelector('.hero__content');
  var cards = [].slice.call(document.querySelectorAll('.hero .stat'));
  if (!page || !content) return;

  var DISTANCE = 806;   // rolagem (px do artboard) até o estado final
  var END_OPACITY = 0.1, END_BLUR = 6.5, END_SHIFT_X = 48;
  var ticking = false;

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function update() {
    ticking = false;
    var zoom = parseFloat(page.style.zoom) || 1;
    var s = window.scrollY / zoom;
    var p = Math.min(Math.max(s / DISTANCE, 0), 1);
    var e = ease(p);
    content.style.opacity = (1 - (1 - END_OPACITY) * e).toFixed(3);
    content.style.filter = e > 0.001 ? 'blur(' + (END_BLUR * e).toFixed(2) + 'px)' : '';
    var x = (END_SHIFT_X * e).toFixed(1);
    for (var i = 0; i < cards.length; i++) cards[i].style.transform = e > 0.001 ? 'translateX(' + x + 'px)' : '';
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
