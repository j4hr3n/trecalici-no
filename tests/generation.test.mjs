import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

test('a single rebuild propagates edited business and product facts through HTML, schema and Markdown', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'trecalici-generation-'));
  try {
    for (const path of ['scripts', 'content', 'site', 'worker']) await cp(path, join(temp, path), { recursive: true });
    const config = JSON.parse(await readFile(join(temp, 'content/site.json'), 'utf8'));
    config.email = 'updated@example.org';
    config.pages['/'].title = 'Updated title for generation verification';
    await writeFile(join(temp, 'content/site.json'), JSON.stringify(config));
    const products = JSON.parse(await readFile(join(temp, 'content/glasses.json'), 'utf8'));
    products[0].volume = '421 ml';
    products[0].description = 'Updated product information for verification.';
    await writeFile(join(temp, 'content/glasses.json'), JSON.stringify(products));
    execFileSync('python3', ['scripts/build-seo.py'], { cwd: temp });
    execFileSync('python3', ['scripts/build-seo.py', '--check'], { cwd: temp });
    execFileSync('python3', ['scripts/check-site.py'], { cwd: temp });
    for (const path of ['site/vinglass/index.html', 'site/vinglass/index.md', 'site/vinglass/phoenix-champagne/index.html', 'site/vinglass/phoenix-champagne/index.md']) {
      const body = await readFile(join(temp, path), 'utf8');
      assert.ok(body.includes('421 ml'), path);
      assert.ok(body.includes('Updated product information for verification.'), path);
      assert.ok(body.includes('updated@example.org'), path);
      assert.ok(!body.includes('kontakt@trecalici.no'), path);
    }
    assert.ok((await readFile(join(temp, 'site/index.html'), 'utf8')).includes(config.pages['/'].title));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
