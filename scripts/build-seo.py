#!/usr/bin/env python3
"""Generate SEO metadata, detail pages and discovery from public content only."""
import argparse
import html
import json
import re
from pathlib import Path
from html_tools import Tree, markdown

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
CONFIG = json.loads((ROOT / 'content/site.json').read_text())
GLASSES = json.loads((ROOT / 'content/glasses.json').read_text())
RESPONSIVE = json.loads((ROOT / 'content/responsive-images.json').read_text())
ORIGIN = CONFIG['origin']
PAGES = dict(CONFIG['pages'])
CHECK = argparse.ArgumentParser()
CHECK.add_argument('--check', action='store_true')
CHECK = CHECK.parse_args().check
CHANGED = []


def emit(path, text):
    path = ROOT / path
    if not path.exists() or path.read_text() != text:
        CHANGED.append(str(path.relative_to(ROOT)))
        if not CHECK:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)


def esc(value):
    return html.escape(str(value), quote=True)


def marked(source, name, content, before):
    block = f'<!-- BEGIN {name} -->\n{content}\n<!-- END {name} -->'
    pattern = rf'<!-- BEGIN {name} -->.*?<!-- END {name} -->'
    if re.search(pattern, source, re.S):
        return re.sub(pattern, lambda _: block, source, flags=re.S)
    return source.replace(before, block + '\n' + before, 1)


def crumbs(path, label):
    if path in {'/', '/404.html', '/takk/'}:
        return '', None
    items = [('Forside', '/')]
    if path.startswith('/vinglass/') and path != '/vinglass/':
        items.append(('Vinglass', '/vinglass/'))
    items.append((label, path))
    links = [f'<li><a href="{p}">{esc(n)}</a></li>' if p != path else f'<li aria-current="page">{esc(n)}</li>' for n, p in items]
    markup = '<nav class="breadcrumbs" aria-label="Brødsmuler"><ol>' + ''.join(links) + '</ol></nav>'
    schema = {'@type': 'BreadcrumbList', '@id': ORIGIN + path + '#breadcrumbs', 'itemListElement': [{'@type': 'ListItem', 'position': i, 'name': n, 'item': ORIGIN + p} for i, (n, p) in enumerate(items, 1)]}
    return markup, schema


# Glass facts are maintained once and drive cards, comparison and detail pages.
glass_source = (SITE / 'vinglass/index.html').read_text()
for product in GLASSES:
    slug, name = product['slug'], product['name']
    path = f'/vinglass/{slug}/'
    PAGES[path] = {'label': name, 'title': f'Sophienwald {name} – {product["volume"]} | Trecalici Norge', 'description': f'Sophienwald {name}, modell {product["model"]}: {product["volume"]}, høyde {product["heightSpec"]}. Les om glasset og kontakt Trecalici Norge for pris og tilgjengelighet.', 'image': product['image'], 'product': product}
    detail = re.sub(r'<!-- BEGIN SEO -->.*?<!-- END SEO -->', '', glass_source, flags=re.S)
    # Preserve only the common document shell, not the overview body.
    main = f'''  <main id="innhold" class="page" tabindex="-1">
    <p class="eyebrow">Sophienwald</p>
    <h1>{esc(name)}</h1>
    <div class="producer product-detail">
      <div>
        <p class="lead">{esc(product['description'])}</p>
        <p>Håndblåst glass fra Sophienwald. Modellen presenteres med produsentens mål nedenfor.</p>
        <dl class="specs">
          <div><dt>Modell</dt><dd>{esc(product['model'])}</dd></div>
          <div><dt>Volum</dt><dd>{esc(product['volume'])}</dd></div>
          <div><dt>Høyde</dt><dd>{esc(product['heightSpec'])}</dd></div>
        </dl>
        <h2>Pris og tilgjengelighet</h2>
        <p>Kontakt oss for informasjon om {esc(name)}, pris og tilgjengelighet. En henvendelse er ikke en bestilling.</p>
        <p><a class="button" href="/vinglass/#contact-title">Spør oss om {esc(name)}</a></p>
        <p>Du kan også sende en e-post til <a href="mailto:{esc(CONFIG['email'])}">{esc(CONFIG['email'])}</a>. Oppgi gjerne modell {esc(product['model'])}.</p>
        <p><a href="/vinglass/#sammenlign">Sammenlign alle Sophienwald-modellene</a></p>
      </div>
      <img class="detail-image" src="{product['image']}" alt="{esc(product['alt'])}" width="{product['width']}" height="{product['height']}" fetchpriority="high" decoding="async">
    </div>
  </main>'''
    detail = re.sub(r'  <main\b.*?</main>', lambda _: main, detail, flags=re.S)
    product['html'] = detail

