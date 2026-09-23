# Trecalici Norge

Norwegian Bokmål website for **https://trecalici.no/**. Static HTML, shared CSS and progressively enhanced navigation/forms. A small Cloudflare Worker serves Markdown variants and discovery headers; the contact Worker is separate.

## Develop and verify

Requires Python 3.10+ and Node 22.19+ (Node 24 recommended).

```sh
npm ci
npm run build
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm run dev
```

The Worker preview runs at http://127.0.0.1:4187. For an HTML-only preview, `python3 -m http.server 4174 --bind 127.0.0.1 --directory site` also works, but does not test negotiation, redirects or headers.

`npm run audit` measures all 18 indexable pages in mobile and desktop Lighthouse, three runs per page/device. It saves HTML/JSON reports and median scores under `artifacts/lighthouse/`, and fails below 100 SEO/accessibility/best practices or 95 performance. It starts its own Worker on port 4188. `AUDIT_PATHS=/,/vinglass/ AUDIT_RUNS=1 npm run audit` runs a focused diagnostic. These are local lab measurements; production networking and field Core Web Vitals require separate verification.

## Content and generated files

- Edit the six primary pages under `site/` for public copy.
- Edit `content/site.json` for titles, descriptions, canonical origin, business identity and crawler policy.
- Edit `content/glasses.json` for the 12 models, dimensions and descriptions. It generates overview cards, comparison rows, detail pages and Product JSON-LD. Do not edit generated model pages directly. Suitability, features and colour come from each model's `sourceUrl` on sophienwald.com; keep them sourced.
- `content/site.json` also holds the registered address and Brreg URL (from Enhetsregisteret) and the parent house. `content/producers.json` maps each producer heading id on `/produsenter/` to its verified official website. Both parent house and producer sites appear only in JSON-LD, never as visible links, because Norwegian sites linking to alcohol advertising risk breaching alkoholloven § 9-2. Add a producer there when you add one to the page; the build fails otherwise.
- Run `npm run build` after edits. It updates marked metadata/breadcrumb blocks, detail pages, Markdown, sitemap, robots.txt, llms.txt and Worker manifests. Commit the generated outputs with the source changes. `npm run check` detects drift and broken links.
- Sitemap `lastmod` comes from `content/lastmod.json`, a generated hash manifest: a page's date moves to the build date only when its generated HTML changes. Commit it with the rest of the build output.
- `npm run prepare:images` regenerates responsive images and the typographic social card. Run `npm run build` afterward. Source images stay available; do not rename them without updating references.

The HTML, schema and Markdown use the same public content. Prices, stock and reviews are not invented. `/takk/`, errors and alternate Markdown files are excluded from search indexing; Markdown remains accessible to agents. Search/AI-answer crawlers are allowed; model-training crawlers are declined per the owner's choice. Google-Extended is declined because it combines training with Gemini grounding; Google Search remains allowed.

The owner provided `kontakt@trecalici.no` as the public contact. The Resend Worker recipient and sender settings are managed separately; see [contact setup](docs/resend-setup.md). No live email was sent during SEO verification.

## Deployment and remaining external setup

See [SEO deployment and operations](docs/seo-deployment.md) for the launch sequence and [implementation results](docs/seo-verification.md) for measured results and limitations.

At the implementation audit, production redirected to Cloudflare Access login. The remote runtime's Wrangler authentication had expired. The old GitHub Pages workflow was manually disabled, and the repository had no deployment secrets. A successful `Workers Builds: trecalici-no` check confirms that an existing Cloudflare Workers Git integration deploys `main`. Releasing code through that integration does not remove Access protection or configure DNS/search accounts; generated files alone do not make the live site crawlable.

```sh
# From an authenticated runtime, after reviewing the deployment target:
npm run deploy
npm run verify:production
node scripts/scan-agent-readiness.mjs https://trecalici.no/
```

`npm run deploy` generates and checks the site and tests before invoking Wrangler. It does not change Cloudflare Access, DNS, mailboxes, Search Console or Bing settings. Keep the separately deployed contact Worker intact. Never deploy `worker/contact.mjs` using the site's Wrangler configuration.

The disabled GitHub Pages workflow is retained for optional previews. Its staging script prefixes project paths and adds `noindex` while keeping production canonicals. It publishes only `site/`; draft files, docs and screenshots remain outside the hosted site. Source repository content is public.

## Content ownership

Final logo, producer/image permissions, Norwegian product prices/pack sizes, public catalogues and editorial review remain business-owned. The current logo is provisional. Existing source copy is retained; new content is based on existing facts and enquiry behavior. Keep private wine lists and customer information out of `site/`, source control, Markdown and discovery files.

- [Maintenance guide](docs/maintenance.md)
- [SEO/AEO plan](docs/seo-aeo-plan.md)
- [Earlier verification history](docs/verification.md)
- [Original design draft](draft/index.html)
