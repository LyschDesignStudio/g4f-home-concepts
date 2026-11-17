/* Intro do Concept D (Figma 4686:60133), antes de o site aparecer:
   1. fundo azul e, no centro, o ícone da G4F só em linha (120px numa tela de 1080);
   2. o ícone cresce e, já enquanto cresce, a estrela de dentro é uma janela (máscara) que mostra o site por dentro;
      ele segue crescendo até a janela cobrir a tela toda (o azul sai pelas bordas);
      Dentro da janela só aparece o fundo branco do site;
   3. coberta a tela, o hero entra em sequência (CSS .intro-out): a malha de pontos, o menu descendo do topo, o título,
      o botão e os cards de números. A barra flutuante só aparece quando a página rola (main.js).
   A rolagem fica travada até o fim. Com movimento reduzido não há intro: o site abre direto. */
(function () {
  var root = document.documentElement;
  var intro = document.querySelector('.intro');

  if (!intro || !root.classList.contains('intro-pending')) {
    if (intro) intro.remove();
    return;
  }

  var svg = intro.querySelector('svg');
  var icon = intro.querySelector('.intro__icon');
  var hole = intro.querySelector('.intro__hole');
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
  function sine(x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  function out(x) { return 1 - Math.pow(1 - x, 3); }

  // linha do tempo (s)
  var T_LINE = [0.15, 0.95];   // o ícone em linha aparece
  var T_GROW = [1.2, 3.4];     // cresce de 120px (numa tela de 1080) até a janela cobrir a tela
  var T_HOLE = [1.2, 1.5];     // a janela (máscara) se abre logo no começo do crescimento
  var T_LINEOUT = [2.6, 3.2];  // as linhas saem quando o ícone já passou das bordas
  var T_END = 3.4;

  var W, H;
  function size() { W = window.innerWidth; H = window.innerHeight; svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); }
  size(); window.addEventListener('resize', size);

  // tamanho do ícone (px) em que a estrela cobre a tela: o ponto mais fundo dos lados côncavos fica a 214/830 do
  // centro, então o ícone precisa de ~1,94× o maior lado da tela; com uma folga pequena (os cantos ficam nas pontas)
  function coverSize() { return Math.max(W, H) * 2.15; }

  function place(px) {
    var k = px / 830;
    var tf = 'translate(' + (W / 2).toFixed(2) + ' ' + (H / 2).toFixed(2) + ') scale(' + k.toFixed(5) + ') translate(-415 -415)';
    icon.setAttribute('transform', tf);
    hole.setAttribute('transform', tf);
  }

  var t0 = null, done = false;
  function render(t) {
    var u = H / 1080;
    var small = 120 * u;

    var a = out(seg(t, T_LINE[0], T_LINE[1]));
    var g = sine(seg(t, T_GROW[0], T_GROW[1]));
    // crescimento em escala exponencial (o zoom parece constante ao olho), com saída e chegada suaves
    var start = small * (0.85 + 0.15 * a);
    var px = start * Math.pow(coverSize() / start, g);
    place(px);

    var lo = a * (1 - out(seg(t, T_LINEOUT[0], T_LINEOUT[1])));
    lines.forEach(function (l) {
      l.setAttribute('opacity', lo.toFixed(3));
      l.setAttribute('stroke-width', (1.5 * 830 / px).toFixed(4)); // linha fina e constante na tela (1.5px)
    });
    // a janela abre logo que o ícone começa a crescer: o site aparece dentro da estrela
    hole.setAttribute('opacity', out(seg(t, T_HOLE[0], T_HOLE[1])).toFixed(3));
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
    root.classList.add('intro-out');
    root.classList.remove('intro-pending');
    unlock();
    setTimeout(function () { root.classList.remove('intro-out'); }, 2600); // fim da entrada do hero
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
