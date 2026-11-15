/* Pins do mapa, ligados à rolagem: quando o pin de Brasília chega a 85% da altura da tela
   ele aparece, e a cada 70px de rolagem surge o próximo (do mais perto ao mais longe de Brasília).
   Rolando de volta para cima, eles somem na ordem inversa, então a animação vai e volta com o scroll.
   O amarelo e o nome da cidade no hover ficam no CSS (.map__spot:hover). */
(function () {
  var root = document.documentElement;
  var page = document.getElementById('page');
  var spots = [].slice.call(document.querySelectorAll('.map__spot'));
  if (!spots.length || !root.classList.contains('pins-pending')) return;

  var START = 0.85; // fração da altura da tela em que Brasília aparece
  var STEP = 70;    // px de rolagem (do artboard) entre um pin e o próximo
  spots.sort(function (a, b) { return a.dataset.order - b.dataset.order; });
  var first = spots[0].querySelector('.map__pin');
  var ticking = false;

  function update() {
    ticking = false;
    var zoom = parseFloat(page && page.style.zoom) || 1;
    // quanto o pin de Brasília já passou da linha de início, em px do artboard
    var past = (window.innerHeight * START - first.getBoundingClientRect().top) / zoom;
    for (var i = 0; i < spots.length; i++) spots[i].classList.toggle('is-in', past >= i * STEP);
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
