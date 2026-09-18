# SEO, answer-engine visibility and agent readiness

Prepared 18 September 2026. Original implementation plan. The owner subsequently authorized implementation; see [implementation results](seo-verification.md) and [deployment dependencies](seo-deployment.md). No production changes have been made by this branch.

Confirmed production SEO target: **https://trecalici.no/** (owner supplied). Use this non-www HTTPS origin for canonical URLs, sitemap URLs and entity IDs.

## Objective and measures

Make Trecalici easy to discover, understand, cite and contact while preserving its visual design and static HTML architecture. Benchmark scores are release checks; search visibility and qualified enquiries are the business outcomes. Neither rankings nor AI citations can be guaranteed.

| Measure | Target |
| --- | --- |
| Lighthouse SEO | 100 on every indexable page, mobile and desktop |
| Lighthouse accessibility / best practices | 100 target; investigate every failure |
| Lighthouse performance | At least 95 mobile, aiming for 100; record median of three consistent runs |
| Real-user Core Web Vitals | LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile, when enough field data exists |
| Technical crawl | No broken internal links, accidental noindex, canonical conflicts, missing assets or soft 404s |
| Structured data | Valid schema matching visible content; no errors for intended supported rich results |
| isitagentready.com | Target all seven Content Site checks; also retain an All Checks report with inapplicable protocols explained |
| Search / AEO outcomes | Track indexed canonical pages, relevant query impressions/clicks, identifiable AI referrals and qualified enquiries monthly |

