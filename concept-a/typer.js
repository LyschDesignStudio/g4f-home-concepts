/* Hero: a frase é "digitada" ao carregar a página e, no fim, o botão aparece.
   Todas as letras já estão no lugar (só invisíveis), então as quebras de linha
   são as finais desde o início e nada pula durante a digitação. */
(function () {
  var root = document.documentElement;
  var title = document.querySelector('.hero__title');
  var btn = document.querySelector('.hero__content .btn');
  function done() { root.classList.remove('type-pending'); root.classList.add('type-done'); }
  if (!title || !btn) return done();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return done();

  var text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  title.textContent = '';
  var chars = [];
  text.split(/(\s+)/).forEach(function (part) {
    if (!part) return;
    if (/^\s+$/.test(part)) { var sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = ' '; title.appendChild(sp); chars.push(sp); return; }
    var word = document.createElement('span'); word.className = 'word'; word.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < part.length; i++) { var c = document.createElement('span'); c.className = 'ch'; c.textContent = part[i]; word.appendChild(c); chars.push(c); }
    title.appendChild(word);
  });
  root.classList.remove('type-pending');
  root.classList.add('typing');

  var i = 0, last = null;
  function tick() {
    if (last) last.classList.remove('caret');
    var c = chars[i++];
    c.classList.add('on', 'caret'); last = c;
    if (i < chars.length) {
      var ch = c.textContent, delay = 26 + Math.random() * 30;
      if (ch === ',' || ch === '.') delay += 220; else if (ch === ' ') delay += 25;
      setTimeout(tick, delay);
    } else {
      setTimeout(function () { root.classList.remove('typing'); root.classList.add('type-done'); }, 250);
      setTimeout(function () { last.classList.remove('caret'); }, 1900);
    }
  }

  var started = false;
  function start() { if (started) return; started = true; setTimeout(tick, 350); }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  setTimeout(start, 1500);
})();
