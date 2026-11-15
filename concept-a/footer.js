/* Rodapé: cada item (títulos, links, redes, linha e texto legal) aparece quando passa de 92%
   da altura da tela, subindo com fade; rolando de volta para cima, some de novo.
   As colunas entram em cascata (80ms entre uma e outra). */
(function () {
  var root = document.documentElement;
  var footer = document.querySelector('.footer');
  if (!footer || !root.classList.contains('footer-pending')) return;

  var LINE = 0.92; // fração da altura da tela
  var items = [];
  [].slice.call(footer.querySelectorAll('.footer__col')).forEach(function (col, c) {
    [].slice.call(col.querySelectorAll('.footer__title, li')).forEach(function (el) {
      el.style.setProperty('--d', (c * 80) + 'ms'); items.push(el);
    });
  });
  var social = footer.querySelector('.footer__social');
  if (social) { social.style.setProperty('--d', '240ms'); items.push(social); }
  [].slice.call(footer.querySelectorAll('.footer__line, .footer__legal > *')).forEach(function (el, i) {
    el.style.setProperty('--d', (i * 80) + 'ms'); items.push(el);
  });
  items.forEach(function (el) { el.classList.add('footer__reveal'); });

  var ticking = false;
  function update() {
    ticking = false;
    var line = window.innerHeight * LINE;
    for (var i = 0; i < items.length; i++) {
      // o deslocamento de 24px do item escondido já cria uma folga, então ele não oscila na borda
      items[i].classList.toggle('is-in', items[i].getBoundingClientRect().top <= line);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
