# Skeleton verification — 15 September 2026

Scope: the six pages in `site/` and the custom 404 page. Owner confirmed that content is not available yet and requested the skeleton only. This is not launch approval.

## Passed

- Chromium 139.0.7258.5: all seven pages at 1440, 768, 390 and 320px widths (28 page/viewport checks), with JavaScript disabled.
- No horizontal overflow, failed image loads or browser errors. All current images have explicit dimensions and alt attributes; the logo's empty alt is paired with an accessible brand label.
- Five visible navigation links on every page, correct active-page indication, and navigation targets at least 44px high.
- All six normal routes returned HTTP 200. Homepage links, direct page reloads and browser Back worked for all five inner pages.
- Skip link is first in keyboard order, becomes visible on focus and moves focus to the main content. The next link has a visible focus outline.
- One h1 and a unique title per page, Bokmål language attribute, balanced HTML tags, unique IDs, valid ARIA references and valid local asset paths.
- No horizontal overflow at 200% root text size at 320px, on all seven pages. Fixed long-word overflow found during this check.
- Four unique email URLs checked without sending email: vinliste, Sophienwald vinglass, Giaveri kaviar and general contact. Decoded recipient, subject, body and CRLF line breaks are valid. All recipients remain the deliberately non-deliverable `katalog@example.invalid`.
- Self-hosted WOFF2 loads. Font cmap includes ÆØÅæøå. Converted from 1,195,560 bytes to 125,712 bytes (about 88% smaller); license retained.
- Text contrast: primary on background 16.00:1; secondary on background 8.32:1; secondary on request panel 7.76:1; button text 16.00:1.
- Reviewed screenshots across all six page designs and the 404 page, including desktop, tablet and narrow mobile examples. The original visual direction is retained.
- No scripts, forms, external embeds, build dependencies or source ZIPs in `site/`.

[Machine-readable browser results](site-previews/check-results.json). Temporary browser and font tooling lives outside the repository; it is not needed to run the website.

## Screenshot review

| Page | Desktop | Mobile |
| --- | --- | --- |
| Homepage | [1440px](site-previews/index-1440.png) | [390px](site-previews/index-390.png) |
| Sjelden vin | [1440px](site-previews/sjelden-vin-1440.png) | [390px](site-previews/sjelden-vin-390.png) |
| Produsentene våre | [1440px](site-previews/produsenter-1440.png) | [390px](site-previews/produsenter-390.png) |
| Vinglass | [1440px](site-previews/vinglass-1440.png) | [390px](site-previews/vinglass-390.png) |
| Kaviar | [1440px](site-previews/kaviar-1440.png) | [390px](site-previews/kaviar-390.png) |
| Om oss | [1440px](site-previews/om-oss-1440.png) | [390px](site-previews/om-oss-390.png) |

320px, 768px and 404 screenshots are also in `site-previews/`.

## Unverified or intentionally pending

- Safari is installed, but WebDriver session creation failed because “Allow remote automation” is disabled. No Safari settings were changed. Safari and physical-device verification remain pending.
- The in-app browser reported no available browser. Use the local URL or saved screenshots.
- No producer PDFs or owner photos exist yet. No active PDF links were fabricated. Verify real files and captions after delivery.
- The email URLs are structurally checked only. The real address, mail-client handoff and delivery remain unverified. Product-specific enquiry subjects await actual product names.
- `/404.html` renders correctly; an unknown path returns HTTP 404 using Python's generic error page. The eventual host must map unknown paths to the custom page while preserving status 404.
- Canonicals, sitemap and social preview await domain/branding decisions. No false domain has been inserted. A provisional favicon (PNG set derived from the public circular Trecalici mark on trecalici.com) is linked from every page; re-check browser tab rendering and replace with approved branding later.
- All pages retain noindex, crawling is disallowed, and preview annotations remain visible. Content, branding and launch blockers are listed in the [maintenance guide](maintenance.md). Nothing was published.

## GitHub Pages workflow follow-up

The owner subsequently requested a hosted skeleton preview on pushes to `main`. The workflow YAML parses successfully, and its exact Python staging step was run with `/trecalici-no` as the base path. Every local HTML navigation and asset URL resolves within the staged site, including custom 404 links. Draft and documentation files are excluded from the deployment artifact. Source HTML is unchanged.

GitHub's Pages API rejected enablement with HTTP 422: the current plan does not support Pages for this private repository. The owner subsequently approved making the repository public; visibility was changed and the Pages API successfully enabled workflow-based publishing with HTTPS enforced. The baseline font license files have an existing trailing space; they are preserved verbatim.

## Addendum — Giaveri producer content on the kaviar page (16 September 2026)

The owner asked for producer information and images to be pulled from caviargiaveri.com into `site/kaviar/`. Text was translated to Bokmål from the about-us page (location wording from the sturgeon-farm page), and three images from the producer's site were saved under `site/assets/images/`: `giaveri-storfarm.jpg`, `giaveri-kaviarboks.jpg` and `giaveri-stor.jpg`. Approval from owner and producer is still pending for this borrowed content. Product names, photos, variants, sizes, prices and price basis remain to be supplied, so the product placeholders stay in place.

Re-checked with Chromium (Playwright build 139.0.7258.5): no horizontal overflow at 1440, 768, 390 and 320px, no console or page errors, all page images load, one h1 with valid heading order, lazy loading only on below-the-fold photos. The kaviar screenshots in `site-previews/` were regenerated at all four widths. Other pages are unchanged.
