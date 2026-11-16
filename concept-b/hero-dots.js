/* Malha de pontos do hero, desenhada ao vivo (canvas) a partir da imagem do Figma (assets/hero-dots.png):
   pontos de 8px a cada 26px. Perto do foco ficam nítidos; quanto mais longe, mais cada ponto ganha um rastro
   apontando para fora do foco (um "zoom blur" proporcional à distância). O ícone da G4F aparece em pontos
   escuros no lugar em que está na imagem.
   O foco do desfoque segue o mouse suavemente; quando o mouse sai do hero, ele volta ao ponto da imagem.
   Com o mouse se mexendo em cima do ícone, os pontos dele ficam azulados (mais perto do cursor, mais azuis)
   e voltam devagar ao escuro quando o mouse para ou sai.
   O hero é espelhado (scaleX(-1)) no CSS, então tudo aqui é desenhado no referencial da imagem original.
   Ao carregar, a malha se forma ponto a ponto: uma onda que sai do foco para as bordas, cada ponto
   crescendo e ganhando opacidade (junto com a entrada do título, hero-reveal.js).
   Sem canvas ou com movimento reduzido fica a imagem estática.
   O hero tem a altura da tela e, acima de 1920px, a largura toda: o desenho do Figma (1920 × 1080) fica no centro
   do hero, na largura e na altura (mesma grade, mesmo foco e mesmo ícone), e a malha ganha colunas e linhas extras
   dos lados, em cima e embaixo até preencher a seção (numa tela mais baixa que 1080, sobram as linhas do meio). */
