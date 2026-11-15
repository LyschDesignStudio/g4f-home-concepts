/* Menu flutuante (ref. Figma 4513:141718).
   O navbar do topo rola junto com a página; quando ele sai da tela, uma cópia dele
   aparece fixa no topo como uma barra branca centralizada (1005 × 94, a 40px do topo).
   Volta a sumir quando a pessoa rola de volta para o topo. */
(function () {
  var page = document.getElementById('page');
  var nav = document.querySelector('.nav');
  if (!page || !nav) return;

  var bar = nav.cloneNode(true);
  bar.classList.add('nav--float');
  bar.setAttribute('aria-hidden', 'true');
  bar.querySelectorAll('a, button').forEach(function (el) { el.tabIndex = -1; });
  page.appendChild(bar);

  var ticking = false;
  function update() {
    ticking = false;
    var on = nav.getBoundingClientRect().bottom <= 0;
    if (on === bar.classList.contains('is-on')) return;
    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', on ? 'false' : 'true');
    bar.querySelectorAll('a, button').forEach(function (el) { el.tabIndex = on ? 0 : -1; });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
