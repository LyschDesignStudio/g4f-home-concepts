/* Degradê da seção de cases desenhado ao vivo (WebGL), a partir das três elipses do Figma (4499:61375):
   elipses azuis desfocadas (blur 50) somadas (plus-lighter) e aplicadas em color-dodge sobre o fundo #011224,
   com a camada "grain" #d9d9d9 em multiply por cima. Onde as elipses se cruzam a soma passa do limite e o
   color-dodge acende o azul claro / ciano, igual ao Figma.
   As elipses seguem o mouse suavemente, cada uma num sentido e intensidade, então a interseção clara
   também se mexe. Sem WebGL (ou com movimento reduzido sem mouse), fica a imagem estática de reserva.
   Cada case do carrossel tem as elipses num lugar (Figma 4513:137924); ao trocar de case, elas deslizam
   e giram até a nova posição (window.G4FCaseBg.go(i), chamado pelo case-slider.js). */
(function () {
  var wrap = document.querySelector('.case__bg');
  var canvas = document.querySelector('.case__gl');
  var section = document.querySelector('.case');
  if (!wrap || !canvas || !section) return;
  var gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  if (!gl) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // elipses no artboard 1920 × 1080: cor e quanto cada uma anda com o mouse
  var E = [
    { col: [0x37, 0x6B, 0xFF], m: [70, 45], spin: 2 },
    { col: [0x37, 0x6B, 0xFF], m: [-55, -35], spin: -1.5 },
    { col: [0x2A, 0x5F, 0xF5], m: [60, -50], spin: 2.5 }
  ];
  // posição das três elipses em cada case: [cx, cy, rx, ry, rotação em graus]
  var CASES = [
    [[1612.75, 182.05, 711.18, 836.59, 26.83], [1014.75, 412.99, 957.75, 1126.64, -27.35], [360.28, 886.79, 666.29, 966.75, -30.79]],     // DNIT
    [[1103.81, -64.43, 711.18, 836.59, 96.98], [1014.76, 412.99, 1134.62, 1234.15, -27.35], [679.42, 1221.22, 666.29, 966.75, -81.07]],   // Banco público
    [[1355.52, 636.89, 753.93, 1343.97, -142.82], [1239.88, 553.75, 1202.81, 1308.32, 9.97], [127.68, -73.41, 706.34, 1024.85, 39.13]],  // MEC
    [[1355.52, 636.89, 753.93, 1343.97, -142.82], [1239.88, 553.75, 1202.81, 1308.32, 9.97], [127.68, -73.41, 706.34, 1024.85, 39.13]]   // Governo estadual
  ];
  var cur0 = CASES[0].map(function (e) { return e.slice(); }); // forma atual (interpolada)
  var from = null, to = null, t0 = 0, MORPH = 1300;

  var vs = 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; uv.y = 1.0 - uv.y; gl_Position = vec4(p, 0.0, 1.0); }';
  var fs = [
    'precision highp float;',
    'varying vec2 uv;',
    'uniform vec2 C[3]; uniform vec2 R[3]; uniform float A[3]; uniform vec3 K[3];',
    'uniform float seed;',
    'const float SIG = 50.0;',
    // cobertura de uma elipse sólida desfocada por gaussiana (sigma 50): 0.5 * erfc(-d / (sigma*sqrt2))
    'float erfApprox(float x){ float s = sign(x); x = abs(x); float t = 1.0/(1.0+0.3275911*x);',
    '  float y = 1.0 - (((((1.061405429*t - 1.453152027)*t) + 1.421413741)*t - 0.284496736)*t + 0.254829592)*t*exp(-x*x); return s*y; }',
    'float cover(vec2 q, vec2 c, vec2 r, float a){',
    '  vec2 d = q - c; float cs = cos(a), sn = sin(a);',
    '  vec2 l = vec2(cs*d.x + sn*d.y, -sn*d.x + cs*d.y);',  // para o referencial da elipse
    '  float k = length(l / r); vec2 g = l / (r*r);',
    '  float sd = (1.0 - k) * k / max(length(g), 1e-6);',   // distância (positiva dentro) aproximada
    '  return 0.5 * (1.0 + erfApprox(sd / (SIG * 1.41421356))); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + seed) * 43758.5453); }',
    'void main(){',
    '  vec2 q = uv * vec2(1920.0, 1080.0);',
    '  vec3 S = vec3(0.0);',
    '  for (int i = 0; i < 3; i++) S += K[i] * cover(q, C[i], R[i], A[i]);',  // plus-lighter
    '  vec3 base = vec3(1.0, 18.0, 36.0) / 255.0;',
    '  vec3 raw = base / max(vec3(1.0) - S, vec3(1e-3));',                      // color-dodge
    '  vec3 col = raw / pow(vec3(1.0) + pow(raw, vec3(6.0)), vec3(1.0 / 6.0));', // saturação suave (sem borda dura no ciano)
    '  col *= 0.77;',                                                              // grain #d9d9d9 multiply + textura (calibrado contra o render do Figma)
    '  col += (hash(gl_FragCoord.xy) - 0.5) * 0.035;',                            // grão fino, evita faixas
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
  } catch (e) { return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uC = gl.getUniformLocation(prog, 'C'), uR = gl.getUniformLocation(prog, 'R'), uA = gl.getUniformLocation(prog, 'A'), uK = gl.getUniformLocation(prog, 'K'), uSeed = gl.getUniformLocation(prog, 'seed');
  gl.uniform3fv(uK, [].concat.apply([], E.map(function (e) { return e.col.map(function (v) { return v / 255; }); })));
  gl.uniform1f(uSeed, 0.0);

  // tamanho do canvas: metade da resolução da tela (é tudo desfocado; o grão continua fino)
  function size() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.round(r.width * dpr * 0.5)), h = Math.max(2, Math.round(r.height * dpr * 0.5));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }

  var target = [0, 0], cur = [0, 0], raf = 0, visible = false;
  function draw() {
    var c = [], r = [], a = [];
    E.forEach(function (e, i) {
      var g = cur0[i];
      c.push(g[0] + e.m[0] * cur[0], g[1] + e.m[1] * cur[1]);
      r.push(g[2], g[3]);
      a.push((g[4] + e.spin * cur[0]) * Math.PI / 180);
    });
    gl.uniform2fv(uC, c); gl.uniform2fv(uR, r); gl.uniform1fv(uA, a);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function morphing(now) {
    if (!to) return false;
    var k = reduced ? 1 : Math.min(1, (now - t0) / MORPH), e = easeIO(k);
    for (var i = 0; i < 3; i++) for (var j = 0; j < 5; j++) cur0[i][j] = from[i][j] + (to[i][j] - from[i][j]) * e;
    if (k >= 1) { to = null; return false; }
    return true;
  }
  function frame(now) {
    raf = 0;
    var busy = morphing(now || performance.now());
    // aproxima suavemente da posição do mouse (sem tranco ao entrar/sair)
    var dx = target[0] - cur[0], dy = target[1] - cur[1];
    cur[0] += dx * 0.045; cur[1] += dy * 0.045;
    draw();
    if (visible && (busy || Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4)) raf = requestAnimationFrame(frame);
  }
  // troca de case: parte da forma atual (mesmo no meio de outra troca) e vai até a do case pedido;
  // a rotação segue pelo caminho mais curto (uma elipse girada 180° é a mesma elipse)
  window.G4FCaseBg = {
    go: function (idx) {
      var dest = CASES[idx]; if (!dest) return;
      from = cur0.map(function (e) { return e.slice(); });
      to = dest.map(function (e, i) {
        var d = e.slice(), diff = ((d[4] - from[i][4]) % 180 + 270) % 180 - 90;
        d[4] = from[i][4] + diff; return d;
      });
      t0 = performance.now(); kick();
    }
  };
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  if (!reduced) {
    section.addEventListener('pointermove', function (ev) {
      var r = section.getBoundingClientRect();
      target[0] = ((ev.clientX - r.left) / r.width) * 2 - 1;
      target[1] = ((ev.clientY - r.top) / r.height) * 2 - 1;
      kick();
    });
    section.addEventListener('pointerleave', function () { target[0] = 0; target[1] = 0; kick(); });
  }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { size(); kick(); } }, { rootMargin: '100px' }).observe(section);
  window.addEventListener('resize', function () { size(); draw(); });

  size(); draw();
  wrap.classList.add('is-live');
})();
