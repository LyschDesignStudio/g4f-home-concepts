/* Pins do mapa: quando o Brasil começa a aparecer na tela, os pins surgem um a um
   (Brasília primeiro, depois os mais próximos dela), de 0% até 100% no azul.
   O amarelo e o nome da cidade no hover ficam no CSS (.map__spot:hover). */
(function () {
  var root = document.documentElement;
  var brasil = document.querySelector('.map__brasil');
  var spots = [].slice.call(document.querySelectorAll('.map__spot'));
  if (!brasil || !spots.length || !root.classList.contains('pins-pending')) return;

  var STAGGER = 180; // ms entre um pin e o próximo
  spots.sort(function (a, b) { return a.dataset.order - b.dataset.order; });

  function reveal() {
    spots.forEach(function (s, i) { setTimeout(function () { s.classList.add('is-in'); }, i * STAGGER); });
  }
  if (!('IntersectionObserver' in window)) return reveal();
  var io = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); reveal(); }
  }, { threshold: 0.25 });
  io.observe(brasil);
})();