(function () {
  var root = document.documentElement;
  function fallback() { root.classList.remove('herodots-pending'); } // mostra a imagem estática
  var hero = document.querySelector('.hero');
  var bg = hero && hero.querySelector('.hero__bg');
  if (!bg) return fallback();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return fallback();
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return fallback();
  canvas.className = 'hero__dots';
  bg.insertBefore(canvas, bg.firstChild);
  // camada do ícone azulado: por cima da malha e mais opaca que ela (a malha fica a 20%)
  var hi = document.createElement('canvas'), hctx = hi.getContext('2d');
  hi.className = 'hero__dots hero__dots--hi';
  canvas.insertAdjacentElement('afterend', hi);

  var ART = 1920, ARTH = 1080, W = ART, H = ARTH, STEP = 26, OX = 10, OY = 20, R = 4;
  var OFF = 0, OFFY = 0;           // onde o artboard de 1920 × 1080 começa dentro da malha (centralizado no hero)
  var page = document.getElementById('page');
  var HOME0 = [660, 540], HOME = HOME0.slice(); // foco da imagem do Figma
  var R0 = 250, K = 0.085, MAXL = 80; // rastro: começa a R0 do foco e cresce K px por px de distância
  var BG = '#f4f6f8', GRAY = [168, 174, 181], DARK = [69, 74, 84];
  // ícone da G4F em pontos escuros (lido da imagem; coluna 0 = x 374, linha 0 = y 254)
  var ICON = [
    '.......................',
    '........##...##........',
    '.......#########.......',
    '......###########......',
    '.....#############.....',
    '....#..#########..#....',
    '...##......#......##...',
    '..####...........####..',
    '.#####...........#####.',
    '.#####...........#####.',
    '..####...........####..',
    '..#####.........#####..',
    '..####...........####..',
    '.#####...........#####.',
    '.#####...........#####.',
    '..####...........####..',
    '...##......#......##...',
    '....#..#########..#....',
    '.....#############.....',
    '......###########......',
    '.......#########.......',
    '........##...##........',
    '.......................'
  ];
  var IX = (374 - OX) / STEP, IY = (254 - OY) / STEP;

  var COLS0 = Math.floor((ART - OX) / STEP) + 1, ROWS0 = Math.floor((ARTH - OY) / STEP) + 1;
  // entrada: cada ponto aparece num momento, numa onda que sai do foco (com um pouco de acaso)
  var SPREAD = 1500, JITTER = 350, GROW = 450;
  function rnd(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var pts = [], IB = [];
  // tamanho do hero em px do artboard: largura nunca menos que 1920; altura = a da tela, entre 860 e 1440 (igual ao CSS)
  function heroSize() {
    var vh = parseFloat(page && page.style.getPropertyValue('--vh')) || ARTH;
    return [Math.max(ART, Math.round(hero.offsetWidth)), Math.round(Math.min(1440, Math.max(860, vh)))];
  }
  // monta a malha para o tamanho do hero: as linhas e colunas do Figma ficam no centro, as extras completam as bordas
  function build() {
    var sz = heroSize(), w = sz[0], h = sz[1];
    if (w === W && h === H && pts.length) return false;
    W = w; H = h; OFF = (W - ART) / 2; OFFY = (H - ARTH) / 2;
    var extra = Math.ceil(OFF / STEP), cols = COLS0 + extra * 2;
    var extraY = Math.ceil(Math.abs(OFFY) / STEP) + 1;
    HOME = [HOME0[0] + OFF, HOME0[1] + OFFY];
    var maxd = Math.sqrt(Math.pow(Math.max(HOME[0], W - HOME[0]), 2) + Math.pow(Math.max(HOME[1], H - HOME[1]), 2));
    pts = [];
    for (var j = -extraY; j < ROWS0 + extraY; j++) {
      var y0 = OFFY + OY + j * STEP; // j: linha no referencial do Figma (negativa ou além da última nas bordas extras)
      if (y0 < -STEP || y0 > H + STEP) continue;
      for (var c = 0; c < cols; c++) {
        var i = c - extra; // coluna no referencial do Figma
        var row = ICON[j - IY], dark = !!(row && row.charAt(i - IX) === '#');
        var x0 = OFF + OX + i * STEP;
        var dd = Math.sqrt((x0 - HOME[0]) * (x0 - HOME[0]) + (y0 - HOME[1]) * (y0 - HOME[1]));
        pts.push({ x: x0, y: y0, dark: dark, at: Math.min(1, dd / maxd) * SPREAD + rnd((j + 99) * cols + c) * JITTER });
      }
    }
    // área do ícone (com folga) no referencial da imagem
    IB = [OFF + 374 - 40, OFFY + 254 - 40, OFF + 374 + 22 * STEP + 40, OFFY + 254 + 22 * STEP + 40];
    focus = HOME.slice(); target = HOME.slice();
    return true;
  }
  var t0 = performance.now(), intro = true;
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  // sprites: o ponto e o rastro (um cone que afina e some), um de cada cor
  function sprite(rgb) {
    var dot = document.createElement('canvas'); dot.width = dot.height = 32;
    var d = dot.getContext('2d'); d.fillStyle = 'rgb(' + rgb + ')'; d.beginPath(); d.arc(16, 16, 16, 0, Math.PI * 2); d.fill();
    var tail = document.createElement('canvas'); tail.width = 256; tail.height = 32;
    var t = tail.getContext('2d'), g = t.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(' + rgb + ',.7)'); g.addColorStop(0.5, 'rgba(' + rgb + ',.25)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    t.fillStyle = g; t.beginPath(); t.moveTo(0, 0); t.lineTo(256, 10); t.lineTo(256, 22); t.lineTo(0, 32); t.closePath(); t.fill();
    return { dot: dot, tail: tail };
  }
  var SG = sprite(GRAY.join(',')), SD = sprite(DARK.join(','));
  var SB = sprite('49,96,230');    // azul da marca (#3160E6)
  var HI_ALPHA = 0.55;             // opacidade máxima do azul na camada de cima
  var NEAR = 260;                  // raio em que os pontos perto do mouse ficam mais azuis

  var dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2) * Math.min(1, window.innerWidth / 1920);
    dpr = Math.max(dpr, 0.5);
    canvas.width = hi.width = Math.round(W * dpr); canvas.height = hi.height = Math.round(H * dpr);
  }

  var focus = HOME.slice(), target = HOME.slice();
  build();
  var mouse = [-1e4, -1e4], lastMove = -1e9, blue = 0; // blue: 0 = ícone escuro, 1 = azulado
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    var fx = focus[0], fy = focus[1], el = intro ? performance.now() - t0 : 1e9, pending = false;
    for (var n = 0; n < pts.length; n++) {
      var p = pts[n], s = p.dark ? SD : SG, a = 1;
      if (intro) {
        a = (el - p.at) / GROW;
        if (a <= 0) { pending = true; continue; }
        if (a < 1) { pending = true; a = ease(a); ctx.globalAlpha = a; } else a = 1;
      }
      var vx = p.x - fx, vy = p.y - fy, d = Math.sqrt(vx * vx + vy * vy);
      var L = Math.min(MAXL, Math.max(0, d - R0) * K) * a;
      if (L > 0.5) {
        var c = vx / d, sn = vy / d;
        // rastro saindo do ponto para fora do foco
        ctx.setTransform(dpr * c, dpr * sn, -dpr * sn, dpr * c, p.x * dpr, p.y * dpr);
        ctx.drawImage(s.tail, 0, -R, L + R, R * 2);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      var r = R * (0.3 + 0.7 * a);
      ctx.drawImage(s.dot, p.x - r, p.y - r, r * 2, r * 2);
      if (a < 1) ctx.globalAlpha = 1;
    }
    if (intro && !pending) intro = false;
    drawHi();
  }
  // ícone azulado: cada ponto do ícone em azul, mais forte perto do cursor
  var hiOn = false;
  function drawHi() {
    if (blue < 0.01) { if (hiOn) { hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.clearRect(0, 0, hi.width, hi.height); hiOn = false; } return; }
    hiOn = true;
    hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.clearRect(0, 0, hi.width, hi.height);
    var fx = focus[0], fy = focus[1];
    for (var n = 0; n < pts.length; n++) {
      var p = pts[n]; if (!p.dark) continue;
      var mx = p.x - mouse[0], my = p.y - mouse[1];
      var near = Math.max(0, 1 - Math.sqrt(mx * mx + my * my) / NEAR);
      hctx.globalAlpha = HI_ALPHA * blue * (0.5 + 0.5 * near);
      var vx = p.x - fx, vy = p.y - fy, d = Math.sqrt(vx * vx + vy * vy);
      var L = Math.min(MAXL, Math.max(0, d - R0) * K);
      if (L > 0.5) {
        var c = vx / d, sn = vy / d;
        hctx.setTransform(dpr * c, dpr * sn, -dpr * sn, dpr * c, p.x * dpr, p.y * dpr);
        hctx.drawImage(SB.tail, 0, -R, L + R, R * 2);
      }
      hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hctx.drawImage(SB.dot, p.x - R, p.y - R, R * 2, R * 2);
    }
    hctx.globalAlpha = 1;
  }

  var raf = 0, visible = true;
  function frame() {
    raf = 0;
    var dx = target[0] - focus[0], dy = target[1] - focus[1];
    focus[0] += dx * 0.07; focus[1] += dy * 0.07;
    // mouse se mexendo em cima do ícone: azula rápido; parado ou fora: volta devagar ao escuro
    var over = mouse[0] > IB[0] && mouse[0] < IB[2] && mouse[1] > IB[1] && mouse[1] < IB[3];
    var on = over && performance.now() - lastMove < 250 ? 1 : 0;
    blue += (on - blue) * (on ? 0.12 : 0.03);
    draw();
    if (visible && (intro || Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3 || Math.abs(on - blue) > 0.005)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  hero.addEventListener('pointermove', function (ev) {
    var r = hero.getBoundingClientRect();
    // coordenadas do artboard, espelhadas como o fundo
    target[0] = W - ((ev.clientX - r.left) / r.width) * W;
    target[1] = ((ev.clientY - r.top) / r.height) * H;
    mouse = target.slice(); lastMove = performance.now();
    kick();
  });
  hero.addEventListener('pointerleave', function () { target = HOME.slice(); mouse = [-1e4, -1e4]; kick(); });
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
  window.addEventListener('resize', function () { build(); size(); draw(); });

  size(); draw();
  bg.classList.add('is-live'); fallback();
  kick();
})();
