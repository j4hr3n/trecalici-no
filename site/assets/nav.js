/* Progressive enhancement: swap page content in place so shared chrome
   (header, footer) never repaints. Falls back to full navigation when
   fetch/parse fails or the script does not run. */
(() => {
  if (!('fetch' in window) || !window.DOMParser) return;

  history.scrollRestoration = 'manual';
  let latest = 0;

  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const swap = (doc, pop) => {
    const newMain = doc.querySelector('main');
    const curMain = document.querySelector('main');
    if (!newMain || !curMain) return false;
    const run = () => {
      const newHeader = doc.querySelector('header.header');
      const curHeader = document.querySelector('header.header');
      if (newHeader && curHeader) curHeader.replaceWith(newHeader);
      else if (newHeader) curMain.parentNode.insertBefore(newHeader, curMain);
      else if (curHeader) curHeader.remove();
      curMain.replaceWith(newMain);
      document.title = doc.title;
      const path = location.pathname;
      document.querySelectorAll('nav a').forEach((a) => {
        const p = new URL(a.href, location.href).pathname;
        if (p === path) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      if (pop) window.scrollTo(0, history.state && history.state.scroll ? history.state.scroll : 0);
      else window.scrollTo(0, 0);
      if (!pop) newMain.focus({ preventScroll: true });
    };
    if (document.startViewTransition && !reduceMotion()) document.startViewTransition(run);
    else run();
    return true;
  };

  const navigate = async (url, pop) => {
    const token = ++latest;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      if (token !== latest) return;
      if (!swap(doc, pop)) throw new Error('no main element');
      if (!pop) history.pushState({ scroll: 0 }, '', url);
    } catch (err) {
      if (!pop && token === latest) location.href = url;
    }
  };

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (!url.pathname.endsWith('/')) return;
    if (url.pathname === location.pathname) {
      if (url.hash && url.hash !== location.hash) return;
      e.preventDefault();
      window.scrollTo(0, 0);
      return;
    }
    e.preventDefault();
    history.replaceState({ scroll: window.scrollY }, '');
    navigate(url.href, false);
  });

  window.addEventListener('popstate', () => navigate(location.href, true));
})();
