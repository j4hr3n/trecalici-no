import test from 'node:test';
import assert from 'node:assert/strict';
import { handle, representation } from '../worker/site.mjs';

const env = { ASSETS: { fetch: async request => {
  const path = new URL(request.url).pathname;
  if (path === '/missing/' || path.endsWith('/missing.md')) return new Response('<h1>Missing</h1>', { status: 404, headers: { 'Content-Type': 'text/html' } });
  const md = path.endsWith('.md');
  return new Response(md ? '# Public content' : '<h1>Public content</h1>', { headers: { 'Content-Type': md ? 'application/octet-stream' : 'text/html', ETag: md ? '"markdown"' : '"html"', Vary: 'Accept-Encoding' } });
} } };
const request = (path = '/', accept = 'text/html', method = 'GET') => new Request(`https://trecalici.no${path}`, { headers: { Accept: accept }, method });

test('negotiation honors quality and defaults to HTML without an explicit Markdown preference', () => {
  for (const [accept, expected] of [
    ['*/*', 'html'], ['text/*', 'html'], ['text/markdown', 'markdown'],
    ['text/markdown;q=0, text/html', 'html'], ['text/html;q=1, text/markdown;q=0.5', 'html'],
    ['text/html;q=0.4, text/markdown;q=0.9', 'markdown'], ['text/html, text/markdown', 'markdown'],
    ['text/html;q=0, */*;q=1', 'markdown'], ['text/html;q=0, text/markdown;q=0, */*;q=1', null],
    ['application/json', null], ['text/markdown;q=bogus', null],
  ]) assert.equal(representation(accept), expected, accept);
});

test('HTML and Markdown retain distinct validators and correct discovery headers in both request orders', async () => {
  for (const order of [['text/html', 'text/markdown'], ['text/markdown', 'text/html']]) {
    for (const accept of order) {
      const response = await handle(request('/vinglass/', accept), env);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('Vary'), /Accept-Encoding, Accept/);
      assert.match(response.headers.get('Link'), /https:\/\/trecalici.no\/vinglass\/.*rel="canonical"/);
      assert.equal(response.headers.get('Content-Signal'), 'search=yes, ai-input=yes, ai-train=no');
      assert.equal(response.headers.get('ETag'), accept === 'text/html' ? '"html"' : '"markdown"');
      assert.equal(response.headers.get('Content-Type'), accept === 'text/html' ? 'text/html' : 'text/markdown; charset=utf-8');
      assert.match(await response.text(), accept === 'text/html' ? /<h1>/ : /^# /);
    }
  }
});

test('HEAD, error and method semantics survive negotiation', async () => {
  assert.equal(await (await handle(request('/', 'text/markdown', 'HEAD'), env)).text(), '');
  const missing = await handle(request('/missing/', 'text/markdown'), env);
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get('X-Robots-Tag'), /noindex/);
  assert.equal(missing.headers.get('Link'), null);
  assert.equal((await handle(request('/', 'text/html', 'POST'), env)).status, 405);
  assert.equal((await handle(request('/', 'application/json'), env)).status, 406);
});

test('normalizes production origin and known document aliases, retaining query strings', async () => {
  for (const [url, expected] of [
    ['http://trecalici.no/vinglass/?x=1', 'https://trecalici.no/vinglass/?x=1'],
    ['https://www.trecalici.no/', 'https://trecalici.no/'],
    ['https://trecalici.no/index.html', 'https://trecalici.no/'],
    ['https://trecalici.no/vinglass/index.html', 'https://trecalici.no/vinglass/'],
    ['https://trecalici.no/vinglass', 'https://trecalici.no/vinglass/'],
  ]) {
    const response = await handle(new Request(url), env);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), expected);
  }
});

test('Markdown alternates and preview hosts are not indexed as duplicate HTML pages', async () => {
  const md = await handle(request('/vinglass/index.md'), env);
  assert.equal(md.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  assert.match(md.headers.get('Link'), /<https:\/\/trecalici.no\/vinglass\/>; rel="canonical"/);
  assert.match(md.headers.get('X-Robots-Tag'), /noindex/);
  const preview = await handle(new Request('https://preview.workers.dev/'), env);
  assert.match(preview.headers.get('X-Robots-Tag'), /noindex/);
  assert.equal((await handle(request(), env)).headers.get('X-Robots-Tag'), null);
});
