/* Botão flutuante (canto inferior esquerdo) para ir ao próximo concept, em ciclo: A → B → C → A.
   Cada concept tem um nome no botão (o C é o Blue Print); A e B ficam pela letra até ganharem nome.
   Fica fora do #page (que é escalado com zoom), no estilo da capa: fundo escuro, texto creme, IBM Plex Mono.
   Aparece um pouco depois do load, quando a entrada do topo já aconteceu. */
(function () {
  var CONCEPTS = [
    { slug: 'a', name: 'Concept A' },
    { slug: 'b', name: 'Concept B' },
    { slug: 'c', name: 'Blue Print' }
  ];
  var m = location.pathname.match(/\/concept-([a-z])\b/);
  var cur = 0;
  CONCEPTS.forEach(function (c, i) { if (m && m[1] === c.slug) cur = i; });
  var next = CONCEPTS[(cur + 1) % CONCEPTS.length];

  var font = document.createElement('link');
  font.rel = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap';
  document.head.appendChild(font);

  var css = document.createElement('style');
  css.textContent =
    '.concept-switch { position: fixed; left: 24px; bottom: 24px; z-index: 1000; display: inline-flex; align-items: center; gap: 12px;' +
    ' padding: 14px 18px; background: #181716; color: #fbf5ea; border: 1px solid #181716; text-decoration: none;' +
    " font: 500 13px/1 'IBM Plex Mono', ui-monospace, monospace; letter-spacing: .04em; text-transform: uppercase;" +
    ' box-shadow: 0 8px 24px rgba(0, 0, 0, .18); opacity: 0; transform: translateY(12px);' +
    ' transition: opacity .5s ease, transform .5s cubic-bezier(.2, .8, .2, 1), background-color .25s ease, color .25s ease, border-color .25s ease; }' +
    '.concept-switch.is-in { opacity: 1; transform: none; }' +
    '.concept-switch__arrow { display: inline-block; transition: transform .25s ease; }' +
    '.concept-switch:hover, .concept-switch:focus-visible { background: #fbf5ea; color: #181716; border-color: #181716; outline: none; }' +
    '.concept-switch:hover .concept-switch__arrow, .concept-switch:focus-visible .concept-switch__arrow { transform: translateX(3px); }' +
    '@media (max-width: 600px) { .concept-switch { left: 16px; bottom: 16px; padding: 12px 14px; font-size: 12px; } }' +
    '@media (prefers-reduced-motion: reduce) { .concept-switch { transition: background-color .25s ease, color .25s ease; transform: none; } }';
  document.head.appendChild(css);

  var a = document.createElement('a');
  a.className = 'concept-switch';
  a.href = '/concept-' + next.slug + '/';
  a.innerHTML = 'Ir para ' + next.name + ' <span class="concept-switch__arrow" aria-hidden="true">→</span>';
  document.body.appendChild(a);
  setTimeout(function () { a.classList.add('is-in'); }, 1200);
})();
