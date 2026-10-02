#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["resvg-py==0.5.0", "pillow==12.3.0", "fonttools==4.66.1", "brotli==1.2.0"]
# ///
"""Rebuild Orbit's icon pack from the two vector masters. Run after npm ci."""

from io import BytesIO
from pathlib import Path
import json
import shutil
import xml.etree.ElementTree as ET
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image
from resvg_py import svg_to_bytes

ROOT = Path(__file__).resolve().parents[1]
DESIGN = ROOT / "design/brand"
PUBLIC = ROOT / "public"
ASSETS = PUBLIC / "brand"
COLORS = {"orange": "#FF7543", "charcoal": "#191B17", "white": "#FFFFFF", "black": "#000000"}
IVORY = "#F8F7F2"


def master_path(name):
    return ET.parse(DESIGN / name).find("{http://www.w3.org/2000/svg}path").attrib["d"]


def svg(body, width=256, height=256, title="Orbit"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}"><title>{title}</title>{body}</svg>\n'


def mark(path, color):
    return f'<path fill="{color}" d="{path}"/>'


def write_svg(name, content):
    (ASSETS / name).write_text(content)
    return content


def png(content, width, height=None):
    return svg_to_bytes(svg_string=content, width=width, height=height or width)


def tile(path, color, background, rounded=True):
    # The complete mark lies inside the central 80% safe circle for maskable icons.
    radius = 56 if rounded else 0
    return svg(f'<rect width="256" height="256" rx="{radius}" fill="{background}"/>'
               f'<g transform="translate(33.28 33.28) scale(.74)">{mark(path, color)}</g>')


