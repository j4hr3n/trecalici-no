#!/usr/bin/env python3
"""Fail on indexability, metadata, structured-data and internal-link regressions."""
import json
from pathlib import Path
from urllib.parse import urlparse, unquote
from xml.etree import ElementTree
from html_tools import Tree

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
CONFIG = json.loads((ROOT / 'content/site.json').read_text())
ORIGIN = CONFIG['origin']
PAGES = json.loads((ROOT / 'worker/pages.json').read_text())
errors, titles, descriptions = [], set(), set()

def check(ok, message):
    if not ok: errors.append(message)

def local_file(path):
    path = unquote(path).lstrip('/')
    target = SITE / path
    return target / 'index.html' if target.is_dir() or not path else target

def check_url(value, owner):
    url = urlparse(value)
    if url.scheme in {'mailto', 'tel', 'data'} or (url.netloc and url.netloc != urlparse(ORIGIN).netloc): return
    if url.path.startswith('/'):
        target = local_file(url.path)
    elif not url.path:
        target = owner
    else:
        target = owner.parent / unquote(url.path)
        if target.is_dir(): target /= 'index.html'
    check(target.is_file(), f'{owner.relative_to(SITE)}: missing URL {value}')
    if target.is_file() and target.suffix == '.html' and url.fragment:
        ids = {n.attrs.get('id') for n in Tree(target.read_text()).root.find_all()}
        check(unquote(url.fragment) in ids, f'{owner.relative_to(SITE)}: missing fragment {value}')

for file in sorted(SITE.rglob('*.html')):
    tree = Tree(file.read_text()).root
    path = '/' + str(file.relative_to(SITE)).replace('index.html', '')
    index = path in PAGES
    check(tree.find_all('html')[0].attrs.get('lang') == 'nb', f'{path}: language')
    check(len(tree.find_all('h1')) == 1, f'{path}: exactly one h1')
    title = tree.find_all('title')
    check(len(title) == 1 and title[0].text() not in titles, f'{path}: title missing/duplicate')
    titles.add(title[0].text())
    metas = tree.find_all('meta')
    description = [n.attrs['content'] for n in metas if n.attrs.get('name') == 'description']
    check(len(description) == 1 and description[0] not in descriptions, f'{path}: description missing/duplicate')
    descriptions.update(description)
    robots = [n.attrs['content'] for n in metas if n.attrs.get('name') == 'robots']
    check(len(robots) == 1 and ('noindex' in robots[0]) != index, f'{path}: robots policy')
    canonicals = [n.attrs['href'] for n in tree.find_all('link') if n.attrs.get('rel') == 'canonical']
    check(canonicals == ([ORIGIN + path] if index else []), f'{path}: canonical')
    ids = [n.attrs['id'] for n in tree.find_all() if 'id' in n.attrs]
    check(len(ids) == len(set(ids)), f'{path}: duplicate IDs')
    for n in tree.find_all():
        for key in ['href', 'src']:
            if key in n.attrs: check_url(n.attrs[key], file)
        for candidate in n.attrs.get('srcset', '').split(','):
            if candidate.strip(): check_url(candidate.strip().split()[0], file)
        for ref in (n.attrs.get('aria-labelledby', '') + ' ' + n.attrs.get('aria-describedby', '')).split():
            check(ref in ids, f'{path}: missing ARIA target {ref}')
    for img in tree.find_all('img'):
        check(all(a in img.attrs for a in ['alt', 'width', 'height']), f'{path}: image accessibility/dimensions')
    schemas = [n for n in tree.find_all('script') if n.attrs.get('type') == 'application/ld+json']
    if index:
        check(len(schemas) == 1, f'{path}: JSON-LD count')
        data = json.loads(schemas[0].text())
        graph = data['@graph']
        page = next(n for n in graph if n.get('@id') == ORIGIN + path + '#webpage')
        check(page['name'] == title[0].text() and page['description'] == description[0], f'{path}: schema metadata parity')
        for entity in graph:
            check('aggregateRating' not in entity and 'offers' not in entity, f'{path}: unverified commercial claims')
        md = (SITE / PAGES[path]['markdown'].lstrip('/')).read_text()
        check(ORIGIN + path in md and CONFIG['email'] in md, f'{path}: Markdown identity')
        # Substantive public paragraphs must survive conversion, including disclosures.
        for paragraph in tree.find_all('main')[0].find_all('p'):
            text = paragraph.text()
            parent = paragraph.parent
            excluded = False
            while parent:
                excluded = excluded or parent.tag == 'noscript' or 'hidden' in parent.attrs
                parent = parent.parent
            if excluded: continue
            if len(text) > 60 and not paragraph.find_all('a') and not paragraph.find_all('strong'):
                check(text in ' '.join(md.split()), f'{path}: Markdown missing paragraph {text[:60]}')

sitemap = ElementTree.parse(SITE / 'sitemap.xml')
urls = [n.text for n in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
check(set(urls) == {ORIGIN + p for p in PAGES} and len(urls) == len(PAGES), 'sitemap coverage')
check(len(sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod')) == len(urls), 'sitemap lastmod')
check(f'Sitemap: {ORIGIN}/sitemap.xml' in (SITE / 'robots.txt').read_text(), 'robots sitemap discovery')
check((SITE / 'assets/images/social-card.png').is_file(), 'social card missing')
if errors: raise SystemExit('\n'.join(errors))
print(f'Passed metadata, schema, links, images, Markdown parity and sitemap checks for {len(PAGES)} indexable pages.')
