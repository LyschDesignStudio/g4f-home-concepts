/* Núcleo Hairline (só o necessário para as três figuras dos cards de soluções),
   tirado dos artefatos data-ai, cybersecurity e managed-services, paleta light.
   Figuras desenhadas num viewBox 400 × 320, isométricas, em traço fino. */
var HL = (function () {
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var rad = function (d) { return d * Math.PI / 180; };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var poly = function (pts) { return 'M' + pts.map(function (p) { return r2(p[0]) + ' ' + r2(p[1]); }).join('L') + 'Z'; };
  var open = function (pts) { return pts.length < 2 ? '' : 'M' + pts.map(function (p) { return r2(p[0]) + ' ' + r2(p[1]); }).join('L'); };
  var Cam = function (azDeg, k, S) { return { az: rad(azDeg), k: k, S: S, ox: 0, oy: 0 }; };
  function proj(C) {
    var c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
    return function (x, y, z) {
      var X = x * c - y * s, Y = x * s + y * c;
      return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)];
    };
  }
  function fit(C, pts, cx, cy) {
    C.ox = 0; C.oy = 0;
    var P = proj(C), a = 1e9, b = -1e9, c = 1e9, d = -1e9;
    pts.forEach(function (p) {
      var q = P(p[0], p[1], p[2]);
      a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]);
    });
    C.ox = cx - (a + b) / 2; C.oy = cy - (c + d) / 2;
  }
  function rrect(u0, v0, u1, v1, r, n) {
    n = n == null ? 4 : n;
    r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
    var out = [];
    [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]].forEach(function (k0) {
      for (var k = 0; k <= n; k++) {
        var a = rad(k0[2] + 90 * k / n), ca = Math.cos(a), sa = Math.sin(a);
        out.push({ u: k0[0] + r * ca, v: k0[1] + r * sa, nu: ca, nv: sa });
      }
    });
    return out;
  }
  function circ(R, n) {
    n = n || 96;
    var out = [];
    for (var k = 0; k < n; k++) {
      var a = k / n * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      out.push({ u: R * ca, v: R * sa, nu: ca, nv: sa });
    }
    return out;
  }
  function hull(input) {
    var pts = input.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var x = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
    var lo = [], up = [], i, p;
    for (i = 0; i < pts.length; i++) { p = pts[i]; while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (i = pts.length - 1; i >= 0; i--) { p = pts[i]; while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    lo.pop(); up.pop();
    return lo.concat(up);
  }
  var ringAt = function (P, ring, z) { return ring.map(function (q) { return P(q.u, q.v, z); }); };
  var facing = function (C) {
    var s = Math.sin(C.az), c = Math.cos(C.az);
    return function (q) { return q.nu * s + q.nv * c >= -1e-6; };
  };
  function run(ring, keep) {
    var n = ring.length, s = -1, i;
    for (i = 0; i < n; i++) if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) { s = i; break; }
    if (s < 0) return keep(ring[0]) ? ring.slice() : [];
    var out = [];
    for (var k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]);
    return out;
  }
  function prism(P, front, ring, inner, z0, z1) {
    return {
      sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))),
      crease: inner ? open(ringAt(P, run(inner, front), z1)) : ''
    };
  }

  // relógios: mola (contínuo) e tween de 700ms na curva (.32,.72,0,1)
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function spring(x) { return { x: x, v: 0, t: x, k: 100, c: 18, m: 1, eps: 0.01 }; }
  function stepS(sp, dt) {
    if (reduced) { sp.x = sp.t; sp.v = 0; return false; }
    var n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (var i = 0; i < n; i++) { var a = (-sp.k * (sp.x - sp.t) - sp.c * sp.v) / sp.m; sp.v += a * h; sp.x += sp.v * h; }
    if (Math.abs(sp.x - sp.t) < sp.eps && Math.abs(sp.v) < sp.eps * 10) { sp.x = sp.t; sp.v = 0; return false; }
    return true;
  }
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    var X = function (u) { return ((ax * u + bx) * u + cx) * u; };
    var Y = function (u) { return ((ay * u + by) * u + cy) * u; };
    var dX = function (u) { return (3 * ax * u + 2 * bx) * u + cx; };
    return function (t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      var u = t, i;
      for (i = 0; i < 8; i++) { var e = X(u) - t; if (Math.abs(e) < 1e-5) break; var d = dX(u); if (Math.abs(d) < 1e-6) break; u -= e / d; }
      if (!(u >= 0 && u <= 1) || Math.abs(X(u) - t) > 1e-4) {
        var lo = 0, hi = 1; u = t;
        for (i = 0; i < 24; i++) { if (X(u) < t) lo = u; else hi = u; u = (lo + hi) / 2; }
      }
      return Y(u);
    };
  }
  var EASE_LIFT = bezier(0.32, 0.72, 0, 1);
  var tween = function (v, dur) { return { from: v, to: v, t0: -1e9, dur: dur || 700 }; };
  var tval = function (tw, now) { var p = clamp((now - tw.t0) / tw.dur, 0, 1); return tw.from + (tw.to - tw.from) * (reduced ? 1 : EASE_LIFT(p)); };
  var tset = function (tw, to, now, delay) { if (tw.to === to) return; tw.from = tval(tw, now); tw.to = to; tw.t0 = now + delay; };
  var tdone = function (tw, now) { return reduced || now >= tw.t0 + tw.dur; };

  // desenho
  var NS = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  }
  function solid(parent) {
    var g = mk('g', {}, parent);
    return { g: g, sil: mk('path', { class: 'sil' }, g), cr: mk('path', { class: 'nf lo' }, g) };
  }
  var put = function (el, s) { el.sil.setAttribute('d', s.sil); el.cr.setAttribute('d', s.crease); };
  var place = function (el, q) { el.setAttribute('cx', String(r2(q[0]))); el.setAttribute('cy', String(r2(q[1]))); };

  // um único loop de quadros, só para as figuras visíveis e com algo se mexendo
  var boards = [], raf = 0, last = 0;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { boards.forEach(function (b) { if (b.stage === e.target) { b.vis = e.isIntersecting; if (b.vis) wake(b); } }); });
  }, { rootMargin: '80px' });
  function frame() {
    var now = performance.now(), dt = Math.min(0.05, Math.max(0, (now - last) / 1e3)), any = false;
    last = now;
    boards.forEach(function (b) { if (b.vis && b.awake) { b.awake = !!b.tick(dt, now); any = any || b.awake; } });
    raf = any ? requestAnimationFrame(frame) : 0;
  }
  function wake(b) { b.awake = true; if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function register(stage, tick) {
    var b = { stage: stage, tick: tick, vis: false, awake: true };
    boards.push(b);
    io.observe(stage);
    tick(0, performance.now());
    return { wake: function () { wake(b); } };
  }

  return {
    clamp: clamp, lerp: lerp, rad: rad, r2: r2, poly: poly, open: open, Cam: Cam, proj: proj, fit: fit,
    rrect: rrect, circ: circ, hull: hull, ringAt: ringAt, facing: facing, run: run, prism: prism,
    spring: spring, stepS: stepS, tween: tween, tval: tval, tset: tset, tdone: tdone,
    mk: mk, solid: solid, put: put, place: place, register: register
  };
})();
