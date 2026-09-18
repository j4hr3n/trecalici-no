import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import pages from '../worker/pages.json' with { type: 'json' };
const origin = (process.argv[2] || 'https://trecalici.no').replace(/\/$/, '');
const results = [];
async function check(name, run) {
  try { await run(); results.push({ name, pass: true }); }
  catch (error) { results.push({ name, pass: false, error: error.message }); }
}
const get = (path, options = {}) => fetch(origin + path, { redirect: 'manual', signal: AbortSignal.timeout(15000), ...options });
await check('Public homepage is accessible without authentication', async () => {
  const response = await get('/');
  assert.equal(response.status, 200, `Homepage returned ${response.status}; login redirects prevent crawling`);
});
if (results[0].pass) {
  for (const [path, page] of Object.entries(pages)) {
    await check(path + ' HTML and Markdown', async () => {
      const html = await get(path, { headers: { Accept: 'text/html' } });
      assert.equal(html.status, 200);
      assert.ok(!html.headers.get('X-Robots-Tag')?.includes('noindex'));
      assert.match(await html.text(), new RegExp('rel="canonical" href="https://trecalici.no' + path.replaceAll('.', '\\.') + '"'));
      const markdown = await get(path, { headers: { Accept: 'text/markdown' } });
      assert.equal(markdown.status, 200);
      assert.match(markdown.headers.get('content-type') || '', /text\/markdown/);
      assert.match(markdown.headers.get('vary') || '', /accept/i);
      assert.ok((await markdown.text()).includes(page.title));
    });
  }
  for (const path of ['/robots.txt', '/sitemap.xml', '/llms.txt']) await check(path, async () => {
    const response = await get(path); assert.equal(response.status, 200); assert.ok((await response.text()).includes('trecalici.no'));
  });
  await check('Unknown paths return 404', async () => assert.equal((await get('/seo-audit-nonexistent/')).status, 404));
  await check('www redirects to canonical origin', async () => {
    const response = await fetch('https://www.trecalici.no/', { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    assert.ok([301, 308].includes(response.status)); assert.equal(response.headers.get('location'), 'https://trecalici.no/');
  });
}
await mkdir('artifacts/production', { recursive: true });
await writeFile('artifacts/production/report.json', JSON.stringify({ date: new Date().toISOString(), origin, results }, null, 2) + '\n');
for (const result of results) console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ': ' + result.error : ''}`);
if (results.some(r => !r.pass)) process.exitCode = 1;
