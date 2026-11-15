/* Globo interativo: ao mover o mouse sobre a seção do mapa, o globo inclina levemente
   (perspectiva 3D em torno do centro dele) na direção do cursor, como se o girássemos.
   O Brasil, os pins e os nomes das cidades andam um pouco mais que os pontos de fundo,
   o que dá profundidade. Movimento suavizado; ao tirar o mouse, volta devagar ao lugar. */
(function () {
  var map = document.querySelector('.map');
  var globe = document.querySelector('.map__globe');
  if (!map || !globe) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var CX = 1021, CY = 912;          // centro do globo no artboard (left 152 + 869, top −43 + 955)
  var ROT_Y = 7, ROT_X = 5;         // inclinação máxima em graus
  var SHIFT_BACK = 14, SHIFT_FRONT = 30; // deslocamento máximo (px) dos pontos e da camada da frente
  var EASE = 0.06;

  var layers = [{ el: globe, shift: SHIFT_BACK }];
  [].slice.call(map.querySelectorAll('.map__brasil, .map__pin, .map__label')).forEach(function (el) {
    layers.push({ el: el, shift: SHIFT_FRONT });
  });
  layers.forEach(function (l) {
    l.el.style.transformOrigin = (CX - l.el.offsetLeft) + 'px ' + (CY - l.el.offsetTop) + 'px';
    l.el.style.willChange = 'transform';
  });

  var tx = 0, ty = 0, x = 0, y = 0, raf = 0;

  function frame() {
    x += (tx - x) * EASE; y += (ty - y) * EASE;
    var rot = ' rotateY(' + (x * ROT_Y).toFixed(3) + 'deg) rotateX(' + (-y * ROT_X).toFixed(3) + 'deg)';
    for (var i = 0; i < layers.length; i++) {
      var s = layers[i].shift;
      layers[i].el.style.transform = 'perspective(2200px) translate(' + (x * s).toFixed(2) + 'px,' + (y * s * 0.7).toFixed(2) + 'px)' + rot;
    }
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(frame) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  map.addEventListener('pointermove', function (e) {
    var r = map.getBoundingClientRect();
    tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    kick();
  });
  map.addEventListener('pointerleave', function () { tx = 0; ty = 0; kick(); });
})();
