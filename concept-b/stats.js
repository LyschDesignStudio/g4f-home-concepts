/* Big numbers: quando a seção entra na tela, os quatro itens aparecem cadenciados (um a cada 220ms)
   e cada número conta até o valor final partindo de um valor próximo (data-from), para não ficar
   um número trocando rápido. As trocas acontecem no máximo a cada 90ms e desaceleram no fim.
   Rolando de volta para cima (seção descendo para o pé da tela), tudo volta ao estado inicial. */
(function () {
  var section = document.querySelector('.stats');
  if (!section) return;
  var items = [].slice.call(section.querySelectorAll('.stat'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 220, DUR = 1600, TICK = 90, TRIGGER = 0.8;

  var vals = [].slice.call(section.querySelectorAll('.stat__val')).map(function (el) {
    var txt = el.textContent.trim(), dec = (txt.split(',')[1] || '').length;
    return { el: el, to: parseFloat(txt.replace(',', '.')), from: parseFloat(el.dataset.from), dec: dec, timer: 0 };
  });
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // trava a largura de cada item no tamanho final (com a fonte já carregada),
  // para os números não empurrarem o layout enquanto contam
  function lock() {
    var z = parseFloat(document.getElementById('page').style.zoom) || 1;
    items.forEach(function (it) { it.style.width = it.getBoundingClientRect().width / z + 'px'; });
  }

  function reset() {
    vals.forEach(function (v) { clearTimeout(v.timer); clearInterval(v.timer); v.el.textContent = fmt(v.from, v.dec); });
  }
  function count(v, delay) {
    v.timer = setTimeout(function () {
      var t0 = performance.now();
      v.timer = setInterval(function () {
        var p = Math.min(1, (performance.now() - t0) / DUR);
        v.el.textContent = fmt(v.from + (v.to - v.from) * easeOut(p), v.dec);
        if (p >= 1) clearInterval(v.timer);
      }, TICK);
    }, delay);
  }

  if (reduced) { section.classList.add('is-in'); return; }

  var on = false, ticking = false;
  items.forEach(function (it, i) { it.style.transitionDelay = (i * STAGGER) + 'ms'; });
  function update() {
    ticking = false;
    var top = section.getBoundingClientRect().top, vh = window.innerHeight;
    if (!on && top <= vh * TRIGGER) {
      on = true; section.classList.add('is-in');
      vals.forEach(function (v, i) { count(v, i * STAGGER + 150); });
    } else if (on && top > vh * 0.92) {
      on = false; section.classList.remove('is-in'); reset();
    }
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    lock(); reset();
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
