from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "social"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1600, 900

FONT_REG = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
FONT_MONO = Path("C:/Windows/Fonts/consola.ttf")


def font(path: Path, size: int):
    return ImageFont.truetype(str(path), size)


def linear_gradient(top, bottom):
    image = Image.new("RGB", (W, H), top)
    px = image.load()
    for y in range(H):
        t = y / (H - 1)
        color = tuple(round(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        for x in range(W):
            px[x, y] = color
    return image


def add_glow(image, xy, radius, color, opacity=90):
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    x, y = xy
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*color, opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(radius // 2))
    image.alpha_composite(layer)


def draw_wrapped(draw, text, xy, max_width, text_font, fill, spacing=10):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=text_font)[2] <= max_width:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    x, y = xy
    for item in lines:
        draw.text((x, y), item, font=text_font, fill=fill)
        y += text_font.size + spacing
    return y


def render(slug, eyebrow, metric, headline, detail, accent):
    base = linear_gradient((12, 28, 33), (5, 13, 20)).convert("RGBA")
    add_glow(base, (180, 90), 430, accent, 95)
    add_glow(base, (1460, 760), 370, (30, 144, 170), 60)
    draw = ImageDraw.Draw(base)

    # Technical grid.
    grid = (73, 126, 135, 30)
    for x in range(0, W, 80):
        draw.line((x, 0, x, H), fill=grid, width=1)
    for y in range(0, H, 80):
        draw.line((0, y, W, y), fill=grid, width=1)

    # Main panel and accent rail.
    draw.rounded_rectangle((72, 64, 1528, 836), radius=48, fill=(7, 19, 26, 218), outline=(115, 211, 177, 70), width=2)
    draw.rounded_rectangle((72, 64, 88, 836), radius=8, fill=(*accent, 255))

    # Logo mark.
    logo_path = ROOT / "assets" / "brand" / "builtbyecho-logo.png"
    if logo_path.exists():
        logo = Image.open(logo_path).convert("RGBA")
        logo.thumbnail((92, 92), Image.Resampling.LANCZOS)
        base.alpha_composite(logo, (126, 112))
    draw.text((236, 125), "BUILT BY ECHO", font=font(FONT_BOLD, 28), fill=(237, 249, 242, 255))
    draw.text((236, 166), "ECHO PULSE / JULY 10, 2026", font=font(FONT_MONO, 18), fill=(145, 184, 181, 255))

    draw.rounded_rectangle((1110, 118, 1437, 176), radius=29, fill=(*accent, 35), outline=(*accent, 150), width=2)
    draw.text((1146, 136), eyebrow.upper(), font=font(FONT_MONO, 18), fill=(7, 19, 26, 255))

    draw.text((126, 292), metric, font=font(FONT_BOLD, 112), fill=(*accent, 255), stroke_width=1, stroke_fill=(225, 255, 245, 120))
    y = draw_wrapped(draw, headline, (126, 430), 1240, font(FONT_BOLD, 64), (244, 249, 247, 255), 5)
    draw_wrapped(draw, detail, (130, y + 30), 1180, font(FONT_REG, 30), (164, 199, 195, 255), 8)

    draw.line((126, 735, 1438, 735), fill=(111, 181, 164, 70), width=2)
    draw.text((126, 770), "PROOF > BUILTBYECHO.XYZ/UPDATES.HTML#JULY-10", font=font(FONT_MONO, 20), fill=(143, 184, 180, 255))
    draw.text((1350, 770), "10.07.26", font=font(FONT_MONO, 20), fill=(143, 184, 180, 255))

    path = OUT / f"echo-pulse-2026-07-10-{slug}.png"
    base.convert("RGB").save(path, "PNG", optimize=True)
    print(f"{path.name}\t{path.stat().st_size}")


cards = [
    ("b20", "Echo Shield", "7,800+", "Native B20 launches indexed", "Canonical factory events · durable cursor · configuration risk", (108, 239, 169)),
    ("reverbin", "Reverbin", "agent@reverbin.com", "Real inboxes for AI agents", "2 free mailboxes · signed webhooks · dashboard access", (171, 238, 116)),
    ("infer", "Echo Infer", "echo-private", "Private AI in a desktop app", "OpenAI-compatible · Windows beta · checksum verified", (94, 218, 224)),
    ("pulse", "Shipping loop", "4 SHIPPED", "This morning's Echo Pulse", "Proof links · copy-ready posts · downloadable share cards", (109, 237, 169)),
]

for args in cards:
    render(*args)
