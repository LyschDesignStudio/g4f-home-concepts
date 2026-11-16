/* Cases → mapa: define --reveal-h (altura da janela em px do artboard, já descontando o zoom da página),
   que é quanto o mapa fica preso na tela enquanto os cases sobem por cima dele (CSS .map-reveal).
   Também expõe G4F.mapTop(): a posição que o topo do mapa teria se rolasse junto (= base dos cases),
   usada pelo menu e pelos pins para dispararem no mesmo ritmo do scroll, mesmo com o mapa parado. */
(function () {
  var page = document.getElementById('page');
  var wrap = document.querySelector('.map-reveal');
  var cases = document.querySelector('.cases');
  var map = document.querySelector('.map');
  if (!wrap || !map) return;
  function set() {
    var zoom = parseFloat(page && page.style.zoom) || 1;
    // na página toda: o hero também usa para centralizar a frase na tela
    (page || wrap).style.setProperty('--reveal-h', (window.innerHeight / zoom).toFixed(2) + 'px');
  }
  window.G4F = window.G4F || {};
  window.G4F.mapTop = function () {
    var t = map.getBoundingClientRect().top;
    return cases ? Math.max(t, cases.getBoundingClientRect().bottom) : t;
  };
  window.addEventListener('resize', set);
  set();
})();
