/* Static links work without JavaScript. Enhanced navigation keeps page metadata,
   history, focus and the document's layout class in sync with the loaded page. */
(() => {
  if (!('fetch' in window) || !window.DOMParser) return;
  history.scrollRestoration = 'manual';
  let latest = 0;
  const pageHead = 'title, meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[rel="alternate"], link[rel="sitemap"], script[type="application/ld+json"]';

  const navigate = async (url, pop) => {
    const token = ++latest;
    try {
      const res = await fetch(url, { headers: { Accept: 'text/html' } });
      if (!res.ok || !res.headers.get('content-type')?.includes('text/html')) throw new Error('page');
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const newMain = doc.querySelector('main');
      const curMain = document.querySelector('main');
      if (!newMain || !curMain) throw new Error('main');
      if (token !== latest) return;
      const destination = new URL(res.url || url, location.href);
      destination.hash = new URL(url, location.href).hash;
      const run = () => {
        if (token !== latest) return;
        if (!pop) history.pushState({ scroll: 0 }, '', destination.href);
        const newHeader = doc.querySelector('header.header');
        const curHeader = document.querySelector('header.header');
        if (newHeader && curHeader) curHeader.replaceWith(newHeader);
        else if (newHeader) curMain.parentNode.insertBefore(newHeader, curMain);
        else if (curHeader) curHeader.remove();
        curMain.replaceWith(newMain);
        document.body.className = doc.body.className;
        document.documentElement.lang = doc.documentElement.lang;
        document.head.querySelectorAll(pageHead).forEach(node => node.remove());
        doc.head.querySelectorAll(pageHead).forEach(node => document.head.append(node.cloneNode(true)));
        document.dispatchEvent(new Event('trecalici:navigated'));
        if (!pop) newMain.focus({ preventScroll: true });
        if (pop) window.scrollTo(0, history.state?.scroll || 0);
        else {
          let target;
          try { target = document.getElementById(decodeURIComponent(destination.hash.slice(1))); } catch { /* malformed fragment */ }
          if (target) target.scrollIntoView();
          else window.scrollTo(0, 0);
        }
      };
      if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        await document.startViewTransition(run).updateCallbackDone;
      } else run();
    } catch {
      if (token === latest) location.href = url;
    }
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a');
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !url.pathname.endsWith('/')) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    event.preventDefault();
    history.replaceState({ ...history.state, scroll: window.scrollY }, '');
    navigate(url.href, false);
  });
  window.addEventListener('popstate', () => navigate(location.href, true));
})();
