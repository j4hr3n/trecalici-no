"""Stage GitHub project Pages without indexing a duplicate of production."""
import os
import re
import shutil
from pathlib import Path

target = Path('_pages')
if target.exists(): shutil.rmtree(target)
shutil.copytree('site', target)
prefix = os.environ.get('PAGES_BASE_PATH', '').rstrip('/')
for page in target.rglob('*.html'):
    source = page.read_text()
    source = re.sub(r'((?:href|src)=[\'"])/(?!/)', lambda m: m[1] + prefix + '/', source)
    source = re.sub(r'srcset="([^"]+)"', lambda m: 'srcset="' + ', '.join(prefix + '/' + v.strip().lstrip('/') for v in m[1].split(',')) + '"', source)
    source = re.sub(r'<meta name="robots"[^>]*>', '<meta name="robots" content="noindex, follow">', source)
    page.write_text(source)
# Crawlers must be allowed to retrieve and observe the HTML noindex directive.
(target / 'robots.txt').write_text('User-agent: *\nAllow: /\n')
