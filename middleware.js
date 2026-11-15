/* Senha de acesso ao site inteiro (capa e concepts), na Vercel (Routing Middleware).
   A senha fica na variável de ambiente SITE_PASSWORD do projeto, não no código (o repositório é público).
   Sem o cookie de acesso, qualquer página responde com a tela de senha (no estilo da capa do deck).
   O formulário envia para /__login; com a senha certa, grava um cookie (30 dias) e volta para a página pedida.
   Só os logos da tela de senha (/cover/) ficam abertos. */

export const config = { runtime: 'edge' };

const COOKIE = 'g4f_access';
const MAX_AGE = 60 * 60 * 24 * 30;

async function tokenFor(password) {
  const data = new TextEncoder().encode('g4f-home-concepts:' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

// só caminhos internos (evita redirecionar para outro site)
function safePath(p) {
  return typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\') ? p : '/';
}

// segue para o arquivo estático pedido (o mesmo que next() de @vercel/functions)
function pass() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function loginPage(next, error) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>G4F — Concepts da Home</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root { --bg: #181716; --cream: #fbf5ea; --muted: #8a8378; --line: rgba(251, 245, 234, .16); --error: #e8836f; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--cream); font-family: 'IBM Plex Mono', ui-monospace, monospace; min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
  main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 72px; padding: 48px 16px; }
  .logos { display: flex; align-items: center; justify-content: center; gap: clamp(32px, 4.2vw, 80px); }
  .logos img { display: block; height: auto; }
  .logos .lysch { width: clamp(150px, 12vw, 231px); }
  .logos .g4f { width: clamp(131px, 10.5vw, 201px); }
  form { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 360px; }
  label { font-size: 13px; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
  .row { display: flex; border: 1px solid var(--line); transition: border-color .25s; }
  .row:focus-within { border-color: var(--cream); }
  input { flex: 1; min-width: 0; background: transparent; border: 0; padding: 16px 18px; color: var(--cream); font: 500 16px 'IBM Plex Mono', ui-monospace, monospace; letter-spacing: .04em; outline: none; }
  button { border: 0; border-left: 1px solid var(--line); background: transparent; color: var(--cream); padding: 0 20px; font: 500 14px 'IBM Plex Mono', ui-monospace, monospace; letter-spacing: .04em; text-transform: uppercase; cursor: pointer; transition: background-color .25s, color .25s; }
  button:hover, button:focus-visible { background: var(--cream); color: var(--bg); outline: none; }
  .error { font-size: 13px; letter-spacing: .04em; color: var(--error); }
  footer { display: flex; justify-content: space-between; gap: 16px; padding: 0 20px 19px; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
  @media (max-width: 600px) { main { gap: 56px; } footer { flex-direction: column; gap: 4px; font-size: 11px; padding: 0 16px 16px; } }
</style>
</head>
<body>
<main>
  <div class="logos" role="img" aria-label="Lysch e G4F">
    <img class="lysch" src="/cover/lysch.svg" width="231" height="40" alt="">
    <img class="g4f" src="/cover/g4f.svg" width="202" height="56" alt="">
  </div>
  <form method="post" action="/__login">
    <label for="password">Senha de acesso</label>
    <div class="row">
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus${error ? ' aria-invalid="true" aria-describedby="error"' : ''}>
      <button type="submit">Entrar →</button>
    </div>
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    ${error ? '<p class="error" id="error" role="alert">Senha incorreta. Tente de novo.</p>' : ''}
  </form>
</main>
<footer>
  <span>Concepts da home · Novo site G4F</span>
  <span>Novembro 2026</span>
</footer>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/cover/')) return pass();

  const expected = process.env.SITE_PASSWORD;
  if (!expected) return new Response('SITE_PASSWORD não configurada.', { status: 500 });
  const token = await tokenFor(expected);

  if (url.pathname === '/__login') {
    if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
    const form = await request.formData();
    const next = safePath(String(form.get('next') || '/'));
    if ((await tokenFor(String(form.get('password') || ''))) !== token) return loginPage(next, true);
    return new Response(null, {
      status: 303,
      headers: {
        location: next,
        'set-cookie': `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
        'cache-control': 'no-store',
      },
    });
  }

  if (readCookie(request, COOKIE) === token) return pass();
  return loginPage(safePath(url.pathname + url.search), false);
}
