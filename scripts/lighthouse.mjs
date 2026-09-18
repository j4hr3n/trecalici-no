import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { chromium } from '@playwright/test';
import pages from '../worker/pages.json' with { type: 'json' };

const origin = 'http://127.0.0.1:4188';
const selected = process.env.AUDIT_PATHS ? process.env.AUDIT_PATHS.split(',') : Object.keys(pages);
const runs = Number(process.env.AUDIT_RUNS || 3);
if (!Number.isInteger(runs) || runs < 1) throw new Error('AUDIT_RUNS must be a positive integer');
for (const path of selected) if (!Object.hasOwn(pages, path)) throw new Error(`Unknown audit page: ${path}`);
// Fail instead of accidentally measuring a different process already on this port.
const probe = createServer();
await new Promise((resolve, reject) => { probe.once('error', reject); probe.listen(4188, '127.0.0.1', resolve); });
await new Promise(resolve => probe.close(resolve));
const summary = [];
const outputDirectory = process.env.AUDIT_OUTPUT || 'artifacts/lighthouse';
await mkdir(outputDirectory, { recursive: true });
const server = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--port', '4188'], { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' });
let logs = '';
server.stdout.on('data', b => { logs += b; });
server.stderr.on('data', b => { logs += b; });
let chrome;
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      const response = await fetch(origin);
      if (response.headers.get('Content-Signal')) { ready = true; break; }
    } catch { /* waiting for local Worker */ }
    if (server.exitCode !== null) throw new Error(logs);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Local Worker did not start.\n' + logs);
  chrome = await chromium.launch({ args: ['--remote-debugging-port=9237'] });
  for (const path of selected) {
    for (const mode of ['mobile', 'desktop']) {
      const results = [];
      for (let i = 0; i < runs; i++) {
        const options = { port: 9237, output: ['html', 'json'], logLevel: process.env.AUDIT_DEBUG ? 'info' : 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] };
        const result = await lighthouse(origin + path, options, mode === 'desktop' ? desktopConfig : undefined);
        if (result.lhr.runtimeError) throw new Error(JSON.stringify(result.lhr.runtimeError));
        if (result.lhr.configSettings.formFactor !== mode) throw new Error('Audit device configuration mismatch');
        const stem = `${path === '/' ? 'home' : path.replaceAll('/', '-').replace(/^-|-$/g, '')}-${mode}-${i + 1}`;
        await writeFile(`${outputDirectory}/${stem}.html`, result.report[0]);
        await writeFile(`${outputDirectory}/${stem}.json`, result.report[1]);
        results.push(result.lhr);
      }
      const scores = Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map(key => {
        const values = results.map(r => r.categories[key].score * 100).sort((a, b) => a - b);
        return [key, Math.round(values[Math.floor(values.length / 2)])];
      }));
      const diagnostics = [...new Set(results.flatMap(r => Object.values(r.audits).filter(a => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative').map(a => `${a.id}: ${a.title}`)))];
      const row = { path, mode, runs, scores, diagnostics, lighthouseVersion: results[0].lighthouseVersion, formFactor: results[0].configSettings.formFactor };
      summary.push(row);
      console.log(JSON.stringify(row));
      await writeFile(`${outputDirectory}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
    }
  }
  if (summary.some(r => r.scores.performance < 95 || ['seo', 'accessibility', 'best-practices'].some(k => r.scores[k] < 100))) process.exitCode = 1;
} finally {
  await chrome?.close();
  if (process.platform === 'win32') server.kill('SIGTERM');
  else {
    try { process.kill(-server.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
}
