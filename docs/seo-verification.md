# SEO implementation verification

Date: 18 September 2026. Production target: `https://trecalici.no/`.

## Delivered

- Canonical metadata, unique titles/descriptions, Open Graph/social cards, Organization/WebSite/WebPage schema, visible breadcrumbs and matching BreadcrumbList schema.
- Eighteen indexable HTML pages: the six existing pages and twelve glass model detail pages. Collection lists and Product schema contain existing facts; prices, offers, stock and reviews are not invented.
- More informative homepage, glass comparison table, useful enquiry questions/answers and the owner's public email `kontakt@trecalici.no`.
- Generated sitemap, explicit crawler rules, owner-selected Content Signals, llms.txt and Markdown versions derived from the same public HTML.
- Worker content negotiation, real HTTP discovery headers, canonical alias redirects, preview/error noindex headers, bounded asset caching and HEAD/error handling.
- Metadata/body-class/history/hash synchronization in enhanced navigation; ordinary links still work without JavaScript.
- Responsive WebP images, a typographic social card, font-display swap and image priority/dimensions.
- Generation/link/schema checks, Worker and content-generation tests, browser tests, a Lighthouse CI workflow, production verification and external agent-scanner scripts.

## Verification performed

- `npm run check`: all 18 indexable pages pass generated-output consistency, canonical/title/description uniqueness, sitemap coverage, JSON-LD consistency, image attributes, assets, local links/anchors, ARIA references and substantive Markdown paragraph parity.
- `npm test`: 12 tests pass, including existing contact behavior and new quality-aware negotiation, redirects, HEAD/404 semantics, representation validators and a real content-edit/rebuild integration test.
- `npm run test:browser`: five tests pass. Every indexable page is checked at 390px and 1440px; navigation is verified across home, catalogue, detail, anchor links and browser history. Producer disclosures and product navigation also work with JavaScript disabled at 320px. No real form submission occurs. Browser tests stub Turnstile; Lighthouse runs do not.
- GitHub Pages staging: all HTML pages are noindexed, production canonicals retained, and project-prefixed links/responsive images resolve.
- Wrangler deployment dry-run succeeds with the `ASSETS` binding and the new site Worker. This bundles the deployment; it does not prove a live deployment.
- Reviewed screenshots of the homepage and product layout. Screenshots and complete audit reports are stored under ignored `artifacts/`; CI uploads them for review.
- `git diff --check` passes.

## Lighthouse methodology

Lighthouse 13.4.1 with Playwright Chromium, Node 24, local Cloudflare Worker, default simulated mobile and explicit desktop configurations. Three runs for each of 18 indexable pages on each device, using median category scores. The runner asserts the actual device mode to avoid accidentally applying mobile settings to desktop-labelled results. It does not disable failing audit categories or intercept third-party requests.

<!-- BEGIN RESULTS -->
**All release thresholds passed across 108 runs.** Median scores by page:

| Page | Mobile performance | Desktop performance | SEO / Accessibility / Best practices (both) |
| --- | ---: | ---: | --- |
| `/` | 100 | 100 | 100 / 100 / 100 |
| `/sjelden-vin/` | 100 | 100 | 100 / 100 / 100 |
| `/produsenter/` | 100 | 100 | 100 / 100 / 100 |
| `/vinglass/` | 99 | 100 | 100 / 100 / 100 |
| `/kaviar/` | 99 | 100 | 100 / 100 / 100 |
| `/om-oss/` | 100 | 100 | 100 / 100 / 100 |
| `/vinglass/phoenix-champagne/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/phoenix-blanc/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/phoenix-bordeaux/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/phoenix-bourgogne/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/phoenix-midi/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/phoenix-perlage/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/phoenix-twenty/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/grand-cru-champagne/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/grand-cru-bordeaux/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/grand-cru-bourgogne/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/dekanter/` | 99 | 100 | 100 / 100 / 100 |
| `/vinglass/deep-black/` | 99 | 100 | 100 / 100 / 100 |

[Machine-readable results](seo-lighthouse-results.json). Full HTML/JSON run reports are available locally in `artifacts/lighthouse/` and are uploaded by the quality workflow.
<!-- END RESULTS -->

The report is a local laboratory measurement. It does not establish production network performance, real-user Core Web Vitals or actual indexing. Run PageSpeed Insights and production checks after public launch. The localhost environment also differs from production Turnstile hostname configuration; actual form delivery remains a separate owner-controlled check.

## External dependencies and limitations

- Production currently redirects HTTP 302 to Cloudflare Access login. `npm run verify:production` fails on that first check instead of pretending to validate protected pages.
- Both isitagentready.com profiles were requested. The scanner followed the login redirect to the Cloudflare Access origin, so those results are invalid as Trecalici site scores. The scan script explicitly marks cross-origin results invalid and avoids retaining opaque login URLs. No improved live agent score is claimed.
- Six content-site readiness checks are implemented in code. DNS-AID remains unpublished: authenticated DNS access and an actual agent/service capability are required. DNS lookup found no parent-zone DS record, so DNSSEC configuration/delegation is also outstanding.
- Cloudflare CLI authentication on the remote runtime expired, and no authenticated browser was available. GitHub confirms an existing successful Cloudflare Workers Git build on the base `main` revision; releasing the branch through that integration is a deployment route. No merge, production deployment, Access change or DNS change was performed.
- Search Console/Bing verification and submission, supplier-profile updates, production structured-data validation and ongoing outcome measurement require live account access/public launch. No outreach messages were sent.
- Public contact links changed to the owner-supplied domain address. Mailbox delivery and the separately deployed contact Worker's recipient/sender settings were not changed or tested by sending email.
- Training is declined; search and AI inputs are allowed. Google-Extended is blocked because its control also covers training; this can limit Gemini grounding while leaving Google Search enabled.
- Original content/brand permissions, final logo and missing commercial data remain owner-managed. Producer biographies remain on the existing overview rather than being duplicated into thin pages. Optional API/authentication/MCP/commerce features from the plan were not advertised as implemented services.

See [deployment and operations](seo-deployment.md) for the concrete remaining steps.
