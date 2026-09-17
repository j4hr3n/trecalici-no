# Maintenance and content handover

The site is a review skeleton. Edit the HTML in `site/` directly; no build or generator is involved. Shared styles live in `site/assets/styles.css`. Keep `draft/` as reference.

## Routine edits

1. Save or commit a known-good copy before editing. The initial workspace was untracked; create a baseline commit when ready.
2. Update the relevant page's `index.html`. Preserve `lang="nb"`, one `h1`, heading order, skip link, and `aria-current="page"` on its navigation link.
3. Headers and footers are intentionally repeated. Apply shared navigation, logo, email and footer changes to all six pages and `404.html`.
4. Preview using the README command. Check desktop and narrow mobile layouts, then follow the links you changed. Inspect form actions and subjects without submitting.
5. Review the diff. The GitHub Pages workflow publishes only `site/` on pushes to `main`. Final company hosting remains undecided. Roll back by restoring the previous known-good files or hosting version.
6. The three product forms also appear in routine checks: confirm the `action` addresses, consent checkboxes and the `/takk/` confirmation page still resolve. Do not submit real forms to the placeholder address.

## Add the owner's content pack

Keep ZIPs and original photos outside `site/`. Confirm rights, names, captions and the intended Norwegian content with the owner. Do not treat the Italian site's products, claims or availability as Norwegian facts.

| Page | Replace or supply |
| --- | --- |
| Homepage | Approved transparent logo and final slogan |
| Sjelden vin | Brief approved introduction, appropriate approved imagery, real email |
| Produsentene våre | One article per confirmed producer: name, location, photo, description, wine information and catalogue PDF |
| Vinglass | Sophienwald introduction; actual model names, photos, volume, height, pack quantity, price and price basis |
| Kaviar | Giaveri introduction; actual names, photos, variants, sizes/net weights, prices and price basis |
| Om oss | Team photo/names, story, vision, legal company name, organisation number and contact details |

The two product cards on each product page are layout examples, not an asserted product count. Duplicate or remove complete `<article>` blocks to match the supplied range. Missing PDF status is plain text, deliberately not a link.

### Images and logo

Save resized, compressed delivery images under `site/assets/images/` with descriptive lowercase filenames. Use WebP or JPEG for photos, approved SVG or transparent PNG for branding. Set intrinsic `width` and `height`, accurate Bokmål `alt` text, and `loading="lazy"` for photos below the first screen. Avoid lazy loading the first prominent image. For example:

```html
<img class="product-image" src="/assets/images/approved-product.webp"
     alt="Beskrivelse av det faktiske produktet"
     width="1000" height="1000" loading="lazy" decoding="async">
```

Use the actual filename, dimensions and description. Product photos use `object-fit: contain` to keep the full item visible. Producer/team photos use normal responsive image styling.

Replace the `.wordmark` crop and provisional image on every page with final artwork. Update dimensions and `.brand` styling to suit it. Remove separate `Norge` text if already included in the artwork. Delete the provisional image after replacing every reference.

### Email capture forms and wine list

