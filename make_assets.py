"""
Generate placeholder PNG assets for the desktop pet.
Each image is a simple colored transparent-background sprite so the app
can run immediately. Replace these files with real artwork at any time.
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys

ASSETS = os.path.join(os.path.dirname(__file__), "assets")
os.makedirs(ASSETS, exist_ok=True)

def rgba(r, g, b, a=255):
    return (r, g, b, a)

def make_img(size=(150, 150)):
    return Image.new("RGBA", size, (0, 0, 0, 0))

def circle(draw, cx, cy, r, fill):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)

def rect(draw, x, y, w, h, fill):
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=fill)

# ── Colour palette ────────────────────────────────────────────────────────
SKIN   = rgba(255, 220, 177)
HAIR   = rgba( 80,  50,  20)
EYE    = rgba( 30,  20,  10)
BLUSH  = rgba(255, 170, 150, 120)
BODY   = rgba(120, 160, 230)
SHOE   = rgba( 60,  40,  20)
CHEEK  = rgba(255, 200, 180)
WHITE  = rgba(255, 255, 255)
GRAY   = rgba(180, 180, 190)
DARK   = rgba( 50,  50,  60)
BUBBLE_BG = rgba(255, 255, 240)
BUBBLE_BD = rgba(120, 100,  80)
ZZZ_C  = rgba(180, 200, 255)

# ── Helper: draw a simple chibi cat-girl ─────────────────────────────────
def draw_cat_girl(img, body_color=BODY, eye_open=True, flipped=False, mouth_smile=True):
    d = ImageDraw.Draw(img)
    W, H = img.size

    # body
    rect(d, W//2-22, H//2+10, 44, 55, body_color)
    # legs
    rect(d, W//2-22, H//2+60, 18, 22, body_color)
    rect(d, W//2+4,  H//2+60, 18, 22, body_color)
    # shoes
    rect(d, W//2-24, H//2+79, 22, 10, SHOE)
    rect(d, W//2+2,  H//2+79, 22, 10, SHOE)

    # arms
    rect(d, W//2-34, H//2+12, 12, 30, body_color)
    rect(d, W//2+22, H//2+12, 12, 30, body_color)

    # head
    circle(d, W//2, H//2-14, 32, SKIN)

    # hair top
    circle(d, W//2, H//2-36, 20, HAIR)
    rect(d, W//2-20, H//2-50, 40, 22, HAIR)

    # cat ears
    _ear_tri(d, W//2-20, H//2-52, HAIR)
    _ear_tri_r(d, W//2+20, H//2-52, HAIR)
    # inner ear
    _ear_tri(d, W//2-18, H//2-50, SKIN, size=6)
    _ear_tri_r(d, W//2+18, H//2-50, SKIN, size=6)

    # eyes
    if eye_open:
        circle(d, W//2-11, H//2-14, 6, WHITE)
        circle(d, W//2+11, H//2-14, 6, WHITE)
        circle(d, W//2-11, H//2-14, 4, EYE)
        circle(d, W//2+11, H//2-14, 4, EYE)
        # shine
        circle(d, W//2-9, H//2-16, 2, WHITE)
        circle(d, W//2+13, H//2-16, 2, WHITE)
    else:
        # closed eyes (~ arcs)
        d.arc([W//2-17, H//2-18, W//2-5, H//2-10], 200, 340, fill=EYE, width=2)
        d.arc([W//2+5,  H//2-18, W//2+17, H//2-10], 200, 340, fill=EYE, width=2)

    # blush
    circle(d, W//2-17, H//2-8, 7, BLUSH)
    circle(d, W//2+17, H//2-8, 7, BLUSH)

    # mouth
    if mouth_smile:
        d.arc([W//2-8, H//2-4, W//2+8, H//2+6], 10, 170, fill=EYE, width=2)
    else:
        d.arc([W//2-8, H//2-4, W//2+8, H//2+6], 190, 350, fill=EYE, width=2)

    # tail
    _tail(d, W//2+22, H//2+50, HAIR)


def _ear_tri(draw, x, y, color, size=10):
    pts = [(x, y), (x - size, y - size*2), (x + size, y - size*2)]
    draw.polygon(pts, fill=color)

def _ear_tri_r(draw, x, y, color, size=10):
    pts = [(x, y), (x - size, y - size*2), (x + size, y - size*2)]
    draw.polygon(pts, fill=color)

def _tail(draw, x, y, color):
    # simple curved tail using a bezier-ish arc
    draw.arc([x, y-20, x+30, y+20], 220, 360, fill=color, width=4)
    draw.arc([x+14, y-10, x+40, y+14], 170, 310, fill=color, width=4)

# ── stand-still-1.png ─────────────────────────────────────────────────────
def make_stand1():
    img = make_img()
    draw_cat_girl(img, eye_open=True, mouth_smile=True)
    return img

# ── stand-still-2.png  (slight blink / shifted pose) ─────────────────────
def make_stand2():
    img = make_img()
    draw_cat_girl(img, eye_open=False, mouth_smile=True)
    return img

# ── look-up.png ───────────────────────────────────────────────────────────
def make_look_up():
    img = make_img()
    # Draw normally then add upward gaze sparkle
    draw_cat_girl(img, eye_open=True, mouth_smile=True)
    d = ImageDraw.Draw(img)
    W, H = img.size
    # Upward-looking twinkle
    _star(d, W//2, H//2-52, rgba(255, 220, 60))
    return img

def _star(draw, cx, cy, color, r=8):
    for angle_deg in range(0, 360, 45):
        import math
        a = math.radians(angle_deg)
        x1 = cx + r * math.cos(a)
        y1 = cy + r * math.sin(a)
        x2 = cx + (r//2) * math.cos(a + math.radians(22))
        y2 = cy + (r//2) * math.sin(a + math.radians(22))
        draw.line([(cx, cy), (x1, y1)], fill=color, width=2)

# ── sleep.png ─────────────────────────────────────────────────────────────
def make_sleep():
    img = make_img()
    d = ImageDraw.Draw(img)
    W, H = img.size
    # Lay down pose — rotated body suggestion
    # Body (horizontal)
    rect(d, W//2-50, H//2+20, 100, 36, BODY)
    # Head
    circle(d, W//2+28, H//2+18, 28, SKIN)
    # hair
    circle(d, W//2+30, H//2-6, 18, HAIR)
    rect(d, W//2+14, H//2-18, 34, 18, HAIR)
    # ears
    _ear_tri(d, W//2+18, H//2-14, HAIR, size=8)
    _ear_tri_r(d, W//2+40, H//2-14, HAIR, size=8)
    # closed eyes
    d.arc([W//2+16, H//2+12, W//2+26, H//2+20], 200, 340, fill=EYE, width=2)
    d.arc([W//2+28, H//2+12, W//2+38, H//2+20], 200, 340, fill=EYE, width=2)
    # blush
    circle(d, W//2+19, H//2+23, 6, BLUSH)
    circle(d, W//2+37, H//2+23, 6, BLUSH)
    # pillow
    rect(d, W//2-52, H//2+18, 30, 28, rgba(240, 210, 200))
    d.rounded_rectangle([W//2-52, H//2+18, W//2-24, H//2+45], radius=6,
                         outline=rgba(200, 170, 160), width=2)
    return img

# ── message.png  (speech bubble) ─────────────────────────────────────────
def make_message():
    W, H = 220, 130
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded rect body
    d.rounded_rectangle([2, 2, W-4, H-28], radius=18,
                         fill=rgba(255, 255, 245, 240),
                         outline=rgba(100, 80, 60, 220), width=3)
    # Tail (pointing down-left toward pet)
    tail_pts = [(32, H-28), (20, H-4), (56, H-28)]
    d.polygon(tail_pts, fill=rgba(255, 255, 245, 240))
    d.line([(32, H-28), (20, H-4)], fill=rgba(100, 80, 60, 220), width=3)
    d.line([(20, H-4), (56, H-28)], fill=rgba(100, 80, 60, 220), width=3)

    return img

# ── zzz.png ───────────────────────────────────────────────────────────────
def make_zzz():
    W, H = 52, 52
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    try:
        fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except Exception:
        fnt = ImageFont.load_default()
    d.text((6, 6), "z", font=fnt, fill=ZZZ_C, stroke_width=1, stroke_fill=DARK)
    d.text((22, 20), "z", font=fnt, fill=ZZZ_C, stroke_width=1, stroke_fill=DARK)
    d.text((10, 34), "z", font=fnt, fill=ZZZ_C, stroke_width=1, stroke_fill=DARK)
    return img

# ── Save only if file doesn't exist ──────────────────────────────────────
def save_if_missing(name, img):
    path = os.path.join(ASSETS, name)
    if os.path.exists(path):
        print(f"  skipping {name} (already exists)")
        return
    img.save(path, "PNG")
    print(f"  created  {name}")

save_if_missing("stand-still-1.png", make_stand1())
save_if_missing("stand-still-2.png", make_stand2())
save_if_missing("look-up.png",       make_look_up())
save_if_missing("sleep.png",         make_sleep())
save_if_missing("message.png",       make_message())
save_if_missing("zzz.png",           make_zzz())

print("Done.")
