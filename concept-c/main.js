/* Concept C · Blue Print
   - Hero: sequência de entrada em CSS (navbar, título, CTA, bloco do diagrama em máscara, quadro menor).
   - Entradas: cada [data-reveal] sobe com fade quando entra na tela (tocam inteiras, sem depender da velocidade
     da rolagem); rolando para cima até sair da tela por baixo, voltam ao início para tocar de novo. */
(function () {
  var root = document.documentElement;

  // ---- hero: a sequência de entrada é toda em CSS; aqui só dispara quando as fontes carregam ----
  if (root.classList.contains('hero-pending')) {
    var started = false;
    var start = function () {
      if (started) return; started = true;
      // dois quadros: o estado inicial (só o fundo azul) chega a ser pintado antes de a transição começar
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        root.classList.add('hero-in'); root.classList.remove('hero-pending');
      }); });
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
    setTimeout(start, 1200);
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
