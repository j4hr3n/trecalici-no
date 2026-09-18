"""Small HTML tree and Markdown serializer for this site's static documents."""
import re
from html.parser import HTMLParser
from urllib.parse import urljoin

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

class Node:
    def __init__(self, tag='', attrs=None):
        self.tag, self.attrs, self.children = tag, dict(attrs or []), []
        self.parent = None

    def find_all(self, tag=None, cls=None):
        result = []
        for child in self.children:
            if isinstance(child, Node):
                if (tag is None or child.tag == tag) and (cls is None or cls in child.attrs.get('class', '').split()):
                    result.append(child)
                result.extend(child.find_all(tag, cls))
        return result

    def text(self):
        return re.sub(r'\s+', ' ', ''.join(c.text() if isinstance(c, Node) else c for c in self.children)).strip()

class Tree(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node('document')
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        node.parent = self.stack[-1]
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def markdown(node, base):
    if isinstance(node, str):
        return re.sub(r'\s+', ' ', node)
    tag, attrs = node.tag, node.attrs
    classes = attrs.get('class', '').split()
    if tag in {'script', 'style', 'input', 'textarea', 'button', 'label', 'noscript'} or 'hidden' in attrs or attrs.get('aria-hidden') == 'true' or 'producer-toggle' in classes or 'breadcrumbs' in classes:
        return ''
    inner = ''.join(markdown(c, base) for c in node.children).strip()
    if tag == 'img':
        alt = attrs.get('alt', '')
        return f"![{alt}]({urljoin(base, attrs['src'])})\n\n" if alt else ''
    if tag == 'a':
        return f"[{inner}]({urljoin(base, attrs.get('href', ''))})" if inner else ''
    if tag in {'strong', 'b'}:
        return f' **{inner}** '
    if tag in {'em', 'i'}:
        return f' *{inner}* '
    if tag in {'h1', 'h2', 'h3', 'h4'}:
        return '\n\n' + '#' * int(tag[1]) + ' ' + inner + '\n\n'
    if tag == 'br':
        return '\n'
    if tag == 'tr':
        cells = [markdown(c, base).strip().replace('|', '\\|') for c in node.children if isinstance(c, Node) and c.tag in {'td', 'th'}]
        row = '| ' + ' | '.join(cells) + ' |\n'
        if any(isinstance(c, Node) and c.tag == 'th' and c.attrs.get('scope') == 'col' for c in node.children):
            row += '| ' + ' | '.join('---' for _ in cells) + ' |\n'
        return row
    if tag in {'thead', 'tbody'}:
        return inner + '\n'
    if tag in {'table', 'caption'}:
        return '\n\n' + inner + '\n\n'
    if tag == 'dt':
        return inner + ': '
    if tag == 'dd':
        return inner + '\n'
    if tag == 'li':
        return '\n- ' + inner + '\n'
    if tag in {'p', 'section', 'article', 'div', 'nav', 'address', 'dl', 'details', 'summary', 'form', 'header'}:
        return '\n\n' + inner + '\n\n' if inner else ''
    return inner + (' ' if tag == 'span' else '')
