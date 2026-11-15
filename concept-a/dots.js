/* Malha de pontos interativa do hero.
   A grade é a mesma do Figma (35 × 50 pontos de 4px, passo 55,5 × 44px, a 8px do topo de cada linha).
   Perto do cursor os pontos se afastam com mola, e as ligações entre vizinhos aparecem,
   revelando a malha que se deforma; ao sair, tudo volta ao lugar com um leve balanço. */
(function () {
  var host = document.querySelector('.dots');
  var hero = document.querySelector('.hero');
  if (!host || !hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var W = 1920, H = 2176, COLS = 35, ROWS = 50, SX = 55.5, SY = 44, OY = 8, SIZE = 4;
  var RADIUS = 220;        // alcance do cursor (px do artboard)
  var PUSH = 46;           // deslocamento máximo
  var SPRING = 0.075, DAMP = 0.8;
  var BASE = [226, 226, 226], BRAND = [49, 96, 230];

  var canvas = document.createElement('canvas');
  canvas.className = 'dots__canvas';
  host.insertBefore(canvas, host.firstChild);
  host.classList.add('dots--live');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  var n = COLS * ROWS, hx = new Float32Array(n), hy = new Float32Array(n),
      dx = new Float32Array(n), dy = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n),
      glow = new Float32Array(n);
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
    var i = r * COLS + c; hx[i] = c * SX + SIZE / 2; hy[i] = r * SY + OY + SIZE / 2;
  }

  var mx = -9999, my = -9999, active = false, raf = 0;

  function smooth(t) { return t * t * (3 - 2 * t); }
  function mix(a, b, t) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }

  function step() {
    var moving = false;
    for (var i = 0; i < n; i++) {
      var tx = 0, ty = 0, g = 0;
      if (active) {
        var ex = hx[i] - mx, ey = hy[i] - my, d = Math.sqrt(ex * ex + ey * ey);
        if (d < RADIUS) {
          var f = smooth(1 - d / RADIUS);
          var k = d > 0.001 ? PUSH * f / d : 0;
          tx = ex * k; ty = ey * k; g = f;
        }
      }
      vx[i] = (vx[i] + (tx - dx[i]) * SPRING) * DAMP;
      vy[i] = (vy[i] + (ty - dy[i]) * SPRING) * DAMP;
      dx[i] += vx[i]; dy[i] += vy[i];
      glow[i] += (g - glow[i]) * 0.15;
      if (Math.abs(vx[i]) + Math.abs(vy[i]) > 0.01 || Math.abs(dx[i]) + Math.abs(dy[i]) > 0.05 || glow[i] > 0.003) moving = true;
    }
    return moving;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // ligações da malha (só onde há brilho)
    ctx.lineWidth = 1;
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var i = r * COLS + c;
      var x = hx[i] + dx[i], y = hy[i] + dy[i];
      if (c < COLS - 1) line(i, i + 1, x, y);
      if (r < ROWS - 1) line(i, i + COLS, x, y);
    }
    for (var j = 0; j < n; j++) {
      var g2 = glow[j], s = SIZE * (1 + g2 * 0.6);
      ctx.fillStyle = g2 > 0.01 ? mix(BASE, BRAND, g2) : 'rgb(226,226,226)';
      ctx.fillRect(hx[j] + dx[j] - s / 2, hy[j] + dy[j] - s / 2, s, s);
    }
  }
  function line(a, b, x, y) {
    var a2 = Math.min(glow[a], glow[b]);
    if (a2 < 0.02) return;
    ctx.strokeStyle = 'rgba(49,96,230,' + (a2 * 0.35).toFixed(3) + ')';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx[b] + dx[b], hy[b] + dy[b]); ctx.stroke();
  }

  function loop() {
    var moving = step(); draw();
    raf = moving || active ? requestAnimationFrame(loop) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  hero.addEventListener('pointermove', function (e) {
    var rect = host.getBoundingClientRect(), scale = rect.width / W;
    mx = (e.clientX - rect.left) / scale; my = (e.clientY - rect.top) / scale;
    active = true; kick();
  });
  hero.addEventListener('pointerleave', function () { active = false; kick(); });

  draw();
})();
