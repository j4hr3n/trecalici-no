import { mkdir, writeFile } from 'node:fs/promises';
const url = process.argv[2] || 'https://trecalici.no/';
const profiles = {
  content: ['robotsTxt', 'sitemap', 'linkHeaders', 'dnsAid', 'markdownNegotiation', 'robotsTxtAiRules', 'contentSignals'],
  all: ['robotsTxt', 'sitemap', 'linkHeaders', 'dnsAid', 'markdownNegotiation', 'robotsTxtAiRules', 'contentSignals', 'webBotAuth', 'apiCatalog', 'oauthDiscovery', 'oauthProtectedResource', 'authMd', 'mcpServerCard', 'agentSkills', 'webMcp', 'ard', 'x402', 'mpp', 'ucp', 'acp'],
};
await mkdir('artifacts/agent-readiness', { recursive: true });
for (const [profile, enabledChecks] of Object.entries(profiles)) {
  try {
    const response = await fetch('https://isitagentready.com/api/scan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, enabledChecks }), signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) throw new Error(`Scanner returned HTTP ${response.status}`);
    let result = await response.json();
    const wrongOrigin = result.url && new URL(result.url).origin !== new URL(url).origin;
    if (wrongOrigin) {
      result = { invalidTarget: true, requestedOrigin: new URL(url).origin, effectiveOrigin: new URL(result.url).origin, reason: 'The scanner followed a redirect to another origin; this is not a score for the requested site.' };
    }
    await writeFile(`artifacts/agent-readiness/${profile}.json`, JSON.stringify({ scannedAt: new Date().toISOString(), url, profile, enabledChecks, result }, null, 2) + '\n');
    console.log(`${profile}: report saved${result.invalidTarget ? '; INVALID: scanner reached another origin' : result.siteError ? '; site is inaccessible' : ''}`);
    if (result.siteError || result.invalidTarget) process.exitCode = 1;
  } catch (error) {
    console.error(`${profile}: ${error.message}`);
    process.exitCode = 1;
  }
}
