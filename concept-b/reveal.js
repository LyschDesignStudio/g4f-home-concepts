/* Entradas acompanhando a rolagem (como os big numbers):
   - Soluções: primeiro o título e o texto de apoio, depois os três cards, um depois do outro.
   - CTA (Sobre): título, texto e os dois botões.
   - Rodapé: as três colunas de links, redes sociais, linha e dados legais; depois o logo grande, peça por peça:
     o ícone, o G, o 4 e o F, da esquerda para a direita.
   A opacidade de cada item sobe de 0 a 100% (e ele sobe até o lugar) conforme o topo do grupo vai do pé
   da tela (100%) até START_END[1]; cada item começa um pouco depois do anterior e todos terminam juntos.
   Rolando para cima, tudo volta junto. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // lag: atraso de cada item dentro do trajeto do grupo
  var groups = [
    { box: '.fronts__intro', items: '.fronts__intro > *', from: 1, to: 0.6, rise: 40, lag: 0.18 },
    { box: '.fronts__list', items: '.fronts__list > .front', from: 1, to: 0.5, rise: 80, lag: 0.18 },
    { box: '.about__content', items: '.about__headline, .about__desc, .about__ctas > .btn', from: 0.95, to: 0.5, rise: 40, lag: 0.15 },
    // o rodapé fica no fim da página: o trajeto termina antes do fim da rolagem para tudo chegar a 100%
    { box: '.footer__nav', items: '.footer__col, .footer__social, .footer__line, .footer__legal', from: 1, to: 0.45, rise: 30, lag: 0.1 },
    // logo grande: o ícone primeiro, depois G, 4 e F, da esquerda para a direita (sobem de dentro do corte de baixo)
    { box: '.footer__logo', items: '.footer__logo-part', from: 1, to: 0.72, rise: 80, lag: 0.2 }
  ].map(function (g) {
    g.box = document.querySelector(g.box);
    g.items = [].slice.call(document.querySelectorAll(g.items));
    return g;
  }).filter(function (g) { return g.box; });
  if (reduced) return;

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function ease(t) { return 1 - Math.pow(1 - t, 2); }
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    groups.forEach(function (g) {
      var p = clamp((vh * g.from - g.box.getBoundingClientRect().top) / (vh * (g.from - g.to)));
      var span = 1 - g.lag * (g.items.length - 1);
      g.items.forEach(function (el, i) {
        var q = clamp((p - i * g.lag) / span);
        el.style.opacity = q.toFixed(3);
        el.style.transform = q < 1 ? 'translateY(' + (g.rise * (1 - ease(q))).toFixed(1) + 'px)' : '';
      });
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