rows = '\n'.join(f'<tr><th scope="row"><a href="/vinglass/{p["slug"]}/">{esc(p["name"])}</a></th><td>{esc(p["model"])}</td><td>{esc(p["volume"])}</td><td>{esc(p["heightSpec"])}</td></tr>' for p in GLASSES)
comparison = f'''<section class="collection" aria-labelledby="sammenlign">
      <h2 id="sammenlign">Sammenlign Sophienwald-glassene</h2>
      <p>Modellnumre og mål fra produsenten. Velg en modell for mer informasjon.</p>
      <div class="table-scroll" role="region" aria-label="Modelloversikt" tabindex="0">
        <table><caption>Volum og høyde for Sophienwald-modellene</caption>
          <thead><tr><th scope="col">Modell</th><th scope="col">Modellnummer</th><th scope="col">Volum</th><th scope="col">Høyde</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    </section>'''
glass_source = marked(glass_source, 'COMPARISON', comparison, '    <section class="collection"')
# Replace the existing cards in order with cards generated from the same facts.
cards = []
for p in GLASSES:
    cards.append(f'''<article id="{p['slug']}">
        <img class="product-image" src="{p['image']}" alt="{esc(p['alt'])}" width="{p['width']}" height="{p['height']}" loading="lazy" decoding="async">
        <h3><a href="/vinglass/{p['slug']}/">{esc(p['name'])}</a></h3>
        <p class="small">{esc(p['description'])}</p>
        <dl class="specs">
          <div><dt>Modell</dt><dd>{esc(p['model'])}</dd></div>
          <div><dt>Volum</dt><dd>{esc(p['volume'])}</dd></div>
          <div><dt>Høyde</dt><dd>{esc(p['heightSpec'])}</dd></div>
        </dl>
      </article>''')
card_iter = iter(cards)
glass_source = re.sub(r'<article\b[^>]*>.*?</article>', lambda _: next(card_iter), glass_source, flags=re.S)

