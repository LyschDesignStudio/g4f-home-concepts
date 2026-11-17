/* Intro do Concept D (Figma 4686:60133), antes de o site aparecer:
   1. fundo azul e, no centro, o ícone da G4F só em linha (120px numa tela de 1080);
   2. o ícone cresce até 830px e a estrela de dentro se enche de branco;
   3. a estrela vira uma janela: o branco some e ela continua crescendo, mostrando o site por dentro,
      até cobrir a tela toda (o azul sai pelas bordas);
   4. o site fica com a navbar cheia, de ponta a ponta; logo depois ela encolhe e vira a barra flutuante.
   A rolagem fica travada até o fim. Com movimento reduzido não há intro: o site abre direto, já com a barra flutuante. */
(function () {
  var root = document.documentElement;
  var intro = document.querySelector('.intro');
  var nav = document.querySelector('.nav');
  function floatNav() { if (nav) nav.classList.remove('nav--full'); }

  if (!intro || !root.classList.contains('intro-pending')) {
    if (intro) intro.remove();
    floatNav();
    return;
  }

  var svg = intro.querySelector('svg');
  var icon = intro.querySelector('.intro__icon');
  var hole = intro.querySelector('.intro__hole');
  var fill = intro.querySelector('.intro__fill');
  var lines = [].slice.call(intro.querySelectorAll('.intro__line'));
  var bg = intro.querySelector('.intro__bg');

  // trava a rolagem enquanto a intro toca
  var KEYS = { ' ': 1, PageDown: 1, PageUp: 1, End: 1, Home: 1, ArrowDown: 1, ArrowUp: 1 };
  var block = function (e) { if (e.type !== 'keydown' || KEYS[e.key]) e.preventDefault(); };
  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('touchmove', block, { passive: false });
  window.addEventListener('keydown', block);
  function unlock() {
    window.removeEventListener('wheel', block, { passive: false });
    window.removeEventListener('touchmove', block, { passive: false });
    window.removeEventListener('keydown', block);
  }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function inOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function out(x) { return 1 - Math.pow(1 - x, 3); }
  function expoIn(x) { return x === 0 ? 0 : Math.pow(2, 10 * x - 10); }

  // linha do tempo (s)
  var T_LINE = [0.15, 0.95];   // o ícone em linha aparece
  var T_GROW = [1.25, 2.15];   // cresce de 120 até 830 (proporção de uma tela de 1080)
  var T_FILL = [1.55, 2.15];   // a estrela se enche de branco
  var T_OPEN = [2.35, 3.45];   // a janela abre: o branco some e a estrela cresce até cobrir a tela
  var T_END = 3.45;

  var W, H;
  function size() { W = window.innerWidth; H = window.innerHeight; svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); }
  size(); window.addEventListener('resize', size);

  // tamanho do ícone (px) em que a estrela cobre a tela: o miolo dela (no meio dos lados côncavos) mede ~429/830
  // do ícone; com folga, para os cantos da tela também ficarem por dentro das pontas
  function coverSize() { return Math.max(W, H) * 830 / 429 * 1.9; }

  function place(px) {
    var k = px / 830;
    var tf = 'translate(' + (W / 2).toFixed(2) + ' ' + (H / 2).toFixed(2) + ') scale(' + k.toFixed(5) + ') translate(-415 -415)';
    icon.setAttribute('transform', tf);
    hole.setAttribute('transform', tf);
  }

  var t0 = null, done = false;
  function render(t) {
    var u = H / 1080;
    var small = 120 * u, mid = 830 * u;

    var a = out(seg(t, T_LINE[0], T_LINE[1]));
    var g = inOut(seg(t, T_GROW[0], T_GROW[1]));
    var o = seg(t, T_OPEN[0], T_OPEN[1]);
    var px = small * (0.85 + 0.15 * a) + (mid - small) * g;
    // abrindo: acelera no começo e no fim (expo), para a passagem pela tela inteira ser rápida
    px += (coverSize() - mid) * expoIn(o);
    place(px);

    lines.forEach(function (l) { l.setAttribute('opacity', (a * (1 - out(seg(t, T_OPEN[0], T_OPEN[0] + 0.5)))).toFixed(3)); });
    // linha fina e constante na tela (1.5px), por mais que o ícone cresça
    lines.forEach(function (l) { l.setAttribute('stroke-width', (1.5 * 830 / px).toFixed(4)); });
    // a estrela se enche de branco e, ao abrir, o branco sai e revela o site
    var f = out(seg(t, T_FILL[0], T_FILL[1])) * (1 - out(seg(t, T_OPEN[0], T_OPEN[0] + 0.45)));
    fill.setAttribute('opacity', f.toFixed(3));
    // o furo da máscara só passa a existir quando a janela abre (antes, o azul é inteiro atrás do branco)
    hole.setAttribute('opacity', t >= T_OPEN[0] ? '1' : '0');
  }
  function frame(now) {
    if (done) return;
    if (t0 == null) t0 = now;
    var t = (now - t0) / 1000;
    render(t);
    if (t < T_END) { requestAnimationFrame(frame); return; }
    finish();
  }
  render(0);
  window.G4FIntro = { at: render, finish: function () { finish(); } }; // para conferir quadro a quadro

  function finish() {
    if (done) return; done = true;
    intro.remove();
    root.classList.remove('intro-pending');
    unlock();
    // o site fica um instante com a navbar cheia (Figma, frame 4) e então ela vira a barra flutuante
    setTimeout(floatNav, 700);
  }

  // ?intro=pause: a intro fica parada para conferir quadro a quadro (G4FIntro.at(segundos))
  if (/[?&]intro=pause/.test(location.search)) return;
  var started = false;
  function start() { if (started) return; started = true; requestAnimationFrame(frame); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 1500);
  setTimeout(finish, 9000); // segurança: se a animação não chegar a tocar (aba em segundo plano), o site abre assim mesmo
  bg.setAttribute('fill', '#3160e6');
})();
