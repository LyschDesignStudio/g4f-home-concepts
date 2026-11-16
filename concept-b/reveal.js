/* Entradas acompanhando a rolagem (como os big numbers):
   - Soluções: primeiro o título e o texto de apoio, depois os três cards, um depois do outro.
   - CTA (Sobre): título, texto e os dois botões.
   - Rodapé: as três colunas de links, redes sociais, linha e dados legais.
   - Logo grande do rodapé: não acompanha a rolagem. Quando ele entra na tela, a animação toca inteira, no próprio
     tempo (ícone, G, 4 e F, da esquerda para a direita), qualquer que seja a velocidade da rolagem; quando ele sai
     da tela por baixo (rolando para cima), volta ao início para tocar de novo na próxima vez.
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
    { box: '.footer__nav', items: '.footer__col, .footer__social, .footer__line, .footer__legal', from: 1, to: 0.45, rise: 30, lag: 0.1 }
  ].map(function (g) {
    g.box = document.querySelector(g.box);
    g.items = [].slice.call(document.querySelectorAll(g.items));
    return g;
  }).filter(function (g) { return g.box; });
  if (reduced) return;

  // logo grande: dispara quando entra na tela (CSS .footer__logo.is-in faz a animação, peça por peça)
  var logo = document.querySelector('.footer__logo');
  var LOGO_IN = 0.95, STAGGER = 160; // fração da tela em que dispara; ms entre uma peça e a próxima
  if (logo) [].slice.call(logo.querySelectorAll('.footer__logo-part')).forEach(function (el, i) {
    el.style.setProperty('--d', (i * STAGGER) + 'ms');
  });

  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function ease(t) { return 1 - Math.pow(1 - t, 2); }
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (logo) {
      var top = logo.getBoundingClientRect().top;
      if (top <= vh * LOGO_IN) logo.classList.add('is-in');
      else if (top > vh) logo.classList.remove('is-in'); // saiu da tela por baixo: rearma
    }
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