org_id, website_id = ORIGIN + '/#organization', ORIGIN + '/#website'
org = {'@type': 'Organization', '@id': org_id, 'name': CONFIG['name'], 'legalName': CONFIG['legalName'], 'url': ORIGIN + '/', 'identifier': {'@type': 'PropertyValue', 'propertyID': 'NO organisasjonsnummer', 'value': CONFIG['organizationNumber']}, 'email': CONFIG['email'], 'logo': ORIGIN + '/assets/images/favicon-192.png', 'contactPoint': {'@type': 'ContactPoint', 'email': CONFIG['email'], 'contactType': 'customer service', 'availableLanguage': ['nb']}}
website = {'@type': 'WebSite', '@id': website_id, 'name': CONFIG['name'], 'url': ORIGIN + '/', 'inLanguage': 'nb', 'publisher': {'@id': org_id}}
manifest = {}
for path, meta in PAGES.items():
    relative = 'site/' + (path.strip('/') + '/index.html' if path.endswith('/') and path != '/' else 'index.html' if path == '/' else path.lstrip('/'))
    source = meta['product']['html'] if 'product' in meta else glass_source if path == '/vinglass/' else (ROOT / relative).read_text()
    for email in set(re.findall(r'mailto:([^?\"\s>]+)', source)):
        source = source.replace(email, CONFIG['email'])
    source = re.sub(r'<!-- BEGIN SEO -->.*?<!-- END SEO -->\s*', '', source, flags=re.S)
    source = re.sub(r'\s*<title>.*?</title>\s*', '\n', source, flags=re.S)
    source = re.sub(r'\s*<meta name="description"[^>]*>\s*', '\n', source)
    breadcrumb_html, breadcrumb = crumbs(path, meta['label'])
    source = re.sub(r'<!-- BEGIN BREADCRUMBS -->.*?<!-- END BREADCRUMBS -->\s*', '', source, flags=re.S)
    if breadcrumb_html:
        source = re.sub(r'(<main\b[^>]*>)\s*', lambda m: m[1] + '\n<!-- BEGIN BREADCRUMBS -->\n' + breadcrumb_html + '\n<!-- END BREADCRUMBS -->\n    ', source, count=1)
    index = meta.get('index', True)
    canonical = ORIGIN + path
    robots = 'index, follow, max-image-preview:large' if index else 'noindex, follow'
    graph = [org, website]
    page = {'@type': meta.get('type', 'WebPage'), '@id': canonical + '#webpage', 'url': canonical, 'name': meta['title'], 'description': meta['description'], 'inLanguage': 'nb', 'isPartOf': {'@id': website_id}, 'publisher': {'@id': org_id}}
    if breadcrumb:
        page['breadcrumb'] = {'@id': breadcrumb['@id']}
        graph.append(breadcrumb)
    if 'product' in meta:
        p = meta['product']
        page['mainEntity'] = {'@id': canonical + '#product'}
        graph.append({'@type': 'Product', '@id': canonical + '#product', 'name': 'Sophienwald ' + p['name'], 'description': p['description'], 'url': canonical, 'image': ORIGIN + p['image'], 'brand': {'@type': 'Brand', 'name': 'Sophienwald'}, 'mpn': p['model'], 'additionalProperty': [{'@type': 'PropertyValue', 'name': 'Volum', 'value': p['volume']}, {'@type': 'PropertyValue', 'name': 'Høyde', 'value': p['heightSpec']}]})
    if path in {'/produsenter/', '/vinglass/'}:
        items = [(p['name'], f'/vinglass/{p["slug"]}/') for p in GLASSES] if path == '/vinglass/' else [(n.text(), '/produsenter/#' + n.attrs['id']) for n in Tree(source).root.find_all('h2') if n.attrs.get('id')]
        page['mainEntity'] = {'@type': 'ItemList', 'numberOfItems': len(items), 'itemListElement': [{'@type': 'ListItem', 'position': i, 'name': n, 'url': ORIGIN + u} for i, (n, u) in enumerate(items, 1)]}
    graph.append(page)
    image = ORIGIN + '/assets/images/social-card.png'
    tags = [f'  <title>{esc(meta["title"])}</title>', f'  <meta name="description" content="{esc(meta["description"])}">', f'  <meta name="robots" content="{robots}">']
    if index:
        md_path = '/index.md' if path == '/' else path + 'index.md'
        tags += [f'  <link rel="canonical" href="{canonical}">', f'  <link rel="alternate" type="text/markdown" href="{md_path}" title="{esc(meta["title"])}">', '  <link rel="sitemap" type="application/xml" href="/sitemap.xml">']
        for prop, value in {'og:type': 'website', 'og:site_name': CONFIG['name'], 'og:locale': 'nb_NO', 'og:title': meta['title'], 'og:description': meta['description'], 'og:url': canonical, 'og:image': image, 'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': 'Trecalici Norge – vin, glass og kaviar'}.items():
            tags.append(f'  <meta property="{prop}" content="{esc(value)}">')
        for name, value in {'twitter:card': 'summary_large_image', 'twitter:title': meta['title'], 'twitter:description': meta['description'], 'twitter:image': image, 'twitter:image:alt': 'Trecalici Norge – vin, glass og kaviar'}.items():
            tags.append(f'  <meta name="{name}" content="{esc(value)}">')
        tags.append('  <script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c') + '</script>')
    source = marked(source, 'SEO', '\n'.join(tags), '</head>')
    def responsive_image(match):
        tag = match[0]
        src = re.search(r'src="([^"]+)"', tag)
        if not src or src[1] not in RESPONSIVE:
            return tag
        tag = re.sub(r'\s+(?:srcset|sizes)="[^"]*"', '', tag)
        sizes = '(max-width: 750px) calc(100vw - 48px), (max-width: 1150px) 45vw, 540px'
        if 'giaveri-storfarm' in src[1]:
            sizes = '(max-width: 750px) calc(100vw - 48px), (max-width: 1150px) calc(100vw - 80px), 1180px'
        if 'trecalici-logo' in src[1]:
            sizes = '(max-width: 750px) 440px, 687px' if path == '/' else '(max-width: 750px) 236px, 260px'
            if path != '/':
                tag = re.sub(r'\s+fetchpriority="[^"]*"', '', tag)
        elif 'giaveri-storfarm' in src[1] or 'sophienwald-glassblaser' in src[1]:
            tag = re.sub(r'\s+fetchpriority="[^"]*"', '', tag)
            tag = tag[:-1] + ' fetchpriority="high">'
        return tag[:-1] + f' srcset="{RESPONSIVE[src[1]]}" sizes="{sizes}">'
    source = re.sub(r'<img\b[^>]*>', responsive_image, source)
    emit(relative, source)
    if index:
        root = Tree(source).root
        main = root.find_all('main')[0]
        body = markdown(main, canonical)
        body = re.sub(r'\n[ \t]+', '\n', body)
        body = re.sub(r'\n{3,}', '\n\n', body).strip()
        body = '\n'.join(line.rstrip() for line in body.splitlines())
        md = f'---\ntitle: {json.dumps(meta["title"], ensure_ascii=False)}\nurl: {canonical}\nlanguage: nb\n---\n\n{body}\n\n---\n\nTrecalici AS · Org.nr 937 578 245\n\nKontakt: [{CONFIG["email"]}](mailto:{CONFIG["email"]})\n'
        emit('site' + md_path, md)
        manifest[path] = {'markdown': md_path, 'title': meta['title']}

