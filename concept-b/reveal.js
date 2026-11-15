/* Entrada cadenciada da seção Soluções: primeiro o título e o texto de apoio, depois os três cards,
   um depois do outro. Cada grupo entra quando o topo dele passa de 80% da altura da tela e volta a se
   esconder quando a pessoa rola de volta e ele desce para o pé da tela. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 160, TRIGGER = 0.8, HIDE = 0.92;
  var groups = [
    { box: document.querySelector('.fronts__intro'), items: '.fronts__intro > *' },
    { box: document.querySelector('.fronts__list'), items: '.fronts__list > .front' }
  ].filter(function (g) { return g.box; }).map(function (g) {
    var items = [].slice.call(document.querySelectorAll(g.items));
    items.forEach(function (el, i) { el.classList.add('reveal'); el.style.transitionDelay = (i * STAGGER) + 'ms'; });
    return { box: g.box, items: items, on: false };
  });
  if (reduced) { groups.forEach(function (g) { g.items.forEach(function (el) { el.classList.add('is-in'); }); }); return; }

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    groups.forEach(function (g) {
      var top = g.box.getBoundingClientRect().top;
      if (!g.on && top <= vh * TRIGGER) g.on = true;
      else if (g.on && top > vh * HIDE) g.on = false;
      else return;
      g.items.forEach(function (el) { el.classList.toggle('is-in', g.on); });
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
