/* Hero: ao carregar, as palavras do título aparecem em sequência com fade, subindo levemente até o lugar
   (igual ao Concept A); em seguida o botão aparece. Ao mesmo tempo a malha de pontos se forma ao fundo
   (hero-dots.js). As palavras já estão no lugar final (só transparentes), então nada pula. */
(function () {
  var root = document.documentElement;
  var title = document.querySelector('.hero__title');
  function finish() { root.classList.remove('hero-pending', 'hero-typing'); }
  if (!title || !root.classList.contains('hero-pending')) return finish();

  var STAGGER = 40;   // ms entre palavras
  var DURATION = 550; // ms de cada palavra
  var DELAY = 250;    // a malha começa a se formar um pouco antes do texto

  var text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  title.textContent = '';
  var words = text.split(/\s+/);
  words.forEach(function (w, i) {
    var s = document.createElement('span');
    s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--d', (DELAY + i * STAGGER) + 'ms');
    title.appendChild(s);
    if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
  });

  var started = false;
  function start() {
    if (started) return; started = true;
    root.classList.add('hero-typing', 'hero-in');
    root.classList.remove('hero-pending');
    setTimeout(function () { root.classList.remove('hero-typing'); },
      DELAY + (words.length - 1) * STAGGER + DURATION * 0.6);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 1200);
})();
