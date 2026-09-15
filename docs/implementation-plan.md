# Trecalici Norge — visual direction and implementation plan

Date: 15 September 2026. Status: local design draft, not a production launch.

Implementation update: the owner confirmed no content is available yet and requested a skeleton. The accepted design is now implemented in `../site/` with directory-based URLs. The original draft below is preserved. See [verification](verification.md) and [maintenance / remaining content](maintenance.md). No publication has taken place.

## Agreed scope

- A Norwegian brochure website for both private customers and trade buyers.
- Homepage containing the logo, a short slogan and five navigation links.
- Five inner pages: Sjelden vin, Produsentene våre, Vinglass, Kaviar and Om oss.
- Visitors request the wine list through a prefilled email link. The owner manually replies with the current list. This is an individual request, not newsletter signup or automatic delivery.
- Plain static HTML and CSS. No JavaScript, framework, build pipeline, database, CMS, forms or checkout at launch.
- Website edits handled by the developer for now; this remains an assumption, not a confirmed ownership decision.

## 1. What the references actually show

The rendered websites were inspected on desktop and in an emulated mobile browser, with computed styles checked separately. Captures are saved in `reference-screenshots/`. Captures reflect the pages served during this review; content and promotional slides can change.

### Kakariko — https://kakariko.no/

- Warm cream background: `#F5EFE8`; dark brown text: `#1B1714`.
- Cormorant Garamond for major headings and editorial text; Inter for small navigation and labels.
- A narrow centered composition, generous vertical gaps, thin horizontal dividers and a restrained type hierarchy.
- Compact, widely spaced uppercase navigation. The mobile version stacks the brand and navigation above a multiline headline.
- Rounded outlined form controls and a mailing-list form are present on the homepage.
- Some elements fade into view. We waited for the initial fade before saving the final desktop reference.

**Use in this draft:** typography hierarchy, breathing room, fine rules and direct navigation. The requested homepage stays limited to its logo, slogan and links.

### Trecalici — https://www.trecalici.com/

- Near-black main surfaces: `#151515`; charcoal secondary areas: `#2C2C2B`; white branding and text.
- The supplied-on-site wordmark reads `TRECALICI.COM`, with the small `wine-commerce` descriptor.
- Spinnaker and Raleway appear in prominent interface text, alongside other Wix/widget font families.
- Broad horizontal navigation, thin separators, large photographic promotional slides and bright product-image panels against dark backgrounds.
- The mobile site uses a hamburger menu and keeps the search area prominent.
- The current commercial site also has account/cart controls, product carousels, reviews, a signup promotion, chat and a cookie banner. The signup overlay was dismissed for the main reference capture; the mobile capture still shows the cookie banner.

**Use in this draft:** the dark base, white wordmark and clear surface contrast. Navigation is limited to the five requested destinations.

## 2. Proposed visual specification

| Element | Decision | Basis |
| --- | --- | --- |
| Main background | `#151515` | Trecalici's current dark surface |
| Primary text | `#F5EFE8` | Kakariko's cream, repurposed as light text |
| Secondary text | `#B6AEA3` | Proposed warm neutral |
| Rules/borders | `#47433E` | Proposed subtle separator |
| Request panel | `#1D1C1A` | Proposed slight lift from the background |
| Headings/slogan | Cormorant Garamond | Observed at Kakariko |
| Body/navigation | Arial/Helvetica system stack | No additional font download |
| Corners | Square | Simple, restrained default |
| Motion | None | Explicit brief |
| Imagery | Owner-supplied, purposeful photos | Pending ZIP files |

One self-hosted heading font is enough. The draft includes the original TTF and its SIL Open Font License; convert it to a Latin WOFF2 including Norwegian characters before production. Do not add a font-loading service or runtime dependency.

### Logo treatment

The local draft contains a copy of the public Trecalici logo, with the `.COM` portion hidden through CSS cropping and `Norge` set below it. This is a provisional composition, not final logo artwork. Replace it with an approved transparent SVG or high-resolution PNG from the owner. The source image itself has not been modified.

### Responsive behavior

- Homepage: centered logo and slogan; five links in one row on desktop and a vertical list on mobile.
- Inner pages: small logo and visible navigation above the content. Links wrap on small screens, with the active page underlined.
- Text/request panel and producer rows: two columns on desktop, one on mobile.
- Product presentation: two columns initially, one on mobile. Increase the number of items through content edits, not new UI.
- Keep all navigation usable without JavaScript. Provide visible keyboard focus and a skip link.

## 3. Draft deliverables