Sources: [Web Vitals](https://web.dev/articles/vitals), [Google AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [agent-readiness checker](https://isitagentready.com/). Scores measure different things and should not be combined into a single SEO claim.

## Findings from this repository

- Six content pages already provide server-readable HTML, `lang="nb"`, unique titles and descriptions, normal links, and locally hosted assets. Producer biographies remain in HTML inside native disclosures.
- No canonical tags, sitemap, JSON-LD, social metadata, Markdown representations or agent discovery configuration were found. `site/robots.txt` only allows all crawling.
- The homepage is mostly a logo, slogan and navigation. Its brand heading relies on an accessibility label and image rather than useful visible brand/category text.
- `site/assets/nav.js` replaces content and title but leaves the old description in the head. New canonicals, robots tags and JSON-LD would also become stale without a fix.
- `/takk/` and the standalone 404 document have no noindex metadata.
- There are 19 producer entries and 12 glass product articles, providing a starting point for useful detail pages. Availability, Norwegian prices and some business/brand details remain unconfirmed.
- The README identifies a GitHub Pages preview, while `wrangler.jsonc` configures Cloudflare static assets. The documented preview returned HTTP 404 during this audit. The owner confirmed `https://trecalici.no/` as production. Its homepage currently redirects (302) to Cloudflare Access login; automated redirect-following requests ended at HTTP 403, including attempts to fetch robots and sitemap. The public content is therefore not anonymously crawlable from this audit. No live Lighthouse or agent-readiness score is claimed.
- Existing verification and maintenance documents contain outdated statements about noindex, forms and hosting. Refresh them when implementing this plan.

## 1. Establish the production origin and baseline — P0

**Work:** Use `https://trecalici.no/` as the canonical origin; confirm its deployment configuration and public business contact. At public launch, remove the Cloudflare Access login requirement from intended public pages and discovery files, retaining protection for private/staging resources. This is the first SEO blocker. Keep the current gate until the site is ready for public launch; this plan does not change it. Configure HTTP and www variants to redirect to the canonical origin. Capture initial Lighthouse reports and both scanner profiles against the actual hostname, recording date, URL and check selection. Crawl all content pages with and without JavaScript.

**Recommended architecture:** Keep static HTML. Use the existing Cloudflare Workers static-assets configuration on a custom domain, adding a small request handler only where necessary for content negotiation. This gives control over redirects and headers. Confirm the deployed arrangement before changing it; the contact Worker is separate.

GitHub project Pages alone is a poor fit for origin-level agent discovery: `/trecalici-no/robots.txt` does not control the hostname's root `/robots.txt`, and custom response headers/content negotiation need an additional serving layer.

**Done when:** Canonical origin serves HTTPS 200s, unknown paths return real 404s, all assets work, and baseline reports are saved. The domain is confirmed; Cloudflare deployment/DNS access and launch readiness remain dependencies.

## 2. Complete technical SEO — P0

**Files:** All `site/**/*.html`, `site/robots.txt`, new `site/sitemap.xml`, `site/assets/nav.js`, host configuration and deployment workflow.

1. Add absolute self-referencing canonicals to indexable pages; normalize HTTPS, hostname, trailing slash and index.html variants with permanent redirects.
2. Publish a sitemap of canonical 200-status indexable pages. Exclude confirmation/error pages and previews; use truthful modification dates or omit them. Reference it from root robots.txt.
3. Add noindex to confirmation/error documents while allowing crawlers to see it. Keep error responses at HTTP 404. Decide preview indexing explicitly; redirect any retired public deployment where supported, otherwise remove it from indexing without blocking access to its noindex directive.
4. Improve page titles/descriptions around actual page intent; retain natural Bokmål. Add Open Graph and social-card metadata with an approved image and consistent absolute URLs. These improve presentation, not a guaranteed ranking bonus.
5. Update progressive navigation to replace page-specific description, canonical, robots, social tags and JSON-LD together, removing absent tags. Verify direct loads, internal navigation, back/forward and destination hashes. Retain ordinary-link/no-JavaScript behavior.
6. Introduce one small metadata/content manifest and a dependency-light generation/check script if needed to keep sitemap, JSON-LD and Markdown synchronized. Keep delivered HTML static; no framework migration required.

**Done when:** Every intended page passes metadata, canonical, status and internal-link checks; navigation produces the same page-specific head as a fresh load. Preview base-path rewriting also handles every newly generated URL format.

## 3. Strengthen content and entity identity — P1

**Work:** Improve the six existing pages first; expand only where there is enough original, verified information.

| Page | Implementation |
| --- | --- |
| Homepage | Visible brand text, a concise description of the business and whom it serves, plus short linked summaries of each category; preserve the visual style |
| Om oss | Consistent Trecalici AS identity, organisation number, approved business email, named team/expertise, public service area and clear enquiry process |
| Produsenter | Preserve overview; add dedicated producer URLs where substantive original Norwegian information exists; connect region, producer and relevant offerings |
| Vinglass | Add a useful model comparison table; create model detail pages with verified dimensions, material, use/care and images; publish prices/availability only when supplied |
| Kaviar | Clear producer/product facts and approved practical questions about the enquiry process; distinguish manufacturer information from the Norwegian offering |
| Sjelden vin | Explain the existing request process clearly; keep the private wine list private |

Use short direct answers under descriptive question headings, factual tables and descriptive internal links. Mark sources and actual review dates where helpful. Avoid repetitive keyword pages or mass-generated summaries. Public wine copy and catalogue scope must stay within the content constraints already recorded in the repository.

Add `Organization`, `WebSite` and page-specific `WebPage` JSON-LD with stable IDs and `inLanguage: nb`; add breadcrumbs when reflected in the UI, and appropriate collection/item markup. Use `Product` on genuine model detail pages. Do not invent reviews, offers, stock, a storefront address or importer relationships. Product rich-result eligibility is a separate test from basic schema validity. Useful Q&A does not require promising FAQ rich results.

Owner supplies final brand assets, contact details, approved facts and any missing product information. Build identity consistency through real producer/distributor listings and relevant earned links; assess Google Business Profile only if the business is eligible.

**Done when:** A reader or text-only agent can identify the business, offerings and next steps without guessing; structured data agrees with the page. See [Google structured-data policy](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) and [product guidance](https://developers.google.com/search/docs/appearance/structured-data/product).

## 4. Implement content-site agent readiness — P1

The checker's current Content Site preset contains these seven checks, verified in its public frontend on the audit date. Treat emerging protocols as versioned dependencies and recheck criteria during implementation.

| Check | Concrete work and acceptance |
| --- | --- |
| robots.txt | Serve valid plain text at the production origin root; allow public content and advertise the sitemap |
| Sitemap | Serve valid XML with real canonical URLs; verify every listed destination |
| Link headers | Advertise real discovery resources using valid Link relations, e.g. Markdown alternates; inspect scanner feedback to confirm accepted relations, and only advertise endpoints actually implemented |
| DNS-AID | Validate the current draft and host support; publish supported discovery records for a real content/discovery service, with DNSSEC where required. This is a research/DNS dependency: no fabricated MCP or A2A endpoint to earn a pass |
| Markdown negotiation | Requests with `Accept: text/markdown` return actual Markdown and matching Content-Type; ordinary browsers receive HTML; preserve status, content parity and `Vary: Accept` across caches |
| AI bot rules | Add explicit rules for currently documented search/agent crawlers; test WAF access as well as robots. User-Agent claims alone never bypass contact-form protections |
| Content Signals | Express search and AI-input permission consistently in robots and applicable responses; choose training policy separately. Proposed search=yes and ai-input=yes; training preference remains an owner decision |

Prefer Cloudflare's [Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) if the account supports it; otherwise serve generated Markdown through a small Worker. Test HTML→Markdown and Markdown→HTML cache ordering, Accept quality values, redirects, errors, and full content parity. Review default Content Signals before enabling conversion.

Add a concise `/llms.txt` and linked Markdown pages as a low-cost navigation aid, generated from the same approved public content. This is supplementary and is not one of the seven preset checks or a Google indexing requirement. Include no private lists, enquiry payloads or credentials.

**Done when:** All supported Content Site checks pass on the final hostname, with unresolved DNS/protocol limitations documented. Save both preset and default reports; do not portray a selected-check result as an All Checks score. [DNS-AID remains an Internet-Draft](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/).

## 5. Performance and regression protection — P1

Measure before optimizing. Resize/convert large images, supply responsive image candidates where useful, preserve intrinsic dimensions, prioritize the actual LCP asset and lazy-load below-fold images. Review font weight and preload usefulness. Load form/Turnstile resources only where needed without breaking enhanced navigation. Configure compression and appropriate cache lifetimes; fingerprint assets before using immutable long-term caching.

Add a CI audit workflow covering all page templates: metadata/JSON-LD, sitemap coverage, broken links, headings/accessible controls and Lighthouse targets. Add focused navigation and Markdown-negotiation tests. Run the existing contact tests if shared scripts or Worker routing change. Validate real production HTTP responses after deployment, not just local files.

**Done when:** Targets above pass, layout/keyboard/form behavior remains intact, and reports are stored as build artifacts. Lab performance cannot establish field INP or guarantee a Core Web Vitals pass on a new low-traffic site.

## 6. Launch and ongoing discovery — P1 / ongoing

Verify Google Search Console and Bing Webmaster Tools, submit the canonical sitemap, inspect representative URLs and monitor indexing/errors. Record enquiries with minimal necessary data and distinguish identifiable AI referrals from direct/unknown traffic; referrers undercount AI influence.

Maintain a small fixed set of Norwegian questions about Trecalici, Sophienwald and Giaveri. Review search results and AI citations monthly with date/location/context recorded; use findings to improve missing factual answers. Review impressions, click-through, relevant landing pages and enquiry quality at 30/60/90 days. Publish additional useful content based on evidence, not a fixed word count.

## Optional application scope after the content work

The scanner's default profile includes API/authentication/agent protocols beyond this site's current functionality. Keep its report visible, but do not create empty manifests to claim compatibility.

- If useful, create a real read-only public catalogue API with documented schemas, then evaluate API Catalog, ARD, Agent Skills and a read-only MCP service against actual user tasks.
- Add OAuth/protected-resource discovery only with a real authenticated resource. Evaluate Web Bot Auth only if authenticated agent access has a concrete purpose.
- WebMCP, A2A and agent-submitted enquiries need separate product requirements. Preserve consent, rate limits and existing form protections; never expose an anonymous CAPTCHA bypass.
- Payments and agentic-commerce protocols remain deferred, consistent with the repository. The current scanner frontend displays commerce separately from its scored categories; recheck its scoring before investing in those protocols.

## Suggested implementation sequence and effort

1. **PR 1:** Origin-aware metadata, sitemap/robots, navigation head synchronization and crawl checks — roughly 1–2 engineering days after deployment configuration is confirmed.
2. **PR 2:** Entity schema, homepage improvements and approved content updates — roughly 1–3 days plus owner content turnaround.
3. **PR 3:** Markdown, discovery headers, bot policies and DNS-AID feasibility/implementation — roughly 1–3 days, depending on host/DNS support.
4. **PR 4:** Measured performance fixes, CI benchmark gates, deployment checks and refreshed maintenance docs — roughly 1–2 days.
5. **Follow-up:** Substantive producer/product pages, external profile consistency and monthly outcome review. Estimate after inventorying approved source content.

The first four PRs total approximately 4–10 engineering days, excluding DNS waits, content approval and optional API/auth/commerce development. Domain-independent work can proceed while hosting details are resolved.
