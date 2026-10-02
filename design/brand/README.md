# Orbit identity assets

The approved Orbital O has a curved opening and a slightly inward upper terminal.
The two SVG masters are editable filled paths, reconstructed from the approved concept.

## Files

- `orbit-mark.svg`: full-size master, viewBox 256 × 256.
- `orbit-mark-small.svg`: optical cut with a wider opening for 16–32px rendering.
- `../../public/brand/`: orange, charcoal, black and white symbols; outlined wordmarks;
  horizontal and stacked lockups; light and dark app tiles; transparent PNG exports.
- `../../public/orbit.svg` and `favicon.ico`: browser icons using the small-size cut.
- `../../public/apple-touch-icon.png`: opaque 180px Apple touch icon, without baked-in rounded corners.
- `../../public/site.webmanifest`: 192px and 512px web-app icons and a maskable 512px icon.
- `icon-pack-preview.png`: presentation and real-size rendering ladder.
- `orbit-icon-pack.zip`: downloadable pack of the masters and generated assets.

## Use

Use orange `#FF7543` on warm ivory `#F8F7F2`, charcoal `#191B17` on light backgrounds,
and the white version on dark backgrounds. Keep at least one ring-stroke width of
clear space around the symbol. Use the small cut below 32px; do not close the orbital
gap, add strokes, distort the proportions, or put gradients inside the mark.
The install icons use opaque, full-bleed backgrounds and keep the mark inside the
central 80% safe circle so platform masks do not crop it. Rounded tiles are for
web presentation; the Apple and maskable exports let the platform supply the mask.

The wordmark uses Geist at weight 700, converted to paths so installed fonts are
not required. The source font is distributed under the SIL Open Font License;
its license is included as `Geist-OFL.txt`. This does not change the app's license.

## Rebuild

```sh
npm ci
uv run scripts/generate-brand-assets.py
```

The script uses isolated Python tooling and the existing Geist dependency. Edit
the masters, regenerate the pack, and review the size ladder before committing.
The web manifest supplies identity metadata; it does not add offline support.
