from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "social" / "echo-pulse-2026-07-16-utility.png"
W, H = 1600, 900
REG = Path("C:/Windows/Fonts/arial.ttf")
BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
MONO = Path("C:/Windows/Fonts/consola.ttf")


def font(path: Path, size: int):
    return ImageFont.truetype(str(path), size)


def wrapped(draw, text, xy, max_width, face, fill, spacing=8):
    lines, line = [], ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=face)[2] <= max_width:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    x, y = xy
    for item in lines:
        draw.text((x, y), item, font=face, fill=fill)
        y += face.size + spacing
    return y


base = Image.new("RGBA", (W, H), (6, 17, 23, 255))
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
g = ImageDraw.Draw(glow)
g.ellipse((-250, -320, 700, 630), fill=(93, 239, 168, 105))
g.ellipse((1120, 520, 1830, 1190), fill=(63, 184, 217, 70))
base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(150)))
draw = ImageDraw.Draw(base)

for x in range(0, W, 80):
    draw.line((x, 0, x, H), fill=(73, 126, 135, 28), width=1)
for y in range(0, H, 80):
    draw.line((0, y, W, y), fill=(73, 126, 135, 28), width=1)

draw.rounded_rectangle((72, 64, 1528, 836), radius=48, fill=(7, 19, 26, 225), outline=(115, 211, 177, 74), width=2)
draw.rounded_rectangle((72, 64, 88, 836), radius=8, fill=(108, 239, 169, 255))

logo_path = ROOT / "assets" / "brand" / "builtbyecho-logo.png"
logo = Image.open(logo_path).convert("RGBA")
logo.thumbnail((92, 92), Image.Resampling.LANCZOS)
base.alpha_composite(logo, (126, 112))

draw.text((236, 125), "BUILT BY ECHO", font=font(BOLD, 28), fill=(237, 249, 242, 255))
draw.text((236, 166), "ECHO PULSE / JULY 16, 2026", font=font(MONO, 18), fill=(145, 184, 181, 255))

draw.rounded_rectangle((1154, 118, 1438, 176), radius=29, fill=(108, 239, 169, 42), outline=(108, 239, 169, 150), width=2)
draw.text((1200, 136), "UTILITY PASS", font=font(MONO, 18), fill=(181, 255, 218, 255))

draw.text((126, 292), "5 UPDATES", font=font(BOLD, 112), fill=(108, 239, 169, 255))
y = wrapped(draw, "ECHO utility, easier to verify", (126, 430), 1250, font(BOLD, 64), (244, 249, 247, 255), 5)
wrapped(draw, "Holder claims · Gauntlet quotes · contract proof · utility JSON", (130, y + 30), 1220, font(REG, 31), (164, 199, 195, 255), 8)

draw.line((126, 735, 1438, 735), fill=(111, 181, 164, 70), width=2)
draw.text((126, 770), "PROOF > BUILTBYECHO.XYZ/UPDATES", font=font(MONO, 20), fill=(143, 184, 180, 255))
draw.text((1360, 770), "16.07.26", font=font(MONO, 20), fill=(143, 184, 180, 255))

base.convert("RGB").save(OUT, "PNG", optimize=True)
print(f"{OUT}\t{OUT.stat().st_size}")