Open `../draft/index.html` directly in a browser, or serve the directory locally:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory draft
```

Then visit http://127.0.0.1:4173/ from the same computer.

- Homepage: developed visual composition with the provisional slogan “Vin. Glass. Kaviar.”
- Sjelden vin: developed content layout and a prefilled email link.
- Remaining four pages: matching page layouts with explicitly labeled content/image/price placeholders.
- Desktop/mobile screenshots of the homepage, rare-wine page and glass page are saved in `draft-previews/`.
- All pages are marked `noindex,nofollow`; this is an indexing hint, not access control.
- The email uses `katalog@example.invalid`. It cannot deliver a catalogue request and must be replaced. No email was sent during verification.

The draft is for layout review. Its text is provisional and does not establish actual products, suppliers, prices or response times.

## 4. Production page requirements

| Page | Content and behavior | Needed from owner |
| --- | --- | --- |
| `/` | Logo, agreed slogan, five links; unobtrusive company footer | Final logo and slogan |
| `/sjelden-vin/` | Short factual introduction, approved imagery if appropriate, one email request action, visible address fallback | Recipient address, approved text and images |
| `/produsenter/` | A repeated section per producer: name, region, photo, short description and wine information; normal link to relevant PDF | Confirmed Norwegian producer list, text, images, PDF files or URLs |
| `/vinglass/` | Sophienwald brand introduction, product image/name/specification/price, email enquiry | Brand assets, actual products, prices, price basis and copy |
| `/kaviar/` | Giaveri introduction, product image/name/size/price, email enquiry | Brand assets, actual products, sizes, prices and copy |
| `/om-oss/` | Team photo, story, vision and company contact details | Photo, names, text, legal company name and contact details |

Producer PDFs and the rare-wine list are separate concerns. Producer catalogue links can be public if intended; the current rare-wine list is sent manually and need not be uploaded to the website. Do not parse PDFs, embed a PDF reader or create synchronisation logic.

## 5. Concrete implementation sequence

### Step A — settle the content pack

Organise the delivered ZIP material by page. Identify the final logo, intended slogan, actual catalogue recipient, current producer list and catalogue URLs. Record image captions/alt text where necessary. Keep source originals outside the public site directory. Avoid copying the Italian site's product availability or company details into the Norwegian site.

Resolve the factual wine copy and imagery boundaries before publishing. Norwegian rules constrain commercial alcohol communication and include limited exceptions for sober information on producer/wholesaler websites. The intended audience is both consumers and trade buyers; email requests do not by themselves establish that all proposed promotional material is permitted. Source: https://www.helsedirektoratet.no/lov-og-forskrift/alkoholloven/forbud-mot-alkoholreklame . This is a content requirement to settle with the business, not a reason to add a login system.

**Done when:** every page has the content it needs, and missing facts are resolved rather than invented.

### Step B — turn the draft into final static files

Use a single public directory with directory-based URLs:

```text
site/
  index.html
  sjelden-vin/index.html
  produsenter/index.html
  vinglass/index.html
  kaviar/index.html
  om-oss/index.html
  assets/styles.css
  assets/fonts/
  assets/images/
  kataloger/              # only the public PDFs, if any
  404.html
  robots.txt
  sitemap.xml
```

Move the agreed design into that structure. Keep shared design tokens in one stylesheet. Repeat the small header/footer HTML across six pages; a global text replacement is adequate at this scale. There is no generator or package installation required to serve the finished files.

Replace the provisional logo composition, copy and image placeholders. Remove all draft notes and the reserved email address. Implement product enquiry email links with a useful subject naming the product. Show the real contact address as a copyable fallback beside catalogue requests. Do not show a success state after a `mailto:` click: the website cannot know whether the visitor sent an email.

**Done when:** all six pages contain final content and navigation works through direct URLs and browser Back.

### Step C — prepare assets and metadata

- Resize supplied photos to their display needs; create compressed WebP/JPEG variants where useful.
- Use explicit image width/height and lazy-load imagery below the first screen.
- Serve the heading font locally as WOFF2 and retain its license.
- Set `lang="nb"`, one meaningful page heading, unique titles and descriptions.
- Add the final favicon, canonical URLs and a simple approved social preview image once the domain is known.
- Add a useful 404 page, sitemap and robots file. Remove draft `noindex` only for the final approved public site.

**Done when:** there are no public source ZIPs, unused originals, draft annotations or unintended external embeds.

### Step D — focused verification

- Check every route, all navigation links, PDF links, contact links and direct page reloads.
- Inspect desktop, 390px and 320px mobile layouts, plus a tablet breakpoint.
- Check keyboard navigation, focus visibility, heading order, alt text and contrast.
- Confirm the exact email recipient, decoded subject and body without sending a test message unless requested.
- Inspect Safari and Chromium once final assets are in place.
- Check loading performance, font size and image weights; fix concrete issues rather than adding a permanent test framework.

**Done when:** the site is readable, navigable and complete on the target screens and the owner has reviewed the final content.

### Step E — publish and hand over

Confirm who owns the domain and which hosting is already available. Deploy the `site/` directory to an ordinary static host. Existing hosting is preferable if adequate; Cloudflare Pages is a fallback option with static HTML support and optional Git publishing: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ . No hosting account or public deployment was created for this draft.

Configure the domain and HTTPS, check the public URLs, and leave a short editing guide covering text, prices, images and PDF replacement. Keep domain, hosting and catalogue-mailbox ownership with the business. The wine-list update process remains: edit the list privately, then attach the latest version when responding to requests.

**Done when:** the real domain serves the final files, all links work and the owner/developer knows how to make and roll back a content edit.

## 6. YAGNI boundaries

No shop integration, newsletter service, contact form provider, account system, analytics tracker, multilingual routing, searchable catalogue, stock management, component library or custom admin interface now. Revisit only when there is an observed need. Payment planning can wait until shipping, fulfilment, product range and merchant requirements are known.

## 7. Draft checks completed

- Six pages returned HTTP 200 at 1440px, 390px and 320px widths.
- No horizontal overflow or broken logo images at those widths.
- Five navigation links on every page; homepage-to-rare-wine navigation verified.
- Prefilled email URL inspected; recipient intentionally remains a marked placeholder.
- No browser JavaScript errors.
- Homepage, rare-wine page and glass-page desktop/mobile captures generated; homepage and rare-wine captures visually reviewed.
- Public reference sites visually reviewed on desktop and emulated mobile, with local screenshot evidence.
- The in-app preview could not connect to the local server. Direct HTTP checks and a separate browser render succeeded; use the local HTML file or saved screenshots if the inline preview is blank.

This is not yet final content validation, physical-device testing, Safari QA or a launch-ready site.