The three product pages collect visitor emails with plain HTML forms posted to [FormSubmit](https://formsubmit.co/), a free form-to-email service that needs no account, API key or hosting change:

- Sjelden vin: sends the wine list. Subject `Forespørsel om vinliste — Trecalici Norge`.
- Vinglass: enquiry about Sophienwald glasses. Subject `Forespørsel om vinglass fra Sophienwald — Trecalici Norge`.
- Kaviar: enquiry about Giaveri caviar. Subject `Forespørsel om kaviar fra Giaveri — Trecalici Norge`.

Each submission emails the owner (table template, subject names the interest) and FormSubmit instantly auto-responds to the visitor with a Bokmål confirmation via the form's `_autoresponse` field. Om oss intentionally keeps its manual `mailto:` contact.

Every form points its `action` at `https://formsubmit.co/squares-cabinet.1g@icloud.com`, a temporary address set up for testing; om oss uses the same address in its `mailto:` link. To activate the forms:

1. Deploy, submit one form on the live site, and click the confirmation link FormSubmit emails to that address. This is a one-time activation per receiving address.
2. Submit again to confirm both the owner notification and the visitor auto-response arrive.
3. Before launch, replace the temporary address with the confirmed receiving address in the three `action` attributes and the om-oss `mailto:` link, then repeat activation for the new address.

Keep the required consent checkbox and the hidden `_honey` honeypot in each form. Forms rely on FormSubmit's reCAPTCHA (default, enabled); note that `_autoresponse` stops working if reCAPTCHA is disabled or the form is submitted via AJAX.

After a successful submission FormSubmit redirects to `/takk/`. `assets/nav.js` injects that absolute redirect URL (`_next`) at runtime, derived from the script's own URL, so it resolves both at the site root and under the GitHub Pages base path. Without JavaScript, FormSubmit shows its own thank-you page instead. Keep the wine list outside the public site; the owner replies manually with the private attachment. A data-processing/privacy review for the collected emails is still pending before launch.

Product enquiry copy currently names the brand/category. When actual products arrive, put an enquiry form or link in each product article with its actual name.

### Producer PDFs

Place only approved public producer PDFs in `site/kataloger/`. Add a normal link where the missing-catalogue text is now:

```html
<a href="/kataloger/approved-producer.pdf" type="application/pdf">
  Se katalogen fra [godkjent produsentnavn] (PDF)
</a>
```

Use the actual filename and producer name. Open in the same tab so ordinary Back navigation works. Verify it returns the correct PDF, including after replacing an old catalogue. These PDFs are separate from the private rare-wine list. The empty `kataloger/` directory can be created when the first PDF arrives if version control does not retain it.

## Before launch

- Resolve missing-content labels and HTML placeholder comments. Approve the final logo, slogan and all content with the owner.
- Settle wine copy, imagery and public-PDF constraints documented in the implementation plan with the business. This skeleton does not establish content approval.
- Confirm email, products, amounts, sizes, currency, VAT treatment and whether prices are per item, pack or tin.
- Agree domain, hosting access/ownership and ongoing editing responsibility. Use existing hosting if it serves directory index files over HTTPS and a custom 404 page.
- A provisional favicon is in place: PNG sizes generated with `sips` from the public Trecalici circular mark used by trecalici.com (`favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` in `assets/images/`). Regenerate from approved branding when it arrives; keep the head links on every page including `404.html`. Add the approved social image and page-specific metadata. Add absolute canonical URLs and `sitemap.xml` with the six real HTTPS URLs once the domain is confirmed. Do not invent a domain.
- Configure the host to serve `site/404.html` with HTTP status 404 for unknown paths. Python's preview server returns its own generic 404; `/404.html` previews the designed page.
- Only for the completed approved launch: remove `noindex,nofollow`, replace the preview footer with approved company details, remove preview notes, and update `robots.txt` to allow crawling and reference the real sitemap. Robots and noindex do not protect confidential material.
- Recheck Chromium and Safari, keyboard navigation, 320/390px mobile and tablet layouts, actual image loading, PDFs and decoded email messages. Check public HTTPS URLs after launch.

Payments remain deferred. No framework, CMS, database, package dependencies or build pipeline is needed for these edits; the only script is assets/nav.js.

## GitHub Pages deployment

The owner requested an online skeleton preview after the initial local review. `.github/workflows/pages.yml` handles pushes to `main` and manual runs. It uses GitHub's official configure, artifact-upload and deployment actions. A deployment-only copy receives the Pages URL prefix; original HTML stays usable at the local server root. CSS font paths are already relative. This also gives the custom 404 page correct navigation under the project URL.

The repository is public with the owner’s approval, and Pages is enabled using **GitHub Actions** with HTTPS enforced. Preview URL: https://j4hr3n.github.io/trecalici-no/. Push to `main` to deploy; use the workflow’s manual run or rerun option to retry a failed deployment. See the [GitHub custom workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Keep preview labels and indexing restrictions until the final launch. Never put private source ZIPs or the manually emailed wine list in `site/`. The repository is public: everything committed (including docs and draft) is visible as source, even though only `site/` is deployed.
