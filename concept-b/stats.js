/* Big numbers:
   - Entrada: quando a seção chega a 80% da altura da tela, os quatro itens aparecem cadenciados (um a cada 220ms).
   - Contagem: os números acompanham a rolagem. Cada um parte de um valor próximo (data-from) e chega ao valor
     final conforme a linha dos números sobe do pé da tela até o meio dela: com os números no meio da tela,
     todos já estão no valor final. Cada item começa um pouco depois do anterior (e todos terminam juntos no meio). A opacidade do número e da descrição sobe de 0 a 100% no mesmo trajeto.
     Rolando para cima, os números voltam junto (valor e opacidade).
   - Rolando de volta para cima até a seção descer para o pé da tela, os itens se escondem de novo.
   - O trajeto usa a altura da tela: numa tela alta, em que os números já aparecem sem rolar, a contagem parte
     de onde eles estão com a página no topo (e não do pé da tela). Assim, com a página no topo, os números
     estão sempre em 0% e no valor inicial, nunca a meio caminho; e sempre sobra um trecho de rolagem
     (MIN_RUN da tela) para a contagem acontecer. */
(function () {
  var section = document.querySelector('.stats');
  if (!section) return;
  var items = [].slice.call(section.querySelectorAll('.stat'));
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STAGGER = 220;          // ms entre a entrada de um item e a do próximo
  var TRIGGER = 0.8;          // fração da tela em que os itens aparecem
  var START = 1, END = 0.5;   // centro da linha dos números (fração da tela) onde a contagem começa e termina
  var LAG = 0.08;             // atraso de cada item na contagem (fração do trajeto)
  var MIN_RUN = 0.2;          // trajeto mínimo da contagem (fração da tela)

  var vals = [].slice.call(section.querySelectorAll('.stat__val')).map(function (el) {
    var txt = el.textContent.trim(), dec = (txt.split(',')[1] || '').length;
    return { el: el, num: el.closest('.stat__num'), desc: el.closest('.stat').querySelector('.stat__desc'), to: parseFloat(txt.replace(',', '.')), from: parseFloat(el.dataset.from), dec: dec, shown: '' };
  });
  function fmt(v, dec) { return v.toFixed(dec).replace('.', ','); }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  if (reduced) { section.classList.add('is-in'); return; }

  // trava a largura de cada item no tamanho final (com a fonte já carregada),
  // para os números não empurrarem o layout enquanto mudam
  function lock() {
    var z = parseFloat(document.getElementById('page').style.zoom) || 1;
    items.forEach(function (it) {
      var w = it.getBoundingClientRect().width, num = it.querySelector('.stat__num');
      it.style.width = w / z + 'px';
      // se o número é o que dá a largura do item, prende ele pela esquerda: um valor intermediário mais largo
      // (ex.: "10" é mais largo que "11" nessa fonte) cresce para a direita em vez de vazar para fora da margem
      if (num.getBoundingClientRect().width >= w - 0.5) num.style.alignSelf = 'flex-start';
    });
  }
  items.forEach(function (it, i) { it.style.transitionDelay = (i * STAGGER) + 'ms'; });

  var on = false, ticking = false;
  function update() {
    ticking = false;
    var top = section.getBoundingClientRect().top, vh = window.innerHeight;
    if (!on && top <= vh * TRIGGER) { on = true; section.classList.add('is-in'); }
    else if (on && top > vh * 0.92) { on = false; section.classList.remove('is-in'); }

    var c = 0;
    vals.forEach(function (v) { var r = v.num.getBoundingClientRect(); c += (r.top + r.bottom) / 2; });
    c /= vals.length; // centro da linha dos números na tela
    // início: o pé da tela, ou onde os números estão com a página no topo, se já aparecem sem rolar
    var from = Math.min(vh * START, c + window.scrollY);
    var to = Math.min(vh * END, from - vh * MIN_RUN);
    var p = clamp((from - c) / Math.max(from - to, 1));
    var span = 1 - LAG * (vals.length - 1);
    vals.forEach(function (v, i) {
      var q = clamp((p - i * LAG) / span);
      var s = fmt(v.from + (v.to - v.from) * q, v.dec);
      if (s !== v.shown) { v.el.textContent = s; v.shown = s; }
      v.num.style.opacity = q.toFixed(3); // o número vai aparecendo junto com a contagem
      if (v.desc) v.desc.style.opacity = q.toFixed(3); // e a descrição junto com ele (não fica visível sozinha antes)
    });
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
    lock();
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
