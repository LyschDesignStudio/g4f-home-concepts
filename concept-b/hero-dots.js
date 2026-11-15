/* Malha de pontos do hero, desenhada ao vivo (canvas) a partir da imagem do Figma (assets/hero-dots.png):
   pontos de 8px a cada 26px. Perto do foco ficam nítidos; quanto mais longe, mais cada ponto ganha um rastro
   apontando para fora do foco (um "zoom blur" proporcional à distância). O ícone da G4F aparece em pontos
   escuros no lugar em que está na imagem.
   O foco do desfoque segue o mouse suavemente; quando o mouse sai do hero, ele volta ao ponto da imagem.
   O hero é espelhado (scaleX(-1)) no CSS, então tudo aqui é desenhado no referencial da imagem original.
   Sem canvas ou com movimento reduzido fica a imagem estática. */
(function () {
  var hero = document.querySelector('.hero');
  var bg = hero && hero.querySelector('.hero__bg');
  if (!bg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;
  canvas.className = 'hero__dots';
  bg.insertBefore(canvas, bg.firstChild);

  var W = 1920, H = 1080, STEP = 26, OX = 10, OY = 20, R = 4;
  var HOME = [660, 540];           // foco da imagem do Figma
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

  var COLS = Math.floor((W - OX) / STEP) + 1, ROWS = Math.floor((H - OY) / STEP) + 1;
  var pts = [];
  for (var j = 0; j < ROWS; j++) for (var i = 0; i < COLS; i++) {
    var row = ICON[j - IY], dark = !!(row && row.charAt(i - IX) === '#');
    pts.push({ x: OX + i * STEP, y: OY + j * STEP, dark: dark });
  }

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

  var dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2) * Math.min(1, window.innerWidth / 1920);
    dpr = Math.max(dpr, 0.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }

  var focus = HOME.slice(), target = HOME.slice();
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    var fx = focus[0], fy = focus[1];
    for (var n = 0; n < pts.length; n++) {
      var p = pts[n], s = p.dark ? SD : SG;
      var vx = p.x - fx, vy = p.y - fy, d = Math.sqrt(vx * vx + vy * vy);
      var L = Math.min(MAXL, Math.max(0, d - R0) * K);
      if (L > 0.5) {
        var c = vx / d, sn = vy / d;
        // rastro saindo do ponto para fora do foco
        ctx.setTransform(dpr * c, dpr * sn, -dpr * sn, dpr * c, p.x * dpr, p.y * dpr);
        ctx.drawImage(s.tail, 0, -R, L + R, R * 2);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.drawImage(s.dot, p.x - R, p.y - R, R * 2, R * 2);
    }
  }

  var raf = 0, visible = true;
  function frame() {
    raf = 0;
    var dx = target[0] - focus[0], dy = target[1] - focus[1];
    focus[0] += dx * 0.07; focus[1] += dy * 0.07;
    draw();
    if (visible && (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3)) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

  hero.addEventListener('pointermove', function (ev) {
    var r = hero.getBoundingClientRect();
    // coordenadas do artboard, espelhadas como o fundo
    target[0] = W - ((ev.clientX - r.left) / r.width) * W;
    target[1] = ((ev.clientY - r.top) / r.height) * H;
    kick();
  });
  hero.addEventListener('pointerleave', function () { target = HOME.slice(); kick(); });
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(hero);
  window.addEventListener('resize', function () { size(); draw(); });

  size(); draw();
  bg.classList.add('is-live');
})();
