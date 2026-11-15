/* Carrossel de cases (Figma 4513:137924): as setas passam de um case para outro, em círculo.
   O case que sai some rápido; no que entra, os dados aparecem em sequência: cliente, valor e depois
   tag com descrição (CSS .case__slide.is-entering);
   o degradê do fundo desliza até a posição do novo case junto (case-bg.js). */
(function () {
  var slides = [].slice.call(document.querySelectorAll('.case__slide'));
  var prev = document.querySelector('.case__arrow--prev');
  var next = document.querySelector('.case__arrow--next');
  if (slides.length < 2 || !prev || !next) return;
  var idx = 0, timer = 0;
  function go(n) {
    n = (n + slides.length) % slides.length;
    if (n === idx) return;
    slides.forEach(function (s) { s.classList.remove('is-entering'); });
    slides[idx].classList.remove('is-active'); slides[idx].setAttribute('aria-hidden', 'true');
    void slides[n].offsetWidth; // reinicia a animação se o mesmo case voltar rápido
    slides[n].classList.add('is-active', 'is-entering'); slides[n].removeAttribute('aria-hidden');
    clearTimeout(timer);
    timer = setTimeout(function () { slides[n].classList.remove('is-entering'); }, 1500);
    idx = n;
    if (window.G4FCaseBg) window.G4FCaseBg.go(n);
  }
  prev.addEventListener('click', function () { go(idx - 1); });
  next.addEventListener('click', function () { go(idx + 1); });
})();
