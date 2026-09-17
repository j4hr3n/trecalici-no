# Trecalici Norge

Six-page static website skeleton, preserving the accepted design draft. Norwegian Bokmål, plain HTML, one shared CSS file, and one small progressive-enhancement navigation script (assets/nav.js). No packages or build step.

**Status:** review skeleton. The owner confirmed no content pack is available yet and requested a GitHub Pages preview. Final content and production launch are still pending.

## Preview

From this directory:

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory site
```

Open [the local preview](http://127.0.0.1:4174/). Serve `site/` as the web root: root-relative links and directory URLs require HTTP rather than opening the HTML file directly.

| Page | Source |
| --- | --- |
| Homepage | [site/index.html](site/index.html) |
| Sjelden vin | [site/sjelden-vin/index.html](site/sjelden-vin/index.html) |
| Produsentene våre | [site/produsenter/index.html](site/produsenter/index.html) |
| Vinglass | [site/vinglass/index.html](site/vinglass/index.html) |
| Kaviar | [site/kaviar/index.html](site/kaviar/index.html) |
| Om oss | [site/om-oss/index.html](site/om-oss/index.html) |
| Takk (form confirmation) | [site/takk/index.html](site/takk/index.html) |

- [Maintenance and content guide](docs/maintenance.md)
- [Verification results](docs/verification.md)
- [Current screenshots](docs/site-previews/)
- [Original implementation plan](docs/implementation-plan.md)
- [Original draft](draft/index.html) (preserved unchanged)

## Pending content

Final logo, slogan, real email, approved copy and photos, producers and their PDFs, actual products/specifications/prices, team story and photos, domain and hosting. Registered company details (Trecalici AS, org.nr 937 578 245) are already in place from Enhetsregisteret. Content edits are developer-managed for now; long-term ownership remains undecided.

The three product forms and general contact form use a Resend-backed Cloudflare Worker with Turnstile and on-page confirmation. The Worker is deployed separately from the static site; deploy backend changes before publishing dependent site changes. Follow [Resend setup](docs/resend-setup.md). The temporary receiving mailbox is configured in Cloudflare and used in public fallback links. No credentials belong in this repository. No PDF links are active until actual catalogues arrive. The public Trecalici logo remains provisionally cropped with CSS; replace it with approved artwork.

Pages are indexable: `robots.txt` allows crawling and the `noindex` preview restriction has been removed. Placeholder boxes, preview notes and the preview footer are gone from the pages. Canonicals, sitemap and social image await the approved domain and branding. A provisional favicon generated from the public circular Trecalici mark is in place.

The self-hosted heading font includes Norwegian characters and its [SIL Open Font License](site/assets/fonts/OFL.txt). Only `site/` is intended for eventual hosting; source ZIPs, draft files and review screenshots must stay outside it.

## GitHub Pages preview

[Deployment workflow](.github/workflows/pages.yml) runs on every push to `main`, or manually from Actions. It uploads only `site/`; draft files, docs and screenshots stay out of the deployed site. A small Python step prefixes root-relative HTML links with the Pages base path in a temporary upload copy, so `/trecalici-no/` works without changing local URLs. No site runtime or package dependencies are added.

Preview URL: https://j4hr3n.github.io/trecalici-no/

The owner approved making the repository public. GitHub Pages is enabled with **GitHub Actions** as its source and HTTPS enforced. Both the preview and committed source (including draft and documentation) are public.

The temporary testing email and the provisional logo remain in place; see the pending-content list above. Every push to `main` publishes the current site; use a separate branch for edits that should not be published yet.
