/* Public configuration only. Secrets belong in the Cloudflare Worker. */
(() => {
  const ENDPOINT = 'https://trecalici-contact.christofferjahren.workers.dev/contact';
  const SITE_KEY = '0x4AAAAAAE6oXP7SfndREesn';
  const states = new Map();
  let loading;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => { script.remove(); loading = null; reject(new Error('timeout')); }, 15000);
      window.trecaliciTurnstileReady = () => { clearTimeout(timeout); resolve(); };
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=trecaliciTurnstileReady';
      script.async = true;
      script.onerror = () => { clearTimeout(timeout); loading = null; script.remove(); reject(new Error('load')); };
      document.head.append(script);
    });
    return loading;
  }
  async function initialize() {
    for (const [form, state] of states) {
      if (!form.isConnected) {
        if (state.widget !== undefined) window.turnstile?.remove(state.widget);
        states.delete(form);
      }
    }
    const forms = [...document.querySelectorAll('form[data-contact]')].filter(f => !states.has(f));
    for (const form of forms) {
      const state = { token: '', busy: false, requestId: '', fingerprint: '' };
      states.set(form, state);
      const status = form.querySelector('[role="status"]');
      try {
        await loadTurnstile();
        if (!form.isConnected) { states.delete(form); continue; }
        state.widget = window.turnstile.render(form.querySelector('[data-turnstile]'), {
          sitekey: SITE_KEY, action: 'contact', theme: 'dark', size: matchMedia('(max-width: 380px)').matches ? 'compact' : 'flexible', language: 'nb',
          callback: token => { state.token = token; },
          'expired-callback': () => { state.token = ''; },
          'error-callback': () => { state.token = ''; status.textContent = 'Sikkerhetskontrollen kunne ikke lastes. Last siden på nytt eller kontakt oss på e-post.'; },
        });
        form.querySelector('button').disabled = false;
      } catch {
        status.textContent = 'Skjemaet kunne ikke lastes. Last siden på nytt eller kontakt oss på e-post.';
      }
    }
  }
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!form.matches('form[data-contact]')) return;
    event.preventDefault();
    const state = states.get(form);
    if (!state || state.busy) return;
    const status = form.querySelector('[role="status"]');
    if (!state.token) { status.textContent = 'Fullfør sikkerhetskontrollen før du sender.'; return; }
    const data = new FormData(form);
    const fields = { email: String(data.get('email') || '').trim(), topic: form.dataset.contact,
      consent: data.get('samtykke') === 'ja', honey: String(data.get('_honey') || ''), message: String(data.get('message') || '').trim() };
    const fingerprint = JSON.stringify(fields);
    if (fingerprint !== state.fingerprint) {
      state.requestId = crypto.randomUUID(); state.fingerprint = fingerprint;
    }
    state.busy = true;
    const button = form.querySelector('button');
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sender forespørselen din …';
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, token: state.token, requestId: state.requestId }), signal: AbortSignal.timeout(30000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('submit');
      form.reset();
      status.textContent = 'Takk! Vi har mottatt forespørselen din. Du får en bekreftelse på e-post, og vi følger opp så snart vi kan.';
      // Retain requestId for an identical accidental repeat (Resend deduplicates for 24h).
    } catch {
      status.textContent = 'Vi kunne ikke bekrefte at forespørselen ble sendt. Prøv igjen, eller kontakt oss på e-post.';
    } finally {
      state.busy = false; state.token = '';
      form.removeAttribute('aria-busy'); button.disabled = false;
      if (form.isConnected && state.widget !== undefined) window.turnstile.reset(state.widget);
    }
  });
  document.addEventListener('trecalici:navigated', initialize);
  initialize();
})();
