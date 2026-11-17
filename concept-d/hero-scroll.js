/* Rolagem do hero (Concept D).
   O palco (malha + título + botão) fica preso na tela enquanto os cards de números sobem por cima dele.
   Tudo segue a rolagem, nos dois sentidos, com um só progresso p: 0 no topo da página e 1 quando o centro do bloco
   de cards chega ao meio da tela.
   - Título e botão saem de vez: opacidade até 0 e desfoque (terminam antes, em 65% do trajeto).
   - A malha não some: só fica mais clara (até 30%), sem desfoque.
   - Cards: sem desfoque; sobem um pouco mais rápido que a página (cada um no seu ritmo) e chegam ao lugar com p = 1.
   - Números: contam de 0 até o valor final, que aparece quando o bloco está no meio da tela. */
(function () {
  var page = document.getElementById('page');
  var hero = document.querySelector('.hero');
  var content = document.querySelector('.hero__content');
  var grid = document.querySelector('.hero__grid');
  var cards = [].slice.call(document.querySelectorAll('.hero .stat'));
  if (!page || !hero || !cards.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var RISE = [150, 260, 200, 300];          // quanto cada card vem abaixo do lugar no início (px do artboard)
  var vals = cards.map(function (c) {
    var el = c.querySelector('.stat__val');
    return { el: el, to: parseFloat(el.getAttribute('data-to')), dec: +(el.getAttribute('data-dec') || 0) };
  });

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function inOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function out(t) { return 1 - Math.pow(1 - t, 3); }
  function fmt(v, dec) { return dec ? v.toFixed(dec).replace('.', ',') : String(Math.round(v)); }

  var ticking = false;
  function update() {
    ticking = false;
    var z = parseFloat(page.style.zoom) || 1;
    var vh = window.innerHeight / z;
    // centro do bloco de cards (px do artboard, a partir do topo do hero)
    var top = Infinity, bottom = -Infinity;
    cards.forEach(function (c) { top = Math.min(top, c.offsetTop); bottom = Math.max(bottom, c.offsetTop + c.offsetHeight); });
    var end = Math.max(1, (top + bottom) / 2 - vh / 2);
    var s = -hero.getBoundingClientRect().top / z;          // quanto o hero já rolou
    var p = clamp(s / end);

    var e = inOut(clamp(p / 0.65));
    content.style.opacity = (1 - e).toFixed(3);
    content.style.filter = e > 0.001 ? 'blur(' + (12 * e).toFixed(2) + 'px)' : '';
    content.style.visibility = e > 0.999 ? 'hidden' : '';     // invisível de vez: o botão não fica clicável
    grid.style.opacity = (1 - 0.7 * inOut(p)).toFixed(3);

    var r = inOut(p);
    cards.forEach(function (c, i) {
      c.style.transform = r < 1 ? 'translateY(' + ((RISE[i % RISE.length]) * (1 - r)).toFixed(1) + 'px)' : '';
    });
    vals.forEach(function (v) { v.el.textContent = fmt(v.to * inOut(p), v.dec); });
  }

  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
