/* Scroll do hero (ref. Figma 4521:141743).
   A malha e a frase ficam presas na tela (.hero__stage é sticky) enquanto os cards
   de números sobem por cima, sempre no alinhamento original.
   - Cada card aparece (fade + saindo do desfoque) quando o topo dele passa de 68% da altura
     da tela (um pouco antes do meio), e volta a se esconder se a pessoa rolar de volta.
     O último card (o mais baixo) dispara 200px antes, para não ficar um intervalo grande
     depois do penúltimo.
   - A frase, o botão e a malha somem juntos (fade; a frase e o botão também desfocam) e chegam
     a 0% exatamente quando o último card aparece, ou seja, com os cards 100% na tela. */
(function () {
  var page = document.getElementById('page');
  var content = document.querySelector('.hero__content');
  var stage = document.querySelector('.hero__stage'); // malha + frase + botão
  var cards = [].slice.call(document.querySelectorAll('.hero .stat'));
  if (!page || !content || !stage) return;

  var END_BLUR = 6.5;   // desfoque final da frase (Figma 4521:141743)
  var TRIGGER = 0.68;   // fração da altura da tela em que o card aparece
  var LAST_EARLY = 200; // px do artboard que o último card adianta
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking = false;

  var last = cards.reduce(function (a, c) { return !a || c.offsetTop > a.offsetTop ? c : a; }, null);

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function update() {
    ticking = false;
    var zoom = parseFloat(page.style.zoom) || 1;
    var line = window.innerHeight * TRIGGER;
    // rolagem em que o último card aparece = fim do fade do palco
    var end = window.scrollY + last.getBoundingClientRect().top - LAST_EARLY * zoom - line;
    var p = Math.min(Math.max(window.scrollY / Math.max(end, 1), 0), 1);
    var e = ease(p);
    stage.style.opacity = (1 - e).toFixed(3);
    stage.style.visibility = e >= 0.999 ? 'hidden' : ''; // invisível de vez: o botão não fica clicável
    content.style.filter = e > 0.001 ? 'blur(' + (END_BLUR * e).toFixed(2) + 'px)' : '';

    if (reduced) return;
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
