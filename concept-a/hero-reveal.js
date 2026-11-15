/* Hero: ao carregar, as palavras do título aparecem em sequência com fade,
   descendo levemente até o lugar; em seguida o botão aparece.
   As palavras já estão no lugar final (só transparentes), então nada pula. */
(function () {
  var root = document.documentElement;
  var title = document.querySelector('.hero__title');
  function finish() { root.classList.remove('type-pending'); root.classList.add('type-done'); }
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();

  var STAGGER = 40;   // ms entre palavras
  var DURATION = 550; // ms de cada palavra

  var text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  title.textContent = '';
  var words = text.split(/\s+/);
  words.forEach(function (w, i) {
    var s = document.createElement('span');
    s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
    s.style.setProperty('--d', (i * STAGGER) + 'ms');
    title.appendChild(s);
    if (i < words.length - 1) title.appendChild(document.createTextNode(' '));
  });

  var started = false;
  function start() {
    if (started) return; started = true;
    root.classList.remove('type-pending');
    root.classList.add('typing');
    root.classList.add('reveal');
    setTimeout(function () { root.classList.remove('typing'); root.classList.add('type-done'); },
      (words.length - 1) * STAGGER + DURATION * 0.6);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 1200);
})();
