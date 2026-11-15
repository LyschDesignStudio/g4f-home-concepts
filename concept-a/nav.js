/* Navbar escura: quando o topo da seção do mapa encosta na base do menu, a navbar troca
   para o modo escuro (e segue escura sobre o rodapé, que também é escuro).
   Rolando de volta para cima, ela volta ao modo claro. */
(function () {
  var nav = document.querySelector('.nav');
  var map = document.querySelector('.map');
  if (!nav || !map) return;
  var ticking = false;
  function update() {
    ticking = false;
    nav.classList.toggle('nav--dark', map.getBoundingClientRect().top <= nav.getBoundingClientRect().bottom);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
