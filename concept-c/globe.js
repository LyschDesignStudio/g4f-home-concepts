/* Mapa · globo 3D ao vivo (Concept C · Blue Print)
   O globo é desenhado num canvas com projeção ortográfica de verdade (d3-geo + contornos do world-atlas), no estilo
   do Figma 4648:67833: esfera escura com contorno azul, grade de 15°, equador, trópicos tracejados, continentes em
   azul-escuro e o Brasil em azul brand.
   - Rolagem: o globo sobe de baixo para cima e gira na vertical até centralizar o Brasil (preso à rolagem: chega ao
     lugar quando o centro do globo encosta no meio da tela; rolando para cima, desfaz).
   - Mouse: mexendo o mouse sobre a seção, o globo gira um pouco para o lado e para cima/baixo, acompanhando (suave).
   - Pins: começam escondidos; quando o globo chega ao lugar, crescem um a um até o tamanho do Figma (azul #8FB0FF).
     Com o mouse em cima, ficam amarelos (#FFE554) e mostram o nome da cidade. Seguem o giro do globo e somem
     quando passam para o lado de trás.
   Sem as bibliotecas (ou com movimento reduzido sem elas), fica a imagem estática do Figma. */
(function () {
  var map = document.querySelector('.map');
  var globe = map && map.querySelector('.globe');
  var host = globe && globe.querySelector('.globe__live');
  if (!host || !window.d3 || !window.topojson) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.getElementById('page');

  // cidades (lon, lat); a ordem é a ordem em que os pins crescem
  var CITIES = [
    { name: 'Brasília · matriz', at: [-47.88, -15.79] },
    { name: 'Goiânia', at: [-49.25, -16.68] },
    { name: 'Belo Horizonte', at: [-43.94, -19.92] },
    { name: 'Fortaleza', at: [-38.52, -3.73] },
    { name: 'São Paulo', at: [-46.63, -23.55] },
    { name: 'Rio de Janeiro', at: [-43.17, -22.91] },
    { name: 'Recife', at: [-34.88, -8.05] }
  ];
  var SIZE = 1100, R = 520, C = SIZE / 2;  // canvas (px do artboard), raio do globo (Figma: 1040 de diâmetro)
  var HOME = [52, 13];                     // giro final: Brasil no centro (λ, φ do d3)
  var START = [64, -52];                   // giro inicial: o globo vem "olhando" para o norte, o Brasil embaixo
  var MOUSE = [18, 8];                     // quanto o mouse gira o globo (graus, para cada lado)
  var RISE = 420;                          // quanto o globo sobe na entrada (px do artboard)
  var GLOBE_Y = 976;                       // centro do globo, em px do artboard a partir do topo do mapa (205 + 550 + 221)
  var brBox = null;                        // caixa do Brasil no canvas, com o globo no lugar (para disparar os pins)

  var canvas = document.createElement('canvas');
  canvas.className = 'globe__canvas';
  host.insertBefore(canvas, host.firstChild); // embaixo dos degradês dos cantos
  var ctx = canvas.getContext('2d');
  var layer = document.createElement('div');
  layer.className = 'globe__pins';
  globe.appendChild(layer); // por cima dos degradês, que ficam fixos na seção

  var proj = d3.geoOrthographic().scale(R).translate([C, C]).clipAngle(90).precision(0.3);
  var path = d3.geoPath(proj, ctx);
  var grid = d3.geoGraticule().step([15, 15])();
  var equator = { type: 'LineString', coordinates: d3.range(-180, 181, 2).map(function (x) { return [x, 0]; }) };
  function parallel(lat) { return { type: 'LineString', coordinates: d3.range(-180, 181, 2).map(function (x) { return [x, lat]; }) }; }
  var tropics = [parallel(23.44), parallel(-23.44)];
  var land = null, brazil = null;

  var dpr = 1;
  function size() {
    var z = parseFloat(page.style.zoom) || 1;
    dpr = Math.min(window.devicePixelRatio || 1, 2) * z;
    canvas.width = canvas.height = Math.round(SIZE * dpr);
  }

  // pins (DOM, por cima do canvas)
  var pins = CITIES.map(function (c, i) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'globe-pin';
    el.setAttribute('aria-label', c.name);
    el.innerHTML = '<span class="globe-pin__dot"></span><span class="globe-pin__label"><span class="t">' + c.name + '</span></span>';
    layer.appendChild(el);
    return { el: el, at: c.at };
  });

  var rot = START.slice(), mouse = [0, 0], mouseT = [0, 0], p = reduced ? 1 : 0, raf = 0, dirty = true;

  function draw() {
    var r = [rot[0] + mouse[0] * MOUSE[0], rot[1] + mouse[1] * MOUSE[1]];
    proj.rotate(r);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    // esfera
    ctx.beginPath(); path({ type: 'Sphere' });
    ctx.fillStyle = 'rgba(1,26,51,.9)'; ctx.fill();
    // grade
    ctx.beginPath(); path(grid);
    ctx.strokeStyle = 'rgba(69,127,255,.35)'; ctx.lineWidth = 0.8; ctx.stroke();
    // continentes e Brasil
    if (land) {
      ctx.beginPath(); path(land);
      ctx.fillStyle = 'rgba(2,43,87,.85)'; ctx.fill();
      ctx.strokeStyle = 'rgba(49,96,230,.8)'; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.beginPath(); path(brazil);
      ctx.fillStyle = '#3160e6'; ctx.fill();
      ctx.strokeStyle = '#3160e6'; ctx.lineWidth = 1.1; ctx.stroke();
    }
    // equador, trópicos (tracejados) e o meridiano central
    ctx.beginPath(); path(equator);
    ctx.strokeStyle = 'rgba(69,127,255,.9)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); tropics.forEach(function (t) { path(t); });
    ctx.strokeStyle = 'rgba(69,127,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); path({ type: 'LineString', coordinates: d3.range(-90, 91, 2).map(function (y) { return [-r[0], y]; }) });
    ctx.strokeStyle = 'rgba(69,127,255,.8)'; ctx.stroke();
    ctx.setLineDash([]);
    // contorno da esfera
    ctx.beginPath(); path({ type: 'Sphere' });
    ctx.strokeStyle = '#457fff'; ctx.lineWidth = 1.4; ctx.stroke();
    // sombra da base (Figma, Ellipse 7): por cima de tudo, o globo escurece da metade para baixo até quase preto,
    // fazendo a passagem para o rodapé (preto a 80% na base)
    var shade = ctx.createLinearGradient(0, C - 22.5, 0, C + R);
    shade.addColorStop(0, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.8)');
    ctx.beginPath(); ctx.arc(C, C, R + 1, 0, Math.PI * 2);
    ctx.fillStyle = shade; ctx.fill();
    drawRoutes();
    // pins: seguem o giro; do lado de trás somem
    var center = [-r[0], -r[1]];
    pins.forEach(function (pin) {
      var xy = proj(pin.at), front = d3.geoDistance(pin.at, center) < Math.PI / 2 - 0.05;
      pin.el.style.transform = 'translate(' + xy[0].toFixed(1) + 'px,' + xy[1].toFixed(1) + 'px)';
      pin.el.classList.toggle('is-back', !front);
    });
  }

  // ---- rotas: de Brasília, como rotas de avião, até cada cidade ----
  // Brasília aparece primeiro; depois sai uma rota para cada cidade, uma de cada vez (um pouco sobrepostas): a linha
  // se desenha em arco, com um ponto na frente, e o pin da cidade cresce quando ela chega. Com todos os pins na tela,
  // as rotas somem e fica só a interação dos pins.
  var ROUTE = { first: 450, gap: 380, draw: 1000, hold: 700, fade: 900 }; // ms
  var seq = { playing: false, t0: 0, shown: 0 };
  function setPin(i, on) { pins[i].el.classList.toggle('is-on', on); }
  function startRoutes() {
    seq.playing = !reduced; seq.t0 = performance.now(); seq.shown = 0;
    setPin(0, true);                                   // Brasília
    if (reduced) pins.forEach(function (_, i) { setPin(i, true); });
    kick();
  }
  function stopRoutes() { seq.playing = false; pins.forEach(function (_, i) { setPin(i, false); }); dirty = true; kick(); }
  function arc(a, b, k) {
    // pontos do caminho mais curto entre a e b, levantados para fora do globo como um voo (altura pelo seno)
    var f = d3.geoInterpolate(a, b), pa = proj(a), pb = proj(b);
    var len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]), lift = Math.min(150, len * 0.55), out = [];
    for (var i = 0; i <= 40 * k; i++) {
      var t = i / 40, xy = proj(f(t)), dx = xy[0] - C, dy = xy[1] - C, d = Math.hypot(dx, dy) || 1, h = Math.sin(Math.PI * t) * lift;
      out.push([xy[0] + dx / d * h * 0.35, xy[1] + dy / d * h * 0.35 - h * 0.9]);
    }
    return out;
  }
  function drawRoutes() {
    if (!seq.playing) return;
    var el = performance.now() - seq.t0, n = pins.length - 1;
    var end = ROUTE.first + (n - 1) * ROUTE.gap + ROUTE.draw;   // quando a última rota chega
    var alpha = 1 - Math.max(0, Math.min(1, (el - end - ROUTE.hold) / ROUTE.fade));
    if (alpha <= 0) { seq.playing = false; return; }
    for (var i = 1; i <= n; i++) {
      var k = (el - ROUTE.first - (i - 1) * ROUTE.gap) / ROUTE.draw;
      if (k <= 0) continue;
      k = Math.min(1, k); k = 1 - Math.pow(1 - k, 2);           // desacelera ao chegar
      if (k >= 1 && !pins[i].el.classList.contains('is-on')) setPin(i, true);
      var pts = arc(pins[0].at, pins[i].at, k);
      if (pts.length < 2) continue;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.strokeStyle = 'rgba(143,176,255,' + (0.85 * alpha).toFixed(3) + ')'; ctx.lineWidth = 1.4; ctx.stroke();
      if (k < 1) { // ponto na frente da rota
        var h = pts[pts.length - 1];
        ctx.beginPath(); ctx.arc(h[0], h[1], 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,229,84,' + alpha.toFixed(3) + ')'; ctx.fill();
      }
    }
  }

  function frame() {
    raf = 0;
    mouse[0] += (mouseT[0] - mouse[0]) * 0.06;
    mouse[1] += (mouseT[1] - mouse[1]) * 0.06;
    draw();
    if (Math.abs(mouseT[0] - mouse[0]) > 0.001 || Math.abs(mouseT[1] - mouse[1]) > 0.001 || dirty || seq.playing) { dirty = false; kick(); }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  // ---- rolagem: sobe e gira até o Brasil ----
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  var pinsOn = false;
  function onScroll() {
    if (reduced) { p = 1; } else {
      var z = parseFloat(page.style.zoom) || 1, vh = window.innerHeight;
      var top = map.getBoundingClientRect().top;
      var end = vh / 2 - GLOBE_Y * z; // topo do mapa quando o centro do globo está no meio da tela
      p = Math.max(0, Math.min(1, (vh - top) / Math.max(vh - end, 1)));
    }
    var e = ease(p);
    rot[0] = START[0] + (HOME[0] - START[0]) * e;
    rot[1] = START[1] + (HOME[1] - START[1]) * e;
    host.style.transform = layer.style.transform = 'translateY(' + ((1 - e) * RISE).toFixed(1) + 'px)'; // pins andam junto com o globo
    host.style.opacity = (p * p * (3 - 2 * p)).toFixed(3); // fade de entrada ao longo de todo o movimento (0 → 1, suave nas duas pontas)
    // pins: crescem quando um pouco mais da metade do Brasil está na tela (abaixo da navbar), com o título da seção
    // ainda à vista; se o Brasil voltar a sair por baixo da tela (rolando para cima), escondem de novo
    if (brBox) {
      var hr = host.getBoundingClientRect(), k = hr.height / SIZE;              // px da tela por px do canvas
      var bt = hr.top + brBox[0][1] * k, bb = hr.top + brBox[1][1] * k;          // topo e base do Brasil na tela
      var navB = 80 * (parseFloat(page.style.zoom) || 1);
      var seen = (Math.min(window.innerHeight, bb) - Math.max(navB, bt)) / Math.max(bb - bt, 1);
      if (!pinsOn && seen >= 0.55) { pinsOn = true; startRoutes(); }
      else if (pinsOn && bt > window.innerHeight) { pinsOn = false; stopRoutes(); }
    }
    dirty = true; kick();
  }

  // ---- mouse ----
  if (!reduced) {
    map.addEventListener('pointermove', function (ev) {
      var r = map.getBoundingClientRect();
      mouseT[0] = ((ev.clientX - r.left) / r.width) * 2 - 1;
      mouseT[1] = -(((ev.clientY - r.top) / r.height) * 2 - 1);
      kick();
    });
    map.addEventListener('pointerleave', function () { mouseT = [0, 0]; kick(); });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { size(); onScroll(); });

  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
    .then(function (r) { return r.json(); })
    .then(function (world) {
      var countries = topojson.feature(world, world.objects.countries);
      land = topojson.merge(world, world.objects.countries.geometries);
      brazil = countries.features.filter(function (f) { return f.id === '076'; })[0];
      proj.rotate(HOME); brBox = d3.geoPath(proj).bounds(brazil);
      size(); onScroll();
      globe.classList.add('is-live'); // a partir daqui some a imagem estática
    })
    .catch(function () { /* sem os contornos fica a imagem estática */ });
})();