emit('worker/pages.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
emit('worker/policy.json', json.dumps({'origin': ORIGIN, 'contentSignal': CONFIG['contentSignal']}, indent=2) + '\n')
emit('site/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{ORIGIN}{p}</loc></url>\n' for p in manifest) + '</urlset>\n')
training = 'yes' in CONFIG['contentSignal'].split('ai-train=')[1]
robots = f'# Public content usage policy: https://contentsignals.org/\nUser-agent: *\nContent-Signal: {CONFIG["contentSignal"]}\nAllow: /\n\n'
for bot in ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']:
    robots += f'User-agent: {bot}\nContent-Signal: {CONFIG["contentSignal"]}\nAllow: /\n\n'
robots += '# Google-Extended also controls Gemini grounding, separately from Google Search.\n'
for bot in ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Bytespider', 'Amazonbot', 'Applebot-Extended', 'meta-externalagent']:
    robots += f'User-agent: {bot}\n' + ('Allow: /' if training else 'Disallow: /') + '\n\n'
robots += f'Sitemap: {ORIGIN}/sitemap.xml\n'
emit('site/robots.txt', robots)
llms = f'# {CONFIG["name"]}\n\n> Trecalici AS i Norge. Italienske vinprodusenter, Sophienwald vinglass og Giaveri kaviar.\n\nOffisiell nettside: {ORIGIN}/\nSpråk: norsk bokmål. Kontakt: {CONFIG["email"]}. Org.nr 937 578 245.\n\n## Sider\n\n'
llms += ''.join(f'- [{m["title"]}]({ORIGIN}{m["markdown"]})\n' for m in manifest.values())
llms += '\n## Forespørsler\n\nVinlisten sendes manuelt etter henvendelse og er ikke offentlig tilgjengelig her. Pris og tilgjengelighet må avklares med Trecalici. Nettsidene tilbyr kontaktskjema og e-post, ikke automatisk bestilling eller betaling.\n\n## Innholdsformater\n\nHTML og Markdown inneholder den samme offentlige informasjonen. Send `Accept: text/markdown` til sidens URL eller bruk Markdown-lenkene over.\n'
emit('site/llms.txt', llms)
if CHECK and CHANGED:
    raise SystemExit('Generated files out of date; run npm run build:\n' + '\n'.join(CHANGED))
print(f'{"Verified" if CHECK else "Generated"} SEO and Markdown for {len(manifest)} indexable pages ({len(CHANGED)} files changed).')
