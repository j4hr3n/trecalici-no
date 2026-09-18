import pages from './pages.json' with { type: 'json' };
import policy from './policy.json' with { type: 'json' };

// Honor explicit quality values and specificity. Wildcards alone retain HTML.
export function representation(accept = '*/*') {
  const ranges = accept.toLowerCase().split(',').map(part => {
    const [type, ...parameters] = part.trim().split(';');
    const quality = parameters.map(p => p.trim()).find(p => p.startsWith('q='));
    const q = quality ? Number(quality.slice(2)) : 1;
    return { type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0 };
  });
  function quality(type) {
    for (const candidate of [type, 'text/*', '*/*']) {
      const matches = ranges.filter(r => r.type === candidate);
      if (matches.length) return Math.max(...matches.map(r => r.q));
    }
    return 0;
  }
  const html = quality('text/html');
  const md = quality('text/markdown');
  const explicitMarkdown = ranges.some(r => r.type === 'text/markdown');
  if (md > 0 && (md > html || (explicitMarkdown && md === html))) return 'markdown';
  return html > 0 ? 'html' : null;
}

function vary(headers, value) {
  const existing = (headers.get('Vary') || '').split(',').map(v => v.trim()).filter(Boolean);
  if (!existing.some(v => v.toLowerCase() === value.toLowerCase())) existing.push(value);
  headers.set('Vary', existing.join(', '));
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const origin = new URL(policy.origin);
  if (['trecalici.no', 'www.trecalici.no'].includes(url.hostname) && (url.protocol !== 'https:' || url.hostname !== origin.hostname)) {
    url.protocol = 'https:';
    url.host = origin.host;
    return Response.redirect(url.href, 301);
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' } });
  }
  let path = url.pathname;
  const normalized = path.endsWith('/index.html') ? path.slice(0, -10) : path.endsWith('/') ? path : path + '/';
  if (pages[normalized] && path !== normalized) {
    url.pathname = normalized;
    return Response.redirect(url.href, 301);
  }
  const page = pages[path];
  const alternate = Object.entries(pages).find(([, value]) => value.markdown === path);
  const format = page ? representation(request.headers.get('Accept') || '*/*') : null;
  if (page && !format) {
    return new Response(request.method === 'HEAD' ? null : 'Available representations: text/html, text/markdown', {
      status: 406, headers: { Vary: 'Accept', 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const assetUrl = new URL(url);
  if (format === 'markdown') assetUrl.pathname = page.markdown;
  const assetRequest = new Request(assetUrl, request);
  const response = await env.ASSETS.fetch(assetRequest);
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Content-Signal', policy.contentSignal);
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((!isLocal && url.hostname !== origin.hostname) || response.status === 404 || path === '/404.html' || path === '/takk/' || alternate) {
    headers.set('X-Robots-Tag', 'noindex, follow');
  }
  if (page) vary(headers, 'Accept');
  if (response.ok || response.status === 304) {
    headers.set('Cache-Control', path.startsWith('/assets/') ? 'public, max-age=86400' : 'public, max-age=0, must-revalidate');
    if (format === 'markdown' || alternate) headers.set('Content-Type', 'text/markdown; charset=utf-8');
    if (path === '/robots.txt' || path === '/llms.txt') headers.set('Content-Type', 'text/plain; charset=utf-8');
    if (path === '/sitemap.xml') headers.set('Content-Type', 'application/xml; charset=utf-8');
    const canonicalPath = alternate ? alternate[0] : path;
    if (page || alternate) {
      const links = [`<${policy.origin}${canonicalPath}>; rel="canonical"`, `<${policy.origin}/sitemap.xml>; rel="sitemap"; type="application/xml"`, `<${policy.origin}/llms.txt>; rel="describedby"; type="text/plain"`];
      if (page) links.push(`<${policy.origin}${page.markdown}>; rel="alternate"; type="text/markdown"`);
      headers.set('Link', links.join(', '));
    }
  }
  return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, statusText: response.statusText, headers });
}

export default { fetch: handle };
