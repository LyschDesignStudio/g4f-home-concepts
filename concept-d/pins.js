/* Pins do mapa, ligados à rolagem: Brasília aparece assim que o pin dela entra inteiro na tela,
   e os outros surgem em sequência (do mais perto ao mais longe de Brasília) até o último,
   que aparece quando 80% do mapa do Brasil está visível.
   Rolando de volta para cima, eles somem na ordem inversa, então a animação vai e volta com o scroll.
   O amarelo e o nome da cidade no hover ficam no CSS (.map__spot:hover). */
(function () {
  var root = document.documentElement;
  var brasil = document.querySelector('.map__brasil');
  var spots = [].slice.call(document.querySelectorAll('.map__spot'));
  if (!brasil || !spots.length || !root.classList.contains('pins-pending')) return;

  var END_VISIBLE = 0.8; // fração do Brasil visível quando o último pin aparece
  spots.sort(function (a, b) { return a.dataset.order - b.dataset.order; });
  var first = spots[0].querySelector('.map__pin');
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var b = brasil.getBoundingClientRect(), f = first.getBoundingClientRect();
    // mapa preso por baixo dos cases (map-reveal.js): mede como se ele rolasse junto, para manter o ritmo do scroll
    var map = brasil.closest('.map'), d = 0;
    if (map && window.G4F && G4F.mapTop) d = G4F.mapTop() - map.getBoundingClientRect().top;
    b = { top: b.top + d, height: b.height }; f = { bottom: f.bottom + d };
    // rolagem que falta até cada marco, medida pela posição do topo do Brasil na tela
    var startTop = b.top + (vh - f.bottom);          // topo do Brasil quando Brasília entra inteira
    var endTop = vh - b.height * END_VISIBLE;        // topo do Brasil com 80% dele visível
    var p = (startTop - b.top) / Math.max(startTop - endTop, 1); // 0 no início, 1 no fim
    for (var i = 0; i < spots.length; i++) {
      spots[i].classList.toggle('is-in', p >= i / (spots.length - 1) - 1e-6 && f.bottom <= vh);
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
