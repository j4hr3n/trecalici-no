import test from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../worker/contact.mjs';
const env = { ALLOWED_ORIGINS: 'https://trecalici.no,https://j4hr3n.github.io', MAIL_FROM: 'Trecalici <sender@mail.example.com>', MAIL_TO: 'owner@example.com', RESEND_API_KEY: 'test', TURNSTILE_SECRET_KEY: 'test' };
const input = { email: 'visitor@example.com', topic: 'vinliste', consent: true, token: 'test-token', requestId: '12345678-1234-1234-1234-123456789abc' };
const request = (body = input, origin = 'https://trecalici.no') => new Request('https://worker.example/contact', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
const verified = { success: true, hostname: 'trecalici.no', action: 'contact' };
test('sends two separate emails with correct replies and stable idempotency', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, ...options });
    return url.includes('siteverify') ? json(verified) : json({ data: [{ id: 'a' }, { id: 'b' }] });
  };
  assert.equal((await handle(request(), env, fetcher)).status, 200);
  const batch = JSON.parse(calls[1].body);
  assert.deepEqual(batch[0].to, ['owner@example.com']);
  assert.equal(batch[0].reply_to, input.email);
  assert.deepEqual(batch[1].to, [input.email]);
  assert.equal(batch[1].reply_to, env.MAIL_TO);
  await handle(request({ ...input, token: 'fresh-token' }), env, fetcher);
  assert.equal(calls[1].headers['Idempotency-Key'], calls[3].headers['Idempotency-Key']);
});
test('rejects untrusted origins, malformed input and honeypot without external calls', async () => {
  const never = () => { throw new Error('unexpected outbound request'); };
  assert.equal((await handle(request(input, 'https://evil.example'), env, never)).status, 403);
  for (const body of [null, [], { ...input, email: 'a@b.com\nBcc:x@y.com' }, { ...input, consent: false }, { ...input, topic: '__proto__' }, { ...input, topic: { toString: 'bad' } }, { ...input, honey: 'bot' }, { ...input, token: '' }, { ...input, topic: 'kontakt', message: '' }, { ...input, message: 'x'.repeat(17000) }]) {
    assert.equal((await handle(request(body), env, never)).status, 400);
  }
});
test('requires successful CAPTCHA with matching hostname and action', async () => {
  for (const result of [{ success: false }, { ...verified, hostname: 'evil.example' }, { ...verified, action: 'other' }]) {
    let count = 0;
    const response = await handle(request(), env, async () => { count++; return json(result); });
    assert.equal(response.status, 403); assert.equal(count, 1);
  }
});
test('does not claim success on failed, partial or malformed upstream responses', async () => {
  for (const result of [() => json({ error: 'quota' }, 429), () => json({ data: [{ id: 'a' }] }), () => new Response('not JSON'), () => { throw new Error('network'); }]) {
    const response = await handle(request(), env, async url => url.includes('siteverify') ? json(verified) : result());
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes(env.MAIL_TO));
  }
});
test('escapes contact message HTML and does not reflect it to visitor', async () => {
  let batch;
  const response = await handle(request({ ...input, topic: 'kontakt', message: '<script>evil</script>' }), env, async (url, options) => {
    if (url.includes('siteverify')) return json(verified);
    batch = JSON.parse(options.body); return json({ data: [{ id: 'a' }, { id: 'b' }] });
  });
  assert.equal(response.status, 200);
  assert.ok(batch[0].html.includes('&lt;script&gt;'));
  assert.ok(!batch[1].text.includes('evil'));
});
test('preflight works and missing configuration fails closed', async () => {
  const preflight = await handle(new Request('https://worker.example/contact', { method: 'OPTIONS', headers: { Origin: 'https://trecalici.no' } }), env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), 'https://trecalici.no');
  assert.equal((await handle(request(), { ...env, RESEND_API_KEY: '' })).status, 503);
});
