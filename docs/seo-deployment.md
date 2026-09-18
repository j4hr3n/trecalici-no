# SEO deployment and operations

Production origin: `https://trecalici.no`. Public email: `kontakt@trecalici.no`.

## State and access

The remote T3 runtime can build/test the site, but its Cloudflare OAuth token expired. Logging in on a different computer does not authenticate this runtime. The GitHub account is connected, but the old Pages deployment workflow is disabled and no repository deployment secrets were available. The latest main commit has a successful `Workers Builds: trecalici-no` check from the Cloudflare Workers and Pages app. This confirms an existing Git deployment integration, independent of CLI authentication. No production deployment or access-policy change was made by this implementation.

Deployment routes:

1. Use an authenticated terminal on any machine with this branch checked out, run `npm ci`, then `npm run deploy`.
2. Release the reviewed branch to `main` through the existing Cloudflare Workers Git integration for `trecalici-no`. Its latest build succeeded on the base revision. The Worker configuration includes the Python generation command. Recommended build command: `npm ci && npm run build && npm run check && npm test`; deploy command: `npx wrangler deploy`. Node 22.19+ or 24 is required. Retain the existing domain and Access configuration until the public launch step.

Do not copy tokens into source or chat. Remote login is an account operation, not a code change. Preserve the existing contact Worker and its secrets.

## Launch sequence

1. Run `npm run check`, `npm test`, `npm run test:browser`, `npm run audit` and `npx wrangler deploy --dry-run`. Review the reports and public copy.
2. Confirm the existing Worker/custom-domain association is `trecalici-no` → `trecalici.no`. `wrangler.jsonc` deliberately does not overwrite account-owned domain routes. Bind `www.trecalici.no` to the same Worker or configure an equivalent edge redirect. Its code redirects www/HTTP to the HTTPS apex, but can only do so for requests routed to it.
3. Deploy. When ready for public launch, remove the Cloudflare Access login requirement from public pages, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, Markdown and assets. Keep any private/staging services protected. Do not solve this with a User-Agent-based authentication bypass.
4. Confirm WAF/bot-management settings allow legitimate search and retrieval crawlers to read the public pages. Robots rules are not a WAF bypass and are not confidentiality controls.
5. Check the Turnstile widget's allowed hostnames and the contact Worker's `ALLOWED_ORIGINS`. The public email change does not create a mailbox or alter `MAIL_TO`/`MAIL_FROM`. Confirm that `kontakt@trecalici.no` receives mail and configure the form recipient as intended. Test actual delivery with an owner-controlled address; CI never sends mail.
6. Run `npm run verify:production`. It checks anonymous access first and fails clearly on an Access redirect, then checks HTML/Markdown, canonical URLs, headers, sitemap, robots, llms, 404s and www redirection.
7. Run `node scripts/scan-agent-readiness.mjs`. Archive both the Content Site and All Checks reports, including date, origin and enabled checks. The scanner API is an external dependency and may change; use its UI if the endpoint changes. Never label a local check as the scanner's production score.
8. Re-run PageSpeed Insights on the public domain. Inspect home, catalogue, a model detail page and producer page in Search Console's URL Inspection and the relevant structured-data validators. Product schema without offers/reviews is descriptive; it does not promise merchant or product rich-result eligibility.

## Search accounts and measurement

- Verify the `trecalici.no` domain property in Google Search Console using the account's issued DNS verification value. Submit `https://trecalici.no/sitemap.xml`; inspect representative URLs and look for unexpected exclusions or alternate canonicals. Do not invent verification tokens.
- Verify Bing Webmaster Tools and submit the same sitemap, or import the verified Search Console property where supported.
- Review indexed pages, Norwegian query impressions/clicks, landing-page traffic, identifiable AI referrals and qualified enquiries at 30/60/90 days. Use aggregate reporting; do not include form messages or email addresses in analytics events or page URLs.
- Track a stable small set of questions, e.g. “Hvilke vinglass har Trecalici Norge?”, “Hva er forskjellen på Sophienwald Phoenix-modellene?” and “Hvordan kontakter jeg Trecalici Norge?”. Record engine, date, language/location and cited URL. AI answers and citations vary; this is observational evidence, not a guaranteed attribution metric.
- Request corrections/additions to real supplier/distributor profiles and keep the company name, URL and contact consistent. External profile edits and outreach are not automated by this code. Assess Business Profile eligibility before creating a listing; do not invent a public storefront.

## Agent-readiness coverage

| Check | Implementation / remaining action |
| --- | --- |
| robots.txt | Generated origin-root file with sitemap and explicit search/retrieval/training rules |
| Sitemap | 18 canonical HTML URLs, generated and checked; no invented lastmod dates |
| Link response headers | Real canonical, sitemap, describedby/llms and Markdown-alternate resources |
| Markdown negotiation | Quality-aware Accept handling, real Markdown Content-Type, HEAD/404 behavior and Vary: Accept; same public content as HTML |
| AI bot rules | Search and AI-answer access allowed, training declined |
| Content Signals | Consistent robots directive and HTTP header: search=yes, ai-input=yes, ai-train=no |
| DNS-AID | Not published: needs authenticated DNS access and an actual agent/service to advertise, plus validation of the draft's discovery syntax/provider support |

DNS inspection on 18 September 2026 found Cloudflare nameservers and no DS record in the parent zone (authenticated denial from the resolver). Enabling DNSSEC requires the Cloudflare zone configuration and the matching registrar delegation, not just a site file.

DNS-AID is still an [Internet-Draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/). Its organization index discovers agents; this site currently serves content and protected contact forms. No fictitious MCP/A2A service or DNS record was created to force a green check. If a real agent service is introduced, publish the matching ServiceMode SVCB record(s), validate its capability descriptor, confirm DNSSEC at both authoritative and validating resolvers, then repeat the external check. A generic TXT record claiming “agent-ready” is not equivalent.

The Content Site target is seven checks, but only six are implemented in site code. Their external pass status remains unverified until public deployment. APIs, MCP, OAuth, A2A, WebMCP, payments and commerce remain the explicitly optional application scope in the plan. They are not necessary for a static information/enquiry website's search indexing, and no unsupported protocol is advertised.

`llms.txt` is supplementary discovery, not a ranking guarantee or a substitute for crawlable HTML. [Google's guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) emphasizes helpful content and ordinary search fundamentals. [Cloudflare documents](https://developers.cloudflare.com/workers/static-assets/binding/) the Worker-first routing used for response negotiation.

## Ongoing edits and rollback

Update `content/site.json`, `content/glasses.json` and the core HTML, then run `npm run build` and commit generated files alongside the change. Checks fail on stale outputs, missing assets/anchors, metadata duplication and sitemap mismatches. Run image preparation when originals change.

The Worker keeps HTML and Markdown variants on separate asset paths and varies the public page response by Accept. No custom cache layer stores a Markdown response under an HTML-only key. Assets have a bounded one-day cache; HTML/discovery revalidate. Avoid adding immutable caching to mutable filenames.

Rollback by deploying the previous known-good Git revision or Worker version. If rolling back to the old static-assets-only configuration, Markdown negotiation and discovery response headers will disappear; repeat the production checks. Access-policy and DNS changes are separate from Worker version rollback and must be reviewed independently.
