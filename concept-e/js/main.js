/* =========================================================
   G4F — Blueprint site · interações
   Regras: cantos retos, sem fade (troca seca / recorte / movimento)
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVGNS = "http://www.w3.org/2000/svg";
  const u = () => window.innerWidth / 1920;
  const vh = () => window.innerHeight;
  const pad2 = (n) => String(n).padStart(2, "0");

  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // reinicia uma animação CSS de entrada (sem fade)
  function replay(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  }

  /* =======================================================
     CONTEÚDO
     ======================================================= */
  const NUMBERS = [
    { prefix: "+", to: 11, suffix: "mil", label: ["Colaboradores", "(95% de perfis técnicos)"] },
    { prefix: "+", to: 300, suffix: "", label: ["Clientes atendidos", "(setor público e privado)"] }, // TODO: confirmar legenda
    { prefix: "", to: 22, suffix: "", label: ["Estados com atuação", "em todo o Brasil"] },
    { prefix: "", to: 17, suffix: "", label: ["Anos de atuação", "matriz em Brasília"] },
  ];

  const FRONTS = [
    {
      tag: "Cybersecurity",
      title: "Confiança para operar",
      body: "Protegemos toda a estrutura digital sob os mais rígidos padrões internacionais para que nossos clientes operem com total estabilidade e sem o risco de paralisação.",
      cta: "Conheça Cybersecurity",
      art: "cyber",
    },
    {
      tag: "Digital & Managed Services",
      title: "Continuidade para crescer",
      body: "Gestão e sustentação de ambientes tecnológicos complexos e infraestruturas em nuvem, que garantem estabilidade contínua e necessária para o crescimento de nossos clientes.",
      cta: "Conheça Digital & Managed Services",
      art: "managed",
    },
    {
      tag: "Data & AI",
      title: "Inteligência para decisões e resultados",
      body: "Inteligência Artificial aplicada na prática com governança e resultados que aceleram decisões e entregam valor mensurável.",
      cta: "Conheça Data & AI",
      art: "data",
    },
  ];

  const CITIES = [
    { coords: [-47.93, -15.78], hq: true, label: "Brasília · matriz", offset: [-92, -22] },
    { coords: [-43.94, -19.92], label: "Belo Horizonte", offset: [88, 4] },
    { coords: [-46.63, -23.55] },
    { coords: [-43.17, -22.91] },
    { coords: [-38.5, -12.97] },
    { coords: [-34.88, -8.05] },
    { coords: [-38.54, -3.72] },
  ];


  /* =======================================================
     HERO — camadas do Figma em sanfona
     Começam empilhadas no centro (só a camada principal aparece)
     e abrem em vista explodida. Depois: parallax leve no mouse.
     ======================================================= */
  const stack = $("#heroStack");
  // ordem visual de cima para baixo · centro Y de cada camada no frame (px do Figma)
  const LAYERS = [1, 2, 3, 4].map((n, i) => ({
    el: $(`.hero__layer--${n}`, stack),
    cy: 416 + i * 200,
    depth: [26, 18, 12, 6][i],
  }));
  const STACK_CY = 716;            // centro do conjunto: ponto de encontro quando fechadas
  const mqMobile = window.matchMedia("(max-width: 760px)");
  // encaixa o conjunto (1080px de altura no Figma) no meio da área abaixo do menu
  function fitStack() {
    if (mqMobile.matches) { stack.style.transform = ""; return; }
    const k = u(), H = vh(), navH = $("#nav").offsetHeight;
    const avail = H - navH - 48;
    const sc = Math.min(1, avail / (1080 * k));
    const targetY = navH + (H - navH) / 2;
    stack.style.transformOrigin = `${485.94 * k}px ${STACK_CY * k}px`;
    stack.style.transform = `translateY(${(targetY - STACK_CY * k).toFixed(1)}px) scale(${sc.toFixed(4)})`;
  }
  let stackOpen = 0;               // 0 = empilhada · 1 = explodida
  let stackTarget = 0;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  $("#hero").addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  });
  $("#hero").addEventListener("pointerleave", () => { mouse.x = 0; mouse.y = 0; });

  function animateStack(t) {
    stackOpen = lerp(stackOpen, stackTarget, reduceMotion ? 1 : 0.045);
    mouse.sx = lerp(mouse.sx, mouse.x, 0.06);
    mouse.sy = lerp(mouse.sy, mouse.y, 0.06);
    const k = u();
    const open = easeInOut(clamp(stackOpen));
    LAYERS.forEach((L, i) => {
      const closed = (STACK_CY - L.cy) * k;                 // deslocamento até o centro
      const float = reduceMotion ? 0 : Math.sin(t / 1500 + i * 0.9) * (1.5 + i) * open;
      const y = closed * (1 - open) + mouse.sy * L.depth * 1.2 * open + float;
      const x = mouse.sx * L.depth * 2 * open;
      L.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    });
  }

  /* =======================================================
     INTRO — as linhas se montam
     ======================================================= */
  function intro() {
    const body = document.body;
    const steps = reduceMotion
      ? [[0, "s1"], [0, "s2"], [0, "s3"], [0, "s4"], [0, "s5"]]
      : [[80, "s1"], [560, "s2"], [800, "s3"], [1180, "s4"], [1500, "s5"]];
    steps.forEach(([ms, cls]) => setTimeout(() => body.classList.add(cls), ms));
    const start = reduceMotion ? 0 : 1550;
    setTimeout(() => stack.classList.add("is-in"), start);          // camadas surgem empilhadas
    setTimeout(() => { stackTarget = 1; }, start + (reduceMotion ? 0 : 650)); // abre a sanfona
    setTimeout(() => body.classList.remove("is-loading"), start + 900);
  }

  /* =======================================================
     NAV — troca seca de tema; o footer empurra o menu para fora
     ======================================================= */
  const nav = $("#nav");
  const footer = $("#footer");
  const themed = $$("[data-nav]");
  function updateNav() {
    const edge = nav.offsetHeight;
    let theme = "dark";
    for (const s of themed) if (s.getBoundingClientRect().top <= edge + 0.5) theme = s.dataset.nav;
    if (nav.dataset.theme !== theme) nav.dataset.theme = theme;
    const push = Math.min(0, footer.getBoundingClientRect().top - edge);
    nav.style.transform = push ? `translate3d(0, ${push}px, 0)` : "";
  }

  /* =======================================================
     BIG NUMBERS — chegam de baixo e se empilham
     ======================================================= */
  const numbersEl = $("#numeros");
  const numList = $("#numbersList");
  const numRows = NUMBERS.map((n, i) => {
    const li = document.createElement("li");
    li.className = "num-row";
    li.innerHTML = `
      <span class="line line--h num-row__line"></span>
      <p class="num-row__label">${n.label.map((l) => `<span>${l}</span>`).join("")}</p>
      <span class="num-row__index">${pad2(i + 1)} / ${pad2(NUMBERS.length)}</span>
      <span class="num-row__value">${n.prefix}0${n.suffix}</span>`;
    numList.appendChild(li);
    return { li, value: li.querySelector(".num-row__value"), shown: -1 };
  });
  const firstLine = numRows[0].li.querySelector(".num-row__line");
  function updateNumbers() {
    const r = numbersEl.getBoundingClientRect();
    const H = vh();
    numbersEl.classList.toggle("is-visible", r.top < H * 0.5 && r.bottom > 0);
    // encostada no menu, a linha do topo da primeira linha de números some (a linha do menu já está ali; sem duplicar)
    firstLine.style.visibility = r.top <= 0.5 ? "hidden" : "";
    const scrollable = numbersEl.offsetHeight - 2 * H;      // última tela = sobreposição da cartela
    const p = clamp(-r.top / scrollable) * (NUMBERS.length - 1);
    const entry = easeOut(range(H - r.top, H * 0.3, H));    // linha 1 chega com a própria seção
    numRows.forEach((row, i) => {
      const e = i === 0 ? entry : easeOut(clamp((p - (i - 1)) * 1.15));
      const dist = H - nav.offsetHeight - row.li.offsetTop;
      // deslocamento em pixel inteiro: a linha de cada número fica nítida (sem meio pixel, que a deixava mais clara)
      row.li.style.transform = i === 0 ? "" : `translate3d(0, ${Math.round((1 - e) * dist)}px, 0)`;
      const n = NUMBERS[i];
      const v = Math.round(n.to * e);
      if (v !== row.shown) { row.shown = v; row.value.textContent = `${n.prefix}${v}${n.suffix}`; }
    });
  }

  /* =======================================================
     ILUSTRAÇÕES ISOMÉTRICAS — cantos retos
     ======================================================= */
  const C30 = 0.8660254, S30 = 0.5;
  const P = (x, y, z = 0) => [(x - y) * C30, (x + y) * S30 - z];
  // limites reais de cada ilustração → viewBox justo (nada vaza da área)
  let B = null;
  const track = (x, y) => { if (!B) return; B.x0 = Math.min(B.x0, x); B.y0 = Math.min(B.y0, y); B.x1 = Math.max(B.x1, x); B.y1 = Math.max(B.y1, y); };
  const pts = (arr) => arr.map((p) => { const q = P(...p); track(q[0], q[1]); return q.map((n) => n.toFixed(1)).join(","); }).join(" ");
  const isoLine = (parent, a, b, cls) => {
    const [x1, y1] = P(...a), [x2, y2] = P(...b);
    track(x1, y1); track(x2, y2);
    return el("line", { x1, y1, x2, y2, class: cls }, parent);
  };
  const poly = (parent, arr, cls) => el("polygon", { points: pts(arr), class: cls }, parent);
  const squareAt = (parent, x0, y0, s, z, cls) =>
    poly(parent, [[x0, y0, z], [x0 + s, y0, z], [x0 + s, y0 + s, z], [x0, y0 + s, z]], cls);

  function box(parent, x, y, w, d, h, z0 = 0, topCls = "iso iso-top") {
    const g = el("g", { class: "iso-el" }, parent);
    const z1 = z0 + h;
    poly(g, [[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x + w, y, z1]], "iso iso-side-2"); // face direita
    poly(g, [[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x, y + d, z1]], "iso iso-side");   // face esquerda
    poly(g, [[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]], topCls);                    // topo
    return g;
  }
  function wireBox(parent, x, y, w, h) {
    const g = el("g", { class: "iso-el" }, parent);
    squareAt(g, x, y, w, h, "iso-dash");
    [[x, y], [x + w, y], [x + w, y + w], [x, y + w]].forEach(([a, b]) => isoLine(g, [a, b, 0], [a, b, h], "iso-dash"));
    return g;
  }
  function plates(parent, inner, outer) {
    const g = el("g", { class: "iso-el" }, parent);
    squareAt(g, -outer, -outer, 420 + outer * 2, 0, "iso-dash");
    squareAt(g, -inner, -inner, 420 + inner * 2, 0, "iso-plate");
    return g;
  }
  // cada ilustração ganha um viewBox justo e fica ancorada no canto inferior direito
  const newArt = (name) => {
    B = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    const svg = el("svg", { preserveAspectRatio: "xMaxYMax meet", "data-art": name });
    const root = el("g", {}, svg);
    return { svg, root };
  };
  const closeArt = (svg) => {
    const pad = 6;
    svg.setAttribute("viewBox", `${(B.x0 - pad).toFixed(1)} ${(B.y0 - pad).toFixed(1)} ${(B.x1 - B.x0 + pad * 2).toFixed(1)} ${(B.y1 - B.y0 + pad * 2).toFixed(1)}`);
    B = null;
    return svg;
  };

  function artData() {
    const { svg, root } = newArt("data");
    plates(root, 20, 70);
    const H = [[120, 200, 90], [220, 300, 160], [80, 170, 110]];
    const cells = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cells.push([i, j]);
    cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
    cells.forEach(([i, j]) => box(root, i * 155, j * 155, 110, 110, H[i][j]));
    // marcador de IA: losango tracejado + estrela de pontas retas
    const g = el("g", { class: "iso-el" }, root);
    const [tx, ty] = P(210, 210, 300);
    const cy = ty - 120;
    track(tx - 44, cy - 44); track(tx + 44, cy + 44);
    el("line", { x1: tx, y1: ty - 8, x2: tx, y2: cy + 44, class: "iso-dash" }, g);
    el("polygon", { points: `${tx},${cy - 44} ${tx + 44},${cy} ${tx},${cy + 44} ${tx - 44},${cy}`, class: "iso-dash" }, g);
    el("polygon", {
      points: [[0, -26], [6, -6], [26, 0], [6, 6], [0, 26], [-6, 6], [-26, 0], [-6, -6]].map(([a, b]) => `${tx + a},${cy + b}`).join(" "),
      class: "iso iso-solid-blue",
    }, g);
    return closeArt(svg);
  }

  function artCyber() {
    const { svg, root } = newArt("cyber");
    plates(root, 0, 80);
    wireBox(root, 30, 30, 360, 250);
    const b = box(root, 90, 90, 240, 240, 140);
    // fechadura (retilínea) no topo
    const z = 140, c = 210;
    squareAt(b, c - 22, c - 22, 44, z, "iso iso-solid-blue");
    poly(b, [[c + 22, c - 7, z], [c + 70, c - 7, z], [c + 70, c + 7, z], [c + 22, c + 7, z]], "iso iso-solid-blue");
    return closeArt(svg);
  }

  function artManaged() {
    const { svg, root } = newArt("managed");
    plates(root, 0, 60);
    wireBox(root, 20, 20, 380, 330);
    [0, 90, 180].forEach((z0, k) => {
      const g = box(root, 60, 60, 300, 300, 62, z0, k === 2 ? "iso iso-top" : "iso iso-side");
      // LEDs na face direita
      [0, 1, 2].forEach((n) => {
        const y = 330 - n * 26, zc = z0 + 31;
        poly(g, [[360, y - 6, zc - 6], [360, y + 6, zc - 6], [360, y + 6, zc + 6], [360, y - 6, zc + 6]], "iso iso-solid-blue");
      });
    });
    return closeArt(svg);
  }

  /* =======================================================
     TRÊS FRENTES — bullets + scroll, troca sem fade
     ======================================================= */
  const fronts = $("#frentes");
  const bulletsWrap = $("#frontsBullets");
  const fTag = $("#frontsTag"), fHeading = $("#frontsHeading"), fBody = $("#frontsBody"), fCta = $("#frontsCta");
  const fTextWrap = $(".fronts__text");
  const artWrap = $("#frontsArt");
  const arts = { data: artData(), cyber: artCyber(), managed: artManaged() };
  Object.values(arts).forEach((s) => { s.style.display = "none"; artWrap.appendChild(s); });

  const bullets = FRONTS.map((f, i) => {
    const b = document.createElement("button");
    b.className = "fronts__bullet";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", f.tag);
    b.title = f.tag;
    b.addEventListener("click", () => goToFront(i));
    bulletsWrap.appendChild(b);
    return b;
  });

  let frontCurrent = -1;
  let artTimers = [];
  function showArt(name) {
    artTimers.forEach(clearTimeout);
    artTimers = [];
    Object.entries(arts).forEach(([k, s]) => { s.style.display = k === name ? "" : "none"; });
    const els = $$(".iso-el", arts[name]);
    els.forEach((n) => n.classList.remove("is-in"));
    els.forEach((n, i) => artTimers.push(setTimeout(() => n.classList.add("is-in"), 40 + i * 70)));
  }
  function setFront(i) {
    if (i === frontCurrent) return;
    frontCurrent = i;
    const f = FRONTS[i];
    bullets.forEach((b, k) => { b.classList.toggle("is-active", k === i); b.setAttribute("aria-selected", k === i); });
    fTag.textContent = f.tag;
    fHeading.textContent = f.title;
    fBody.textContent = f.body;
    fCta.textContent = f.cta;
    replay(fTag, "swap-in");
    replay(fTextWrap, "swap-in-2");
    replay(fCta, "swap-in-3");
    showArt(f.art);
  }
  const frontsScrollable = () => fronts.offsetHeight - 2 * vh();   // última tela = cases subindo por cima
  function goToFront(i) {
    const top = fronts.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + ((i + 0.5) / FRONTS.length) * frontsScrollable());
  }
  function updateFronts() {
    const r = fronts.getBoundingClientRect();
    fronts.classList.toggle("is-visible", r.top < vh() * 0.7 && r.bottom > 0);
    const p = clamp(-r.top / frontsScrollable(), 0, 0.9999);
    setFront(Math.floor(p * FRONTS.length));
  }

  /* =======================================================
     CASES — título travado; as fotos entram em sequência
     (grande → médio → pequeno) conforme o scroll
     ======================================================= */
  const casesEl = $("#cases");
  const casePhotos = $$(".case", casesEl);
  function updateCases() {
    const r = casesEl.getBoundingClientRect();
    const H = vh();
    casesEl.classList.toggle("is-visible", r.top < H * 0.6);
    const p = clamp(-r.top / (casesEl.offsetHeight - H));      // progresso enquanto travado
    const enter = r.top < H * 0.35;
    casePhotos.forEach((c, i) => {
      if (enter && p >= i * 0.28) c.classList.add("is-in");
    });
  }

  /* =======================================================
     JORNADA — globo nasce pequeno, cresce até quase a tela toda
     girando até o Brasil; faixa abre na vertical a partir do centro
     ======================================================= */
  const journey = $("#jornada");
  const globeSvg = d3.select("#globe");
  const band = $("#journeyBand");
  const labelsWrap = $("#globeLabels");
  const projection = d3.geoOrthographic().clipAngle(90).precision(0.6);
  const path = d3.geoPath(projection);
  const graticule = d3.geoGraticule10();
  const parallels = [0, -23.44, 23.44].map((lat) => ({ type: "LineString", coordinates: d3.range(-180, 181, 5).map((x) => [x, lat]) }));
  let land = null;

  const gSphere = globeSvg.append("path").attr("class", "g-sphere");
  const gGrat = globeSvg.append("path").attr("class", "g-grat");
  const gEq = globeSvg.append("path").attr("class", "g-eq");
  const gLand = globeSvg.append("path").attr("class", "g-land");
  const gPins = globeSvg.append("g");
  const pinEls = CITIES.map((c) => gPins.append("rect").attr("width", 10).attr("height", 10).attr("class", c.hq ? "g-pin is-hq" : "g-pin"));
  const labelEls = CITIES.filter((c) => c.label).map((c) => {
    const d = document.createElement("span");
    d.className = "globe-label";
    d.textContent = c.label;
    labelsWrap.appendChild(d);
    return { city: c, el: d };
  });

  let lastQ = -1;
  // mapa embutido em assets/data/land-110m.js → funciona até abrindo o arquivo direto (file://)
  const useTopo = (topo) => { land = topojson.feature(topo, topo.objects.land); lastQ = -1; };
  if (window.G4F_LAND) useTopo(window.G4F_LAND);
  else fetch("assets/data/land-110m.json").then((r) => r.json()).then(useTopo).catch(() => {});

  const FINAL_ROT = [52, 2];
  function updateJourney() {
    const r = journey.getBoundingClientRect();
    const q = clamp((vh() - r.top) / (journey.offsetHeight - vh())); // última tela = footer sobrepondo
    if (Math.abs(q - lastQ) < 0.0004 && lastQ !== -1) return;
    lastQ = q;

    const W = window.innerWidth, H = vh();
    const R = Math.min(H * 0.47, W * 0.47);
    const grow = easeInOut(range(q, 0.1, 0.46));
    const spin = easeOut(range(q, 0.05, 0.48));
    const cy = H / 2;
    projection
      .translate([W / 2, cy])
      .scale(lerp(R * 0.12, R, grow))
      .rotate([FINAL_ROT[0] + 300 * (1 - spin), FINAL_ROT[1] - 20 * (1 - spin), 0]);

    gSphere.attr("d", path({ type: "Sphere" }));
    gGrat.attr("d", path(graticule));
    gEq.attr("d", parallels.map((l) => path(l)).join(""));
    if (land) gLand.attr("d", path(land));

    const center = projection.invert([W / 2, cy]);
    const showPins = q > 0.44;
    CITIES.forEach((c, i) => {
      const [x, y] = projection(c.coords);
      const visible = d3.geoDistance(c.coords, center) < Math.PI / 2 - 0.05;
      pinEls[i].attr("x", x - 5).attr("y", y - 5).style("visibility", showPins && visible ? "visible" : "hidden");
    });
    const k = Math.max(u(), 0.6);
    labelEls.forEach(({ city, el: lab }, i) => {
      const [x, y] = projection(city.coords);
      lab.style.left = `${x + city.offset[0] * k}px`;
      lab.style.top = `${y + city.offset[1] * k}px`;
      lab.classList.toggle("is-in", q > 0.47 + i * 0.02);
    });

    band.style.setProperty("--open", easeInOut(range(q, 0.48, 0.58)).toFixed(4));
    band.style.setProperty("--text", easeOut(range(q, 0.56, 0.64)).toFixed(4));
    journey.classList.toggle("show-text", q > 0.64);
  }

  /* =======================================================
     LOOP
     ======================================================= */
  /* =======================================================
     SCROLL SUAVE (Lenis)
     ======================================================= */
  const lenis = (!reduceMotion && window.Lenis)
    ? new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4 })
    : null;
  const scrollToY = (y) => {
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  };

  function frame(t) {
    if (lenis) lenis.raf(t);
    updateNav();
    updateNumbers();
    updateFronts();
    updateCases();
    updateJourney();
    animateStack(t);
    requestAnimationFrame(frame);
  }

  // âncoras (seções sticky)
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (target === fronts) return goToFront(0);
      const extra = target === journey ? vh() * 1.3 : 0;
      scrollToY(target.getBoundingClientRect().top + window.scrollY + extra);
    })
  );

  window.addEventListener("resize", () => { lastQ = -1; fitStack(); });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  const start = () => { fitStack(); intro(); requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else window.addEventListener("load", start);
})();
