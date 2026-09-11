from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "social"
W, H = 1600, 900
REG = Path("C:/Windows/Fonts/arial.ttf")
BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
MONO = Path("C:/Windows/Fonts/consola.ttf")
GREEN = (108, 239, 169, 255)
CYAN = (80, 200, 228, 255)
INK = (244, 249, 247, 255)
SOFT = (164, 199, 195, 255)
DIM = (143, 184, 180, 255)

CARDS = [
    {
        "file": "echo-mini-drop-2026-07-21-hub.png",
        "tag": "UTILITY HUB",
        "title": "4 live paths. One place.",
        "detail": "Product quotes · contract proof · wallet actions",
        "proof": "BUILTBYECHO.XYZ/ECHO",
        "accent": GREEN,
    },
    {
        "file": "echo-mini-drop-2026-07-21-quotes.png",
        "tag": "PRODUCT PAYMENTS",
        "title": "2 tools. Live ECHO quotes.",
        "detail": "Gauntlet · Public API Finder · Base",
        "proof": "BUILTBYECHO.XYZ/ECHO#USE-ECHO",
        "accent": CYAN,
    },
    {
        "file": "echo-mini-drop-2026-07-21-json.png",
        "tag": "AGENT-READABLE",
        "title": "Utility, as public JSON.",
        "detail": "Contract · chain ID · status · proof URLs",
        "proof": "BUILTBYECHO.XYZ/DATA/ECHO-UTILITY.JSON",
        "accent": GREEN,
    },
]


def font(path: Path, size: int):
    return ImageFont.truetype(str(path), size)


def fit_font(draw, text, max_width, path, max_size, min_size=28):
    for size in range(max_size, min_size - 1, -2):
        face = font(path, size)
        if draw.textbbox((0, 0), text, font=face)[2] <= max_width:
            return face
    return font(path, min_size)


def render(card):
    accent = card["accent"]
    base = Image.new("RGBA", (W, H), (6, 17, 23, 255))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-260, -320, 720, 660), fill=(*accent[:3], 105))
    gd.ellipse((1120, 500, 1860, 1200), fill=(60, 167, 208, 70))
    base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(155)))
    draw = ImageDraw.Draw(base)

    for x in range(0, W, 80):
        draw.line((x, 0, x, H), fill=(73, 126, 135, 27), width=1)
    for y in range(0, H, 80):
        draw.line((0, y, W, y), fill=(73, 126, 135, 27), width=1)

    draw.rounded_rectangle((72, 64, 1528, 836), radius=48, fill=(7, 19, 26, 226), outline=(*accent[:3], 78), width=2)
    draw.rounded_rectangle((72, 64, 88, 836), radius=8, fill=accent)

    logo = Image.open(ROOT / "assets" / "brand" / "builtbyecho-logo.png").convert("RGBA")
    logo.thumbnail((92, 92), Image.Resampling.LANCZOS)
    base.alpha_composite(logo, (126, 112))

    draw.text((236, 125), "BUILT BY ECHO", font=font(BOLD, 28), fill=INK)
    draw.text((236, 166), "ECHO MINI-DROP / JULY 21, 2026", font=font(MONO, 18), fill=DIM)

    tag_face = fit_font(draw, card["tag"], 330, MONO, 20, 16)
    tag_box = draw.textbbox((0, 0), card["tag"], font=tag_face)
    tag_width = tag_box[2] - tag_box[0]
    left = 1438 - tag_width - 48
    draw.rounded_rectangle((left, 118, 1438, 176), radius=29, fill=accent, outline=accent, width=2)
    draw.text((left + 24, 134), card["tag"], font=tag_face, fill=(6, 17, 23, 255))

    title_face = fit_font(draw, card["title"], 1280, BOLD, 90, 58)
    draw.text((126, 318), card["title"], font=title_face, fill=INK)
    draw.text((130, 472), card["detail"], font=fit_font(draw, card["detail"], 1210, REG, 37, 28), fill=SOFT)

    draw.rounded_rectangle((126, 590, 520, 655), radius=32, fill=accent, outline=accent, width=2)
    draw.text((160, 608), "CURRENT UTILITY / BASE", font=font(MONO, 18), fill=(6, 17, 23, 255))

    draw.line((126, 735, 1438, 735), fill=(111, 181, 164, 70), width=2)
    proof_face = fit_font(draw, f"PROOF > {card['proof']}", 1110, MONO, 20, 15)
    draw.text((126, 770), f"PROOF > {card['proof']}", font=proof_face, fill=DIM)
    draw.text((1360, 770), "21.07.26", font=font(MONO, 20), fill=DIM)

    out = OUT_DIR / card["file"]
    base.convert("RGB").save(out, "PNG", optimize=True)
    print(f"{out}\t{out.stat().st_size}")


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for item in CARDS:
        render(item)
