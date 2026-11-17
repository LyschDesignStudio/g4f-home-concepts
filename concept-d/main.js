/* Concept D
   - Entradas: cada [data-reveal] sobe com fade e sai do desfoque quando o topo passa de 88% da tela (toca inteira,
     sem depender da velocidade da rolagem); os cards de Soluções entram em cascata. Rolando para cima até o item
     sair da tela por baixo, ele volta ao início para tocar de novo.
   - Navbar flutuante: recolhe para cima presa à rolagem quando o rodapé entra na tela. */
(function () {
  var root = document.documentElement;

  // ---- navbar: sobe junto com a rolagem enquanto o rodapé entra; com o rodapé inteiro na tela, some ----
  var nav = document.querySelector('.nav'), footer = document.querySelector('.footer');
  if (nav && footer) {
    var navTick = false;
    var navUpdate = function () {
      navTick = false;
      var f = footer.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh - f.top) / Math.min(f.height, vh)));
      if (p > 0.99) p = 1;
      // 134px tiram a barra da tela; o resto leva junto a sombra (ela se estende ~170px abaixo da barra)
      nav.style.translate = p > 0 ? '0 ' + (-320 * p).toFixed(1) + 'px' : '';
    };
    window.addEventListener('scroll', function () { if (!navTick) { navTick = true; requestAnimationFrame(navUpdate); } }, { passive: true });
    window.addEventListener('resize', navUpdate);
    navUpdate();
  }

  if (!root.classList.contains('reveal-pending')) return;
  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
  // cascata: os cards de Soluções entram um depois do outro
  [].slice.call(document.querySelectorAll('.fronts__list > .front')).forEach(function (el, i) { el.style.setProperty('--d', (i * 140) + 'ms'); });
  var cn = document.querySelector('.case__slides'); if (cn) cn.style.setProperty('--d', '200ms');
  var IN = 0.88;
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      // nos cases os slides ocupam a seção toda: mede pelo cliente (o primeiro dado visível)
      var top = el.classList.contains('case__slides') ? el.querySelector('.case__client').getBoundingClientRect().top : r.top;
      if (top <= vh * IN) el.classList.add('is-in');
      else if (top > vh) el.classList.remove('is-in');
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
