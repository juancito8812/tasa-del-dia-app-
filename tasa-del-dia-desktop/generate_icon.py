#!/usr/bin/env python3
"""
Genera un icono moderno .ico para TasaDelDia.exe usando formas
geométricas simples. No requiere Pillow ni librerías externas.
"""

import struct
import zlib
import io
import math

def create_png(size):
    """Create a PNG with a modern exchange-rate icon at the given size."""

    half_w = size / 2
    half_h = size / 2
    corner_r = size * 0.22

    # Colors
    bg_r, bg_g, bg_b = 10, 10, 20       # dark bg
    ac_r, ac_g, ac_b = 0, 184, 148       # green accent
    hl_r, hl_g, hl_b = 233, 69, 96       # red accent (for secondary arrow)

    pixels = []
    for y in range(size):
        row = [0]  # PNG filter byte (None)
        for x in range(size):
            # --- Rounded rect background ---
            dx = abs(x - half_w)
            dy = abs(y - half_h)
            inner_w = half_w - corner_r
            inner_h = half_h - corner_r
            in_rect = False
            alpha = 0

            if dx <= inner_w and dy <= inner_h:
                in_rect = True
                alpha = 255
            elif dx > inner_w and dy > inner_h:
                # Corner circle
                dist = math.sqrt((dx - inner_w) ** 2 + (dy - inner_h) ** 2)
                if dist <= corner_r:
                    if dist >= corner_r - 1.5:
                        # Anti-alias edge
                        alpha = max(0, int(255 * (corner_r - dist) / 1.5))
                    else:
                        alpha = 255
                    in_rect = alpha > 0
                else:
                    alpha = 0

            if alpha == 0:
                row.extend([0, 0, 0, 0])
                continue

            # Determine pixel color based on shape
            # Normalized coords (0..1)
            nx, ny = x / size, y / size

            # --- Bold upward trend arrow ---
            line_y = -0.55 * nx + 0.8
            line_width = 0.12  # bold enough to be visible even at 16x16

            # Arrowhead: solid triangle at the top-right
            arrow_tip_x, arrow_tip_y = 0.75, 0.25
            arrow_base = 0.15
            arrow_half = 0.10

            in_arrow = False

            # Main diagonal line
            if abs(ny - line_y) < line_width and nx > 0.18 and nx < arrow_tip_x:
                in_arrow = True

            # Arrowhead: filled triangle pointing up-right
            # Triangle vertices: tip (0.75,0.25), base-left (0.60,0.35), base-right (0.60,0.15)
            rel_x = (nx - (arrow_tip_x - arrow_base)) / arrow_base
            rel_y = abs(ny - arrow_tip_y) / arrow_half
            if 0 <= rel_x <= 1 and rel_y <= 1 - rel_x:
                in_arrow = True

            # --- Second accent line (red, parallel) for modern look ---
            line2_y = -0.45 * nx + 0.65
            in_line2 = abs(ny - line2_y) < line_width * 0.6 and nx > 0.28 and nx < 0.62

            if in_arrow:
                r, g, b = ac_r, ac_g, ac_b
                # Gradient/brightness variation for depth
                bright = 1.0 - (abs(nx - 0.5) + abs(ny - 0.5)) * 0.2
                r = min(255, int(r * bright))
                g = min(255, int(g * bright))
                b = min(255, int(b * bright))
            elif in_line2:
                r, g, b = hl_r, hl_g, hl_b
                bright = 0.85
                r = min(255, int(r * bright))
                g = min(255, int(g * bright))
                b = min(255, int(b * bright))
            else:
                r, g, b = bg_r, bg_g, bg_b

            row.extend([r, g, b, alpha])

        pixels.append(bytes(row))

    raw = b''.join(pixels)

    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    compressed = zlib.compress(raw)

    out = io.BytesIO()
    out.write(sig)
    out.write(chunk(b'IHDR', ihdr))
    out.write(chunk(b'IDAT', compressed))
    out.write(chunk(b'IEND', b''))
    return out.getvalue()


def create_ico(sizes=(16, 32, 48, 64, 128, 256)):
    """Create a multi-resolution .ico file."""
    pngs = {}
    for s in sizes:
        pngs[s] = create_png(s)

    num_images = len(sizes)
    header = struct.pack('<HHH', 0, 1, num_images)

    entries = []
    data_offset = 6 + 16 * num_images
    all_data = b''

    for s in sizes:
        png_data = pngs[s]
        w = s if s < 256 else 0
        h = s if s < 256 else 0
        entry = struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(png_data), data_offset)
        entries.append(entry)
        all_data += png_data
        data_offset += len(png_data)

    return header + b''.join(entries) + all_data


def main():
    print("Generando icono moderno para TasaDelDia...")

    ico_data = create_ico()

    with open("app_icon.ico", "wb") as f:
        f.write(ico_data)

    print(f"Icono creado: app_icon.ico ({len(ico_data):,} bytes)")
    print("   Incluye tamanos: 16, 32, 48, 64, 128, 256 pixeles")


if __name__ == "__main__":
    main()
