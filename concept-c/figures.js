/* Soluções · ilustrações animadas (Concept C · Blue Print)
   As três ilustrações do Figma viram SVG inline e cada parte delas anima sozinha, em loop, enquanto o card está na
   tela (no espírito das figuras "hairline" dos outros concepts: curvas suaves, molas, nada de fade do bloco inteiro).
   - Data & AI: a base se abre, os blocos sobem de dentro do chão um a um, como barras 3D (a base de cada um é uma
     máscara, nada distorce; o mais alto, no centro, por último) e, quando ele
     termina, sobe a haste e a estrela aparece em cima, dentro do anel; depois tudo recolhe e recomeça.
   - Cybersecurity (proteção): a caixa fica no chão; a gaiola tracejada desce do alto e fecha sobre ela, a fechadura
     "tranca" (pulsa) e, trancada, ondas de proteção saem da base; depois a gaiola sobe e abre de novo.
   - Managed services (continuidade): começa com um HD; outro desce e encaixa em cima, depois o terceiro; as luzes do
     de cima piscam; depois tiram um, tiram outro, e volta a um só — 1 → 3 → 1, em loop.
   Sem movimento reduzido. Com movimento reduzido fica a ilustração parada, como no Figma. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var holders = [].slice.call(document.querySelectorAll('.front__ill[data-fig]'));
  if (!holders.length) return;

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }                 // 0 → 1 entre a e b (segundos)
  function out(x) { return 1 - Math.pow(1 - x, 3); }                         // desacelera
  function inn(x) { return x * x * x; }                                       // acelera
  function back(x) { var c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); } // passa e volta
  function q(svg, s) { return [].slice.call(svg.querySelectorAll(s)); }
  function set(el, tf, op) { el.style.transform = tf; if (op != null) el.style.opacity = op.toFixed(3); }

  var FIGS = {
    // Data & AI · ciclo de 8s
    data: function (svg) {
      var base = q(svg, '.fa-base')[0], stem = q(svg, '.fa-stem')[0], ring = q(svg, '.fa-ring')[0], star = q(svg, '.fa-star')[0];
      var ORDER = [0, 1, 2, 3, 5, 6, 7, 8, 4];                            // o bloco alto do centro (4) cresce por último
      var blocks = ORDER.map(function (i) { return q(svg, '.fa-block--' + i)[0]; });
      return { T: 8, at: function (t) {
        var b = out(seg(t, 0, 0.7)) * (1 - inn(seg(t, 7.2, 7.8)));
        set(base, 'scale(' + (0.92 + 0.08 * b).toFixed(4) + ')', b);
        blocks.forEach(function (el, k) {
          var g = back(seg(t, 0.5 + k * 0.2, 1.2 + k * 0.2)), s = inn(seg(t, 6.1 + (8 - k) * 0.07, 6.6 + (8 - k) * 0.07));
          var v = Math.max(0, g * (1 - s)), h = +el.getAttribute('data-h');
          // sobe inteiro de dentro do chão: a base do bloco é uma máscara (clip-path no SVG), então nada distorce
          set(el, 'translateY(' + (h * (1 - v)).toFixed(1) + 'px)');
        });
        var up = out(seg(t, 2.4, 2.9)) * (1 - inn(seg(t, 5.7, 6.0)));
        set(stem, 'scaleY(' + up.toFixed(4) + ')', up);
        var pop = back(seg(t, 2.8, 3.4)) * (1 - inn(seg(t, 5.5, 5.8)));
        set(ring, 'scale(' + Math.max(0, pop).toFixed(4) + ')', clamp(pop));
        var spin = (t - 2.8) * 40;                                       // a estrela gira devagar enquanto está à vista
        set(star, 'scale(' + Math.max(0, back(seg(t, 3.0, 3.6)) * (1 - inn(seg(t, 5.4, 5.7)))).toFixed(4) + ') rotate(' + spin.toFixed(1) + 'deg)');
      } };
    },
    // Cybersecurity · ciclo de 6s
    cyber: function (svg) {
      var cage = q(svg, '.fc-cage')[0], lock = q(svg, '.fc-lock')[0], dot = q(svg, '.fc-dot')[0], wave = q(svg, '.fc-wave')[0], box = q(svg, '.fc-box')[0];
      return { T: 6, first: function (t) { var g = back(seg(t, 0, 0.8)); set(box, 'scaleY(' + g.toFixed(4) + ')', clamp(g * 3)); }, at: function (t) {
        var down = out(seg(t, 0.4, 1.4)), up = inn(seg(t, 4.6, 5.6)), c = down * (1 - up);
        set(cage, 'translateY(' + (-70 * (1 - c)).toFixed(1) + 'px)', c);
        var locked = seg(t, 1.4, 4.6) > 0 && seg(t, 1.4, 4.6) < 1;
        var k = seg(t, 1.35, 1.75), kick = Math.sin(Math.PI * k) * 0.22;   // tranca: a fechadura pulsa
        set(lock, 'scale(' + (1 + kick).toFixed(4) + ')');
        set(dot, '', locked ? 0.55 + 0.45 * Math.abs(Math.cos((t - 1.4) * 3.2)) : 1);
        var w = locked ? ((t - 1.6) % 1.5) / 1.5 : 0;                    // ondas de proteção a cada 1,5s enquanto trancada
        set(wave, 'scale(' + (1 + 0.1 * out(w)).toFixed(4) + ')', locked ? 0.9 * (1 - w) : 0.9);
      } };
    },
    // Managed services · ciclo de 7,2s
    managed: function (svg) {
      var hd = [1, 2, 3].map(function (n) { return q(svg, '.fm-hd--' + n)[0]; });
      var lights = q(hd[2], 'path').slice(-3);
      return { T: 7.2, first: function (t) { var g = back(seg(t, 0, 0.7)); set(hd[0], 'translateY(' + (-30 * (1 - clamp(g))).toFixed(1) + 'px)', clamp(g * 2)); }, at: function (t) {
        var add2 = out(seg(t, 0.8, 1.5)), add3 = out(seg(t, 1.9, 2.6)), rem3 = inn(seg(t, 4.4, 5.0)), rem2 = inn(seg(t, 5.3, 5.9));
        var v2 = add2 * (1 - rem2), v3 = add3 * (1 - rem3);
        // entra descendo de cima e encaixa; sai subindo
        set(hd[1], 'translateY(' + (-(1 - add2) * 60 - rem2 * 40).toFixed(1) + 'px)', v2);
        set(hd[2], 'translateY(' + (-(1 - add3) * 60 - rem3 * 40).toFixed(1) + 'px)', v3);
        lights.forEach(function (l, i) {                                 // luzes do HD de cima piscam em sequência
          var on = 0.45 + 0.55 * Math.max(0, Math.sin((t - 2.6) * 4 - i * 0.9));
          l.style.opacity = (t > 2.6 && t < 4.4 ? on : 1).toFixed(3);
        });
      } };
    }
  };

  holders.forEach(function (holder) {
    var img = holder.querySelector('img');
    fetch(img.getAttribute('src')).then(function (r) { return r.ok ? r.text() : null; }).then(function (txt) {
      if (!txt || txt.indexOf('<svg') < 0) return;
      holder.innerHTML = txt.slice(txt.indexOf('<svg'));
      var svg = holder.querySelector('svg');
      svg.removeAttribute('style'); svg.classList.add('front__svg');
      if (reduced) return;
      var fig = FIGS[holder.getAttribute('data-fig')](svg);
      var t0 = null, raf = 0, visible = false, firstDone = !fig.first;
      function frame(now) {
        raf = 0;
        if (t0 == null) t0 = now;
        var el = (now - t0) / 1000;
        if (!firstDone) { fig.first(el); if (el > 1) firstDone = true; }
        fig.at(el % fig.T);
        if (visible) raf = requestAnimationFrame(frame);
      }
      fig.at(0); if (fig.first) fig.first(0);                            // estado inicial: tudo recolhido
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) { t0 = null; raf = requestAnimationFrame(frame); } // ao voltar à tela, recomeça o ciclo do início
      }, { threshold: 0.25 }).observe(holder);
    }).catch(function () {});
  });
})();
