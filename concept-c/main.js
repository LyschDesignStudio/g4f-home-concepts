/* Concept C · Blue Print
   - Hero: as palavras do título entram em cadência (igual aos outros concepts); depois a planta e o botão.
   - Entradas: cada [data-reveal] sobe com fade quando entra na tela (tocam inteiras, sem depender da velocidade
     da rolagem); rolando para cima até sair da tela por baixo, voltam ao início para tocar de novo. */
(function () {
  var root = document.documentElement;

  // ---- hero ----
  var title = document.querySelector('.hero__title');
  if (title && root.classList.contains('hero-pending')) {
    var text = title.textContent.trim(), words = text.split(/\s+/);
    title.setAttribute('aria-label', text);
    title.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--d', (i * 40) + 'ms');
      title.appendChild(s);
      if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
    });
    var started = false;
    var start = function () {
      if (started) return; started = true;
      root.classList.add('hero-in'); root.classList.remove('hero-pending');
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
