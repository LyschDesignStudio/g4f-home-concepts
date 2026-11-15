/* Figuras animadas dos cards de soluções (artefatos data-ai, cybersecurity e managed-services,
   versão light). Cada uma ocupa o lugar da ilustração estática e roda sozinha em loop
   (as mesmas paradas do botão "play" dos artefatos), sem hover.
   - chip (Dados & IA): a perna mais próxima do ponteiro sai, o sinal corre até o núcleo e ele acende.
   - cadeado (Cybersecurity): o x do ponteiro abre (esquerda) ou fecha (direita) o arco.
   - torre (Managed services): o x do ponteiro define quantos módulos a pilha tem (1 a 3). */
(function () {
  if (typeof HL === 'undefined') return;
  var clamp = HL.clamp, lerp = HL.lerp, open = HL.open, poly = HL.poly, prism = HL.prism, rrect = HL.rrect,
    circ = HL.circ, ringAt = HL.ringAt, run = HL.run, tween = HL.tween, tset = HL.tset, tval = HL.tval,
    tdone = HL.tdone, spring = HL.spring, stepS = HL.stepS, mk = HL.mk, place = HL.place, put = HL.put,
    solid = HL.solid, register = HL.register, Cam = HL.Cam, fit = HL.fit, proj = HL.proj, facing = HL.facing;

  /* ---------- chip (data-ai) ---------- */
  function chip(stage, svg) {
    var BD = 22, DI = 10, ZB = 9, ZD = 11, N = 5, PITCH = 7, LEG = 7, LW = 1.7, LZ0 = 2.5, LZ1 = 4.5, OUT = 4, REST = 2;
    var RB = 6, rr = function (h) { return Math.max(2, RB - (BD - h)); };
    var sq = function (h, b) { b = b || 0; return rrect(b - h, b - h, h - b, h - b, rr(h) - b, 12); };
    var LEGS = [];
    for (var s = 0; s < 4; s++) for (var k = 0; k < N; k++) (function (s, t) {
      var c = [[1, 0], [0, 1], [-1, 0], [0, -1]][s];
      LEGS.push({ s: s, t: t, front: s < 2, at: function (n, m) { return [c[0] * n - c[1] * m, c[1] * n + c[0] * m]; } });
    })(s, (k - (N - 1) / 2) * PITCH);

    var dur = 700, act = -1, sig = tween(1, dur);
    var C = Cam(45, 0.5, 4.3), M = BD + LEG + OUT;
    fit(C, [[-M, -M, 0], [M, M, 0], [M, -M, 0], [-M, M, 0], [0, 0, ZD]], 200, 164);
    var P = proj(C), front = facing(C), g = mk('g', {}, svg);
    var legRing = function (L, o) {
      var a = L.at(BD - 1, L.t - LW), b = L.at(BD + LEG + o, L.t + LW);
      return rrect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), 1.2, 6);
    };
    var legs = [];
    LEGS.forEach(function (L, i) { if (!L.front) legs[i] = solid(g); });
    put(solid(g), prism(P, front, sq(BD), sq(BD, 1.6), 0, ZB));
    LEGS.forEach(function (L, i) { if (L.front) legs[i] = solid(g); });
    var trace = mk('path', { class: 'nf hi' }, g);
    var sigBack = mk('circle', { r: 1.6, class: 'dot' }, g);
    var die = solid(g);
    put(die, prism(P, front, sq(DI), sq(DI, 1.4), ZB, ZD));
    var lights = [];
    for (k = 0; k < 4; k++) { var el = mk('circle', { r: 1.15, class: 'dot off' }, g); place(el, P(((k % 2) - 0.5) * 7, (Math.floor(k / 2) - 0.5) * 7, ZD)); lights.push(el); }
    var sigFront = mk('circle', { r: 1.6, class: 'dot' }, g);
    var outs = LEGS.map(function () { return tween(0); }), drawn = LEGS.map(function () { return NaN; }), lit = null;

    function draw(now) {
      if (act < 0) return false;
      var moving = false;
      LEGS.forEach(function (L, i) {
        var o = clamp(tval(outs[i], now), 0, 1.2) * OUT;
        if (Math.abs(o - (i === act ? OUT : 0)) > 0.01) moving = true;
        if (o === drawn[i]) return;
        drawn[i] = o;
        put(legs[i], prism(P, front, legRing(L, o), null, LZ0, LZ1));
      });
      var L = LEGS[act], t = clamp(tval(sig, now), 0, 1), a = L.at(BD, L.t), b = L.at(DI, L.t * 0.5);
      var on = L.front ? sigFront : sigBack, off = L.front ? sigBack : sigFront;
      place(on, P(lerp(a[0], b[0], t), lerp(a[1], b[1], t), ZB));
      on.setAttribute('r', 1.6); off.setAttribute('r', 0);
      var arrived = t > 0.97;
      if (arrived !== lit) {
        lit = arrived;
        die.sil.classList.toggle('hi', arrived);
        lights.forEach(function (el) { el.setAttribute('class', arrived ? 'dot m' : 'dot off'); });
      }
      return moving || t < 1;
    }
    var B = register(stage, function (_dt, now) { return draw(now); });
    function pick(k) {
      if (k !== act) {
        var now = performance.now();
        if (act >= 0) { legs[act].sil.classList.remove('hi'); tset(outs[act], 0, now, 0); }
        act = k;
        legs[k].sil.classList.add('hi');
        tset(outs[k], 1, now, 0);
        var L = LEGS[k], a = L.at(BD, L.t), b = L.at(DI, L.t * 0.5);
        trace.setAttribute('d', open([P(a[0], a[1], ZB), P(b[0], b[1], ZB)]));
        sig = tween(0, dur);
        tset(sig, 1, now, 0);
        lit = null;
      }
      B.wake();
    }
    pick(REST);
    var tips = LEGS.map(function (L) { var uv = L.at(BD + LEG / 2, L.t); return P(uv[0], uv[1], LZ1); });
    var nearest = function (p) {
      var b = 0, bd = Infinity;
      tips.forEach(function (q, i) { var d = Math.pow(q[0] - p[0], 2) + Math.pow(q[1] - p[1], 2); if (d < bd) { bd = d; b = i; } });
      return b;
    };
    return { move: function (p) { pick(nearest(p)); }, leave: function () { pick(REST); } };
  }

  /* ---------- cadeado (cybersecurity) ---------- */
  function cadeado(stage, svg) {
    var BW = 26, BD = 10, BH = 34, RB = 8, SX = 15, SR = 15, TR = 3.6, ZS = 43, LEG = 18, SEAT = 0.6;
    var LIFT = 13, shut = null, sp = spring(0);
    var C = Cam(45, 0.5, 3.6), reach = ZS + 16 + SR + TR;
    fit(C, [[-BW, -BD, 0], [BW, BD, 0], [BW, -BD, 0], [-BW, BD, 0], [-SX, 0, reach], [SX, 0, reach], [SX, 2 * SX * 0.39, ZS + 16]], 200, 158);
    var P = proj(C), front = facing(C), g = mk('g', {}, svg);
    var ox = P(0, 0, 0)[0], tw = Math.max.apply(null, ringAt(P, circ(TR, 48), 0).map(function (q) { return Math.abs(q[0] - ox); }));

    var body = solid(g);
    put(body, prism(P, front, rrect(-BW, -BD, BW, BD, RB, 12), rrect(1.6 - BW, 1.6 - BD, BW - 1.6, BD - 1.6, RB - 1.6, 12), 0, BH));
    var kh = [];
    for (var k = 0; k <= 40; k++) { var a = (k / 40) * Math.PI * 2; kh.push(P(3.2 * Math.cos(a), BD, 18 + 3.2 * Math.sin(a))); }
    mk('path', { class: 'nf', d: poly(kh) }, g);
    mk('path', { class: 'nf', d: open([P(0, BD, 14.8), P(0, BD, 9)]) }, g);
    var light = mk('circle', { r: 1.3, class: 'dot off' }, g);
    place(light, P(0, BD, 18));
    [-SX, SX].forEach(function (x) {
      mk('path', { class: 'nf lo', d: poly(ringAt(P, circ(TR + 1.2, 32).map(function (q) { return { u: q.u + x, v: q.v, nu: q.nu, nv: q.nv }; }), BH)) }, g);
    });
    var shackle = mk('path', {}, g), crease = mk('path', { class: 'nf lo' }, g);

    function line(l) {
      var zs = ZS + l, an = 0, pts = [], k; // só sobe e desce: sem girar a trava (no artefato ela gira até 0.4 rad)
      for (k = 0; k <= 8; k++) pts.push([-SX, 0, zs - LEG - LIFT + ((LEG + LIFT) * k) / 8]); // perna esquerda mais longa: continua presa no corpo ao destravar
      for (k = 1; k < 24; k++) { var t = Math.PI - (Math.PI * k) / 24; pts.push([SR * Math.cos(t), 0, zs + SR * Math.sin(t)]); }
      for (k = 0; k <= 8; k++) pts.push([SX, 0, zs - (LEG * k) / 8]);
      return pts.map(function (q) { var d = q[0] + SX; return [-SX + d * Math.cos(an), d * Math.sin(an), q[2]]; })
        .filter(function (q) { return q[2] >= BH || Math.abs(q[0]) > BW || Math.abs(q[1]) > BD; });
    }
    var drawn = NaN;
    function draw(l) {
      if (l === drawn) return;
      drawn = l;
      var s = line(l).map(function (q) { return P(q[0], q[1], q[2]); });
      var L = [], R = [], Cr = [];
      s.forEach(function (p, i) {
        var a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)];
        var tx = b[0] - a[0], ty = b[1] - a[1], n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
        L.push([p[0] - ty * tw, p[1] + tx * tw]); R.push([p[0] + ty * tw, p[1] - tx * tw]); Cr.push([p[0] + ty * tw * 0.4, p[1] - tx * tw * 0.4]);
      });
      shackle.setAttribute('d', poly(L.concat(R.reverse())));
      var d = '', run1 = [];
      for (var i = 2; i < Cr.length - 2; i++) {
        var fold = i > 2 && ((Cr[i][0] - Cr[i - 1][0]) * (s[i][0] - s[i - 1][0]) + (Cr[i][1] - Cr[i - 1][1]) * (s[i][1] - s[i - 1][1])) <= 0;
        if (fold) { if (run1.length > 1) d += open(run1); run1 = []; }
        run1.push(Cr[i]);
      }
      if (run1.length > 1) d += open(run1);
      crease.setAttribute('d', d);
      var now = l < SEAT;
      if (now !== shut) {
        shut = now;
        body.sil.classList.toggle('hi', now);
        light.setAttribute('class', now ? 'dot m' : 'dot off');
      }
    }
    var B = register(stage, function (dt) { var m = stepS(sp, dt); draw(sp.x); return m; });
    var aim = function (l) { sp.t = l; B.wake(); };
    draw(0);
    return {
      move: function (p) { aim(clamp((280 - p[0]) / 150, 0, 1) * LIFT); },
      leave: function () { aim(0); }
    };
  }

  /* ---------- torre (managed-services) ---------- */
  function torre(stage, svg) {
    var N = 3, M = 25, H = 14, G = 2.6, REST = 3, STEP = H + G, E = M + 7, EB = -3, ET = N * STEP + 5;
    var RM = 7, RC = RM - 1.4, RE = RM + (E - M), stag = 80, n = -1;
    var C = Cam(45, 0.5, 2.5);
    fit(C, [[-E, -E, EB], [E, E, EB], [E, -E, EB], [-E, E, EB], [-E, -E, ET], [E, E, ET]], 200, 160);
    var P = proj(C), front = facing(C), g = mk('g', {}, svg);
    var sq = function (h, r) { return rrect(-h, -h, h, h, r, 12); };
    var env = sq(E, RE);
    mk('path', { class: 'nf dash', d: poly(ringAt(P, env, EB)) }, g);
    mk('path', { class: 'nf dash', d: poly(ringAt(P, env, ET)) }, g);
    var ring = sq(M, RM), inner = sq(M - 1.4, RC), mods = [];
    for (var i = 0; i < N; i++) {
      var s = solid(g), lights = [0, 1, 2].map(function () { return mk('circle', { r: 1.15, class: 'dot off' }, g); });
      mods.push({ s: s, lights: lights, t: tween(i < REST ? 1 : 0), drawn: NaN });
    }
    mk('path', { class: 'nf dash', d: prism(P, front, env, null, EB, ET).sil }, g);
    mk('path', { class: 'nf dash', d: open(ringAt(P, run(env, front), EB)) }, g);

    function draw(now) {
      var z = 0, moving = false;
      mods.forEach(function (m) {
        if (!tdone(m.t, now)) moving = true;
        var k = clamp(tval(m.t, now), 0, 1), h = k * H, key = z + ',' + h;
        if (key !== m.drawn) {
          m.drawn = key;
          if (h < 0.4) { m.s.sil.setAttribute('d', ''); m.s.cr.setAttribute('d', ''); m.lights.forEach(function (d) { d.setAttribute('r', 0); }); }
          else {
            put(m.s, prism(P, front, ring, inner, z, z + h));
            m.lights.forEach(function (d, j) { d.setAttribute('r', h > 7 ? 1.15 : 0); place(d, P(M, -9 + j * 5, z + h / 2)); });
          }
        }
        z += k * STEP;
      });
      return moving;
    }
    var B = register(stage, function (_dt, now) { return draw(now); });
    function setCount(k) {
      if (k === n) return;
      var now = performance.now(), from = n < 0 ? REST : n;
      n = k;
      mods.forEach(function (m, i) {
        tset(m.t, i < k ? 1 : 0, now, Math.abs(i - (k > from ? from : from - 1)) * stag);
        m.s.sil.classList.toggle('hi', i === k - 1);
        m.lights.forEach(function (d) { d.setAttribute('class', i === k - 1 ? 'dot m' : 'dot off'); });
      });
      B.wake();
    }
    setCount(REST);
    return {
      move: function (p) { setCount(clamp(Math.round(1 + ((p[0] - 120) / 160) * (N - 1)), 1, N)); },
      leave: function () { setCount(REST); }
    };
  }

  /* ---------- montagem nos cards ---------- */
  /* Sem hover: cada figura roda sozinha em loop, com um ponteiro invisível que percorre
     as paradas do "play" do artefato (null = sai e descansa). Só anda com a figura visível. */
  var FIGS = {
    chip: { make: chip, stops: [[110, 200], [200, 110], [290, 200], null] },
    cadeado: { make: cadeado, stops: [[130, 160], [300, 160], [205, 160], null] },
    torre: { make: torre, stops: [[125, 170], [285, 170], [205, 170], null] }
  };
  var TRAVEL = 900, DWELL = 1200, REST = 1800, START = 600, STAGGER = 450;

  function loop(stage, fig, stops, delay) {
    var i = 0, wait = delay, t = -1, at = null, from = null;
    HL.register(stage, function (dt) {
      if (wait > 0) { wait -= dt * 1e3; return true; }
      var stop = stops[i];
      if (stop === null) { if (at) { fig.leave(); at = null; } i = (i + 1) % stops.length; wait = REST; return true; }
      if (t < 0) { from = at || [200, 320]; t = 0; }
      t = Math.min(TRAVEL, t + dt * 1e3);
      var k = HL.EASE_LIFT(t / TRAVEL);
      at = [from[0] + (stop[0] - from[0]) * k, from[1] + (stop[1] - from[1]) * k];
      fig.move(at);
      if (t >= TRAVEL) { i = (i + 1) % stops.length; t = -1; wait = DWELL; }
      return true;
    });
  }

  [].forEach.call(document.querySelectorAll('.front__fig[data-fig]'), function (stage, n) {
    var def = FIGS[stage.dataset.fig];
    if (!def) return;
    var svg = mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage);
    var fig = def.make(stage, svg);
    if (!HL.reduced) loop(stage, fig, def.stops, START + STAGGER * n);
  });
})();
