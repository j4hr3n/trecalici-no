# Trecalici Norge

Six-page static website skeleton, preserving the accepted design draft. Norwegian Bokmål, plain HTML and one shared CSS file. No JavaScript, packages or build step.

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

- [Maintenance and content guide](docs/maintenance.md)
- [Verification results](docs/verification.md)
- [Current screenshots](docs/site-previews/)
- [Original implementation plan](docs/implementation-plan.md)
- [Original draft](draft/index.html) (preserved unchanged)

## Pending content

Final logo, slogan, real email, approved copy and photos, producers and their PDFs, actual products/specifications/prices, team and company details, domain and hosting. Content edits are developer-managed for now; long-term ownership remains undecided.

`katalog@example.invalid` cannot receive email. Preview email links demonstrate the prefilled message only. No PDF links are active until actual catalogues arrive. The public Trecalici logo remains provisionally cropped with CSS; replace it with approved artwork.

All pages retain `noindex,nofollow`, a visible preview footer and explicit missing-content labels. `robots.txt` disallows crawling. These are indexing hints, not access control; the preview contains only the intentionally public skeleton, not confidential material. Canonicals, sitemap, favicon and social image await the approved domain and branding.

The self-hosted heading font includes Norwegian characters and its [SIL Open Font License](site/assets/fonts/OFL.txt). Only `site/` is intended for eventual hosting; source ZIPs, draft files and review screenshots must stay outside it.

## GitHub Pages preview

[Deployment workflow](.github/workflows/pages.yml) runs on every push to `main`, or manually from Actions. It uploads only `site/`; draft files, docs and screenshots stay out of the deployed site. A small Python step prefixes root-relative HTML links with the Pages base path in a temporary upload copy, so `/trecalici-no/` works without changing local URLs. No site runtime or package dependencies are added.

Expected URL once enabled: https://j4hr3n.github.io/trecalici-no/

**Setup blocker:** GitHub currently rejects Pages enablement because the private repository's plan does not support it. The repository must become public, or its account must have a plan supporting Pages for private repositories. Then set Settings → Pages → Source to **GitHub Actions** and rerun the workflow. A private repository does not by itself make its Pages website private.

Preview annotations, `noindex` and the non-deliverable email remain in place. This preview is not the final company launch. Every push to `main` publishes the current skeleton once Pages is enabled; use a separate branch for edits that should not be published yet.
