// Paste this entire file into Cloudflare's Worker editor (ES module).
const TOPICS = {
  vinliste: ['Forespørsel om vinliste', 'Vi sender deg den gjeldende vinlisten så snart den er klar.'],
  vinglass: ['Forespørsel om vinglass fra Sophienwald', 'Vi kontakter deg med mer informasjon om vinglass fra Sophienwald.'],
  kaviar: ['Forespørsel om kaviar fra Giaveri', 'Vi kontakter deg med mer informasjon om kaviar fra Giaveri.'],
  kontakt: ['Kontakt med Trecalici Norge', 'Vi svarer deg så snart vi kan.'],
};
const emailPattern = /^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[^\s<>@,;\r\n]+$/;
const escape = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const markup = (text) => `<div lang="nb" style="max-width:560px;margin:auto;padding:32px;font:16px/1.6 Georgia,serif;color:#24201c"><h1 style="font-size:28px">Trecalici Norge</h1>${text.split('\n\n').map(p => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`).join('')}</div>`;

async function readBody(request) {
  if (!request.body) throw new Error('body');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  return JSON.parse(await new Blob(chunks).text());
}

export async function handle(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin' };
  const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });
  if (url.pathname === '/' && request.method === 'GET') return reply(200, { service: 'trecalici-contact', version: 1 });
  if (url.pathname !== '/contact') return reply(404, { error: 'not_found' });
  const origins = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = request.headers.get('Origin');
  if (!origin || !origins.includes(origin)) return reply(403, { error: 'origin' });
  headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply(405, { error: 'method' });
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.MAIL_FROM || !emailPattern.test(env.MAIL_TO || '')) return reply(503, { error: 'configuration' });
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return reply(415, { error: 'content_type' });
  let input;
  try { input = await readBody(request); } catch { return reply(400, { error: 'invalid_body' }); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { error: 'invalid_body' });
  const { email, topic, consent, token, requestId, honey = '', message = '' } = input;
  if (typeof email !== 'string' || email.length > 254 || !emailPattern.test(email) ||
      typeof topic !== 'string' || !Object.hasOwn(TOPICS, topic) || consent !== true || honey !== '' ||
      typeof message !== 'string' || message.length > 3000 ||
      (topic === 'kontakt' && !message.trim()) ||
      typeof token !== 'string' || !token || token.length > 2048 ||
      typeof requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(requestId)) return reply(400, { error: 'validation' });
  try {
    const verification = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token,
        remoteip: request.headers.get('CF-Connecting-IP') || undefined }),
      signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) return reply(503, { error: 'verification_unavailable' });
    const result = await verification.json();
    if (!result.success || result.action !== 'contact' || result.hostname !== new URL(origin).hostname) return reply(403, { error: 'verification' });
    const [subject, followup] = TOPICS[topic];
    const ownerText = `Ny forespørsel: ${subject}\n\nE-post: ${email}\nSamtykke til oppfølging: ja${message ? `\n\nMelding:\n${message}` : ''}`;
    // Never echo arbitrary visitor text in the confirmation email.
    const visitorText = `Hei!\n\nTakk for din henvendelse til Trecalici Norge. Vi har mottatt forespørselen din. ${followup}\n\nDu kan svare på denne e-posten hvis du vil legge til noe.\n\nMed vennlig hilsen\nTrecalici Norge`;
    const batch = [
      { from: env.MAIL_FROM, to: [env.MAIL_TO], reply_to: email, subject: `${subject} · Trecalici Norge`, text: ownerText, html: markup(ownerText) },
      { from: env.MAIL_FROM, to: [email], reply_to: env.MAIL_TO, subject: 'Vi har mottatt forespørselen din · Trecalici Norge', text: visitorText, html: markup(visitorText) },
    ];
    // Bind retries to the actual payload; keep this key stable across fresh CAPTCHA tokens.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(batch)));
    const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const response = await fetcher('https://api.resend.com/emails/batch', {
      method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contact/${requestId}/${hash}` },
      body: JSON.stringify(batch), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return reply(503, { error: 'email_unavailable' });
    const sent = await response.json();
    if (!Array.isArray(sent.data) || sent.data.length !== 2 || sent.data.some(item => !item.id)) return reply(503, { error: 'email_unavailable' });
    // Accepted for delivery is not a guarantee of inbox delivery.
    return reply(200, { ok: true });
  } catch {
    // Do not log credentials, visitor details or upstream error bodies.
    return reply(503, { error: 'temporarily_unavailable' });
  }
}
export default { fetch: (request, env) => handle(request, env) };
