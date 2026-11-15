/* Big numbers:
   - Entrada: quando a seção chega a 80% da altura da tela, os quatro itens aparecem cadenciados (um a cada 220ms).
   - Contagem: os números acompanham a rolagem. Cada um parte de um valor próximo (data-from) e chega ao valor
     final conforme a seção sobe da parte de baixo da tela (85%) até perto do topo (25%); cada item começa um
     pouco depois do anterior. Rolando para cima, os números voltam junto.
   - Rolando de volta para cima até a seção descer para o pé da tela, os itens se escondem de novo. */
(function () {
  var section = document.querySelector('.stats');
  if (!section) return;
  var items = [].slice.call(section.querySelectorAll('.stat'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 220;          // ms entre a entrada de um item e a do próximo
  var TRIGGER = 0.8;          // fração da tela em que os itens aparecem
  var START = 0.85, END = 0.25; // topo da seção (fração da tela) onde a contagem começa e termina
  var LAG = 0.08;             // atraso de cada item na contagem (fração do trajeto)

  var vals = [].slice.call(section.querySelectorAll('.stat__val')).map(function (el) {
    var txt = el.textContent.trim(), dec = (txt.split(',')[1] || '').length;
    return { el: el, to: parseFloat(txt.replace(',', '.')), from: parseFloat(el.dataset.from), dec: dec, shown: '' };
  });
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  if (reduced) { section.classList.add('is-in'); return; }

  // trava a largura de cada item no tamanho final (com a fonte já carregada),
  // para os números não empurrarem o layout enquanto mudam
  function lock() {
    var z = parseFloat(document.getElementById('page').style.zoom) || 1;
    items.forEach(function (it) { it.style.width = it.getBoundingClientRect().width / z + 'px'; });
  }
  items.forEach(function (it, i) { it.style.transitionDelay = (i * STAGGER) + 'ms'; });

  var on = false, ticking = false;
  function update() {
    ticking = false;
    var top = section.getBoundingClientRect().top, vh = window.innerHeight;
    if (!on && top <= vh * TRIGGER) { on = true; section.classList.add('is-in'); }
    else if (on && top > vh * 0.92) { on = false; section.classList.remove('is-in'); }

    var p = clamp((vh * START - top) / (vh * (START - END)));
    var span = 1 - LAG * (vals.length - 1);
    vals.forEach(function (v, i) {
      var q = clamp((p - i * LAG) / span);
      var s = fmt(v.from + (v.to - v.from) * q, v.dec);
      if (s !== v.shown) { v.el.textContent = s; v.shown = s; }
    });
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    lock();
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
