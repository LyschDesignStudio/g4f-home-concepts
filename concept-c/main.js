/* Concept C · Blue Print
   - Hero: sequência de entrada em CSS (navbar, título, CTA, bloco do diagrama em máscara, quadro menor).
   - Entradas: cada [data-reveal] sobe com fade quando entra na tela (tocam inteiras, sem depender da velocidade
     da rolagem); rolando para cima até sair da tela por baixo, voltam ao início para tocar de novo. */
(function () {
  var root = document.documentElement;

  // ---- hero: a sequência de entrada é toda em CSS; aqui o diagrama vira SVG inline (as placas da sanfona
  //      precisam ser elementos da página) e a entrada dispara quando as fontes e o SVG estão prontos ----
  var art = document.querySelector('.hero__art');
  var svgReady = !art ? Promise.resolve() : fetch(art.querySelector('img').getAttribute('src'))
    .then(function (r) { return r.ok ? r.text() : null; })
    .then(function (txt) { if (txt && txt.indexOf('<svg') > -1) art.innerHTML = txt.slice(txt.indexOf('<svg')); })
    .catch(function () {}); // sem o SVG inline fica a imagem estática (sem sanfona)
  if (root.classList.contains('hero-pending')) {
    var started = false;
    var start = function () {
      if (started) return; started = true;
      // dois quadros: o estado inicial (só o fundo azul) chega a ser pintado antes de a transição começar
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        root.classList.add('hero-in'); root.classList.remove('hero-pending');
        setTimeout(function () { root.classList.add('hero-settled'); }, 3600); // fim da entrada (a última parte termina ~3,4s)
      }); });
    };
    Promise.all([document.fonts && document.fonts.ready ? document.fonts.ready : null, svgReady]).then(start);
    setTimeout(start, 1500);
  }

  // ---- hero + big numbers: a coluna de números empurra o bloco do diagrama e o diagrama comprime (segue a rolagem) ----
  var intro = document.querySelector('.intro'), hero = document.querySelector('.hero');
  var page = document.getElementById('page');
  if (intro && hero) {
    var RUN = 1000; // altura da coluna de números (px do artboard): é o trecho em que o hero fica preso
    var tick = false;
    var push = function () {
      tick = false;
      var z = parseFloat(page.style.zoom) || 1;
      var s = (80 * z - intro.getBoundingClientRect().top) / z;       // quanto já rolou dentro do bloco (px do artboard)
      var d = Math.max(0, Math.min(RUN, s));
      hero.style.setProperty('--push', d.toFixed(1) + 'px');            // o bloco do diagrama sobe junto com o topo dos números
      hero.style.setProperty('--c', (d / RUN).toFixed(4));              // e o diagrama comprime aos poucos
    };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(push); } }, { passive: true });
    window.addEventListener('resize', push);
    push();
  }

  // ---- navbar: ao rolar, o logo vira só o ícone (encostado a 24px da esquerda) ----
  var nav = document.querySelector('.nav');
  if (nav) {
    var compact = function () { nav.classList.toggle('nav--compact', window.scrollY > 8); };
    window.addEventListener('scroll', compact, { passive: true });
    compact();
  }

  // ---- entradas com a rolagem ----
  if (!root.classList.contains('reveal-pending')) return;
  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
  var IN = 0.88; // fração da tela em que o item dispara
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    items.forEach(function (el) {
      var top = el.getBoundingClientRect().top;
      if (top <= vh * IN) el.classList.add('is-in');
      else if (top > vh) el.classList.remove('is-in');
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
