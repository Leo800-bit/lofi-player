from __future__ import annotations

import os

from PIL import Image, ImageDraw


def make_icon(size: int, out_path: str) -> None:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Radial-like gradient background (water-blue -> deep blue -> near-black)
    cx, cy = size / 2, size / 2
    max_r = int(size * 0.72)
    c1 = (79, 195, 247)  # water blue
    c2 = (2, 136, 209)  # deep blue
    c3 = (2, 6, 23)  # near-black slate

    for r in range(max_r, 0, -1):
        t = r / max_r
        if t > 0.45:
            u = (t - 0.45) / 0.55
            col = tuple(int(c1[i] * (1 - u) + c2[i] * u) for i in range(3))
        else:
            u = t / 0.45
            col = tuple(int(c2[i] * (1 - u) + c3[i] * u) for i in range(3))
        alpha = int(255 * (1 - (1 - t) ** 2))
        bbox = (cx - r, cy - r, cx + r, cy + r)
        draw.ellipse(bbox, fill=col + (alpha,))

    # Glass ring
    ring_w = max(6, size // 18)
    draw.ellipse(
        (ring_w, ring_w, size - ring_w, size - ring_w),
        outline=(255, 255, 255, 120),
        width=ring_w,
    )

    # Play glyph
    tri = (
        (size * 0.42, size * 0.34),
        (size * 0.42, size * 0.66),
        (size * 0.68, size * 0.50),
    )
    draw.polygon(tri, fill=(255, 255, 255, 210))

    # Rounded mask (iOS-style)
    mask = Image.new("L", (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    radius = int(size * 0.22)
    mdraw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    img.putalpha(mask)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    img.save(out_path, "PNG")


def main() -> None:
    make_icon(192, r"public/icons/icon-192.png")
    make_icon(512, r"public/icons/icon-512.png")
    print("icons generated")


if __name__ == "__main__":
    main()