def outlined_wordmark():
    font_path = ROOT / "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"
    if not font_path.exists():
        raise SystemExit("Run npm ci first: the licensed Geist source font is required.")
    font = instantiateVariableFont(TTFont(font_path), {"wght": 700})
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = 180 / font["head"].unitsPerEm
    x, outlines = 0.0, []
    for char in "orbit":
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs, ntos=lambda value: f"{value:.2f}".rstrip("0").rstrip("."))
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 180)))
        outlines.append(pen.getCommands())
        x += (glyphs[name].width - 14) * scale
    return " ".join(outlines), round(x + 4, 2)


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    path, small = master_path("orbit-mark.svg"), master_path("orbit-mark-small.svg")
    word, word_width = outlined_wordmark()
    for name, color in COLORS.items():
        symbol = write_svg(f"orbit-symbol-{name}.svg", svg(mark(path, color)))
        for size in (32, 64, 128, 256, 512, 1024):
            raster_symbol = svg(mark(small, color)) if size <= 32 else symbol
            (ASSETS / f"orbit-symbol-{name}-{size}.png").write_bytes(png(raster_symbol, size))
        write_svg(f"orbit-wordmark-{name}.svg", svg(mark(word, color), word_width, 208))
    write_svg("orbit-symbol-small.svg", svg(mark(small, COLORS["orange"])))
    for name, symbol_color, text_color in (
        ("color", COLORS["orange"], COLORS["charcoal"]),
        ("charcoal", COLORS["charcoal"], COLORS["charcoal"]),
        ("white", COLORS["white"], COLORS["white"]),
    ):
        horizontal = svg(mark(path, symbol_color) +
                         f'<g transform="translate(280 24)">{mark(word, text_color)}</g>',
                         280 + word_width, 256)
        write_svg(f"orbit-logo-horizontal-{name}.svg", horizontal)
        (ASSETS / f"orbit-logo-horizontal-{name}.png").write_bytes(
            png(horizontal, 1400, round(1400 * 256 / (280 + word_width))))
        width = max(320, word_width)
        stacked = svg(f'<g transform="translate({(width - 256) / 2} 0)">{mark(path, symbol_color)}</g>'
                      f'<g transform="translate({(width - word_width) / 2} 260)">{mark(word, text_color)}</g>',
                      width, 468)
        write_svg(f"orbit-logo-stacked-{name}.svg", stacked)
    for name, color, background in (("light", COLORS["orange"], IVORY), ("dark", "#FFFFFF", COLORS["charcoal"])):
        icon = write_svg(f"orbit-icon-{name}.svg", tile(path, color, background))
        for size in (64, 128, 256, 512, 1024):
            (ASSETS / f"orbit-icon-{name}-{size}.png").write_bytes(png(icon, size))
    install_icon = tile(path, COLORS["orange"], IVORY, rounded=False)
    for size in (192, 512):
        (ASSETS / f"icon-{size}.png").write_bytes(png(install_icon, size))
    (ASSETS / "icon-maskable-512.png").write_bytes(png(install_icon, 512))
    (PUBLIC / "apple-touch-icon.png").write_bytes(png(install_icon, 180))
    favicon = tile(small, COLORS["orange"], IVORY)
    (PUBLIC / "orbit.svg").write_text(favicon)
    for size in (16, 32, 48):
        (PUBLIC / f"favicon-{size}x{size}.png").write_bytes(png(favicon, size))
    Image.open(BytesIO(png(favicon, 256))).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    manifest = {
        "id": "./", "name": "Orbit · Dashboard Studio", "short_name": "Orbit",
        "description": "An expressive dashboard studio for operational signals.",
        "start_url": "./", "scope": "./", "display": "standalone",
        "background_color": IVORY, "theme_color": IVORY,
        "icons": [
            {"src": f"brand/icon-{s}.png", "sizes": f"{s}x{s}", "type": "image/png", "purpose": "any"}
            for s in (192, 512)
        ] + [{"src": "brand/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
    }
    (PUBLIC / "site.webmanifest").write_text(json.dumps(manifest, indent=2) + "\n")
    shutil.copyfile(ROOT / "node_modules/@fontsource-variable/geist/LICENSE", DESIGN / "Geist-OFL.txt")
    # Presentation only: labels use live text; production logos above are outlined.
    preview = f'<rect width="1200" height="800" fill="{IVORY}"/>'
    preview += '<text x="60" y="65" font-family="sans-serif" font-size="28" fill="#191B17">Orbit / approved icon pack</text>'
    preview += f'<g transform="translate(70 100) scale(1.55)">{mark(path, COLORS["charcoal"])}</g>'
    for left, color, background in ((670, COLORS["orange"], IVORY), (900, "#FFFFFF", COLORS["charcoal"])):
        preview += f'<g transform="translate({left} 125) scale(.703125)"><rect width="256" height="256" rx="56" fill="{background}"/>'
        preview += f'<g transform="translate(33.28 33.28) scale(.74)">{mark(path, color)}</g></g>'
    preview += f'<g transform="translate(675 360) scale(.72)">{mark(word, COLORS["charcoal"])}</g>'
    preview += '<text x="60" y="575" font-family="sans-serif" font-size="22" fill="#62655D">Small-size cut / browser and app icons</text>'
    x = 65
    for size in (16, 24, 32, 48, 64, 128):
        preview += f'<svg x="{x}" y="620" width="{size}" height="{size}" viewBox="0 0 256 256">{mark(small if size <= 32 else path, COLORS["orange"])}</svg>'
        preview += f'<text x="{x}" y="780" font-family="sans-serif" font-size="16" fill="#62655D">{size}px</text>'
        x += size + 65
    (DESIGN / "icon-pack-preview.png").write_bytes(png(svg(preview, 1200, 800), 1200, 800))
    files = [DESIGN / name for name in ("orbit-mark.svg", "orbit-mark-small.svg", "README.md", "Geist-OFL.txt", "icon-pack-preview.png")]
    files += sorted(ASSETS.glob("*"))
    files += [ROOT / "scripts/generate-brand-assets.py"]
    files += [PUBLIC / name for name in ("orbit.svg", "favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "favicon-48x48.png", "apple-touch-icon.png", "site.webmanifest")]
    with ZipFile(DESIGN / "orbit-icon-pack.zip", "w", ZIP_DEFLATED) as bundle:
        for file in files:
            info = ZipInfo(str(file.relative_to(ROOT)))
            info.compress_type = ZIP_DEFLATED
            bundle.writestr(info, file.read_bytes())
    print(f"Generated {len(files)} pack files and orbit-icon-pack.zip")


if __name__ == "__main__":
    main()
