# Giaveri caviar gallery images

Retrieved on 21 October 2026 from [Caviar Giaveri's official product collection](https://www.caviargiaveri.com/en/caviar/). The four closed-tin packshots replace the farm photograph at the top of `/kaviar/`.

| Local image stem | Product page | Original image |
| --- | --- | --- |
| `giaveri-beluga-siberian-cutout` | [Beluga Siberian](https://www.caviargiaveri.com/en/beluga-siberian-caviar/) | [JPEG](https://www.caviargiaveri.com/app/uploads/2023/09/caviale-beluga-siberian-caviar-giaveri-1.jpg) |
| `giaveri-siberian-classic-cutout` | [Siberian Classic](https://www.caviargiaveri.com/en/siberian-classic-caviar/) | [JPEG](https://www.caviargiaveri.com/app/uploads/2023/09/caviale-siberian-classic-caviar-giaveri-1.jpg) |
| `giaveri-oscietra-classic-cutout` | [Oscietra Classic](https://www.caviargiaveri.com/en/oscietra-classic-caviar/) | [JPEG](https://www.caviargiaveri.com/app/uploads/2023/09/caviale-osietra-classic-caviar-giaveri-1.jpg) |
| `giaveri-sevruga-imperial-cutout` | [Sevruga Imperial](https://www.caviargiaveri.com/en/sevruga-imperial-caviar/) | [JPEG](https://www.caviargiaveri.com/app/uploads/2023/09/caviale-sevruga-imperial-caviar-giaveri.jpg) |

The built-in image generation tool removed the white backgrounds, using one edit per original photograph with `transparent_background: true`. The resulting PNG cutouts were inspected, then resized and encoded as WebP at quality 85 with alpha quality 100. The corners of every exported image were verified fully transparent, with the product opaque at its center. Captions are omitted; alt text identifies the tins. The gallery has four columns on desktop and two on tablets and phones.

Final assets live under `site/assets/images/`. Each stem in the table has a 600 × 600 `.webp` file and a 320 × 320 `-320.webp` file. The HTML supplies `srcset` and `sizes` directly. The Osietra spelling in the alt text follows the photographed tin; Giaveri's English product page uses Oscietra.

## Edit prompt set

The following prompt was used separately for `beluga-siberian`, `siberian-classic`, `oscietra-classic`, and `sevruga-imperial`, replacing `{name}` with the corresponding name and attaching that product's source JPEG as the edit target:

> Use case: background-extraction. Edit target: the single supplied original Caviar Giaveri {name} product photograph. Primary request: remove only the white photographic background and its cast shadow, producing the exact same closed round caviar tin on a genuinely transparent alpha background. Preserve the complete product exactly: all logo and label printing, every letter, original gold rim, color, proportions, front-facing top-down angle, sealing band and band ends. Do not redraw, reinterpret, enhance, regenerate or change the tin or text. Keep the original centered framing with generous transparent padding on a square canvas. Remove all surrounding white including corners; retain the white design printed ON the Beluga Siberian tin if present, as it is part of the product. No captions, no new shadows, no backdrop, no checkerboard pixels. This is a faithful photo cutout for a dark website, not new product imagery.
