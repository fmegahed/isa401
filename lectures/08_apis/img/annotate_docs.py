"""Annotate the documentation screenshots used in deck 08 (numbered callouts in Miami red).

Raw captures (Playwright, 1300 px wide viewport, Sep 21, 2026) live next to this script as *_raw.png.
Run:  python annotate_docs.py     (needs Pillow; fonts from C:/Windows/Fonts)
Boxes are (left, top, right, bottom) in raw-image pixels; the number is the callout label.
"""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
RED = (195, 20, 45)
BOLD = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 19)
SMALL = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 15)


def callout(draw, box, label, side="left"):
    l, t, r, b = box
    draw.rounded_rectangle((l - 4, t - 4, r + 4, b + 4), radius=7, outline=RED, width=3)
    cx = l - 20 if side == "left" else r + 20
    cy = (t + b) // 2
    if side == "top":
        cx, cy = l + 8, t - 20
    draw.ellipse((cx - 15, cy - 15, cx + 15, cy + 15), fill=RED)
    w = draw.textlength(str(label), font=BOLD)
    draw.text((cx - w / 2, cy - 11), str(label), fill="white", font=BOLD)


def annotate(raw, out, boxes, crop=None):
    im = Image.open(os.path.join(HERE, raw)).convert("RGB")
    d = ImageDraw.Draw(im)
    for label, box, side in boxes:
        callout(d, box, label, side)
    if crop:
        im = im.crop(crop)
    im.save(os.path.join(HERE, out), optimize=True)
    print(out, im.size)


# 1. Cincinnati open data portal: Actions > API dialog, SODA2 selected
annotate("doc_cincy_raw.png", "doc_cincy.png", [
    (1, (1065, 226, 1181, 262), "left"),    # Actions menu, then API
    (2, (415, 320, 590, 343), "right"),     # All data (433160 rows)
    (3, (410, 372, 874, 454), "right"),     # default limit of 1,000 rows
    (4, (542, 481, 624, 506), "right"),     # SODA2: the version that needs no key
    (5, (410, 516, 874, 559), "right"),     # the API endpoint
    (6, (418, 584, 590, 607), "left"),      # API documentation link
], crop=(350, 30, 1215, 705))

# 2. USAJOBS tutorial, Step 1 (cURL tab) and the first lines of Step 2
annotate("doc_usajobs_raw.png", "doc_usajobs.png", [
    (4, (557, 191, 1238, 213), "right"),    # 3 parameters defined in the header
    (2, (375, 216, 852, 238), "left"),      # base URL
    (4, (425, 331, 722, 386), "right"),     # the three headers in the example
    (3, (375, 522, 1256, 572), "left"),     # full list of query parameters: GET /api/Search
], crop=(340, 105, 1285, 600))

# 3. OpenAI API reference: Create a model response
annotate("doc_openai_raw.png", "doc_openai.png", [
    (1, (296, 252, 434, 276), "right"),     # POST /responses
    (2, (870, 466, 1146, 486), "top"),      # the address
    (3, (850, 506, 1190, 526), "left"),     # Authorization: Bearer
    (4, (848, 546, 1046, 586), "left"),     # body: model and input
], crop=(270, 120, 1240, 610))

# 4. FRED: four parts of one long page, stacked, with a gray bar between non-adjacent parts
full = Image.open(os.path.join(HERE, "doc_fred_full_raw.png")).convert("RGB")
parts = [
    ("fred/series/observations (top of the page)", (80, 165, 1210, 212), [(1, (88, 172, 352, 204), "right")]),
    ("Examples > JSON", (80, 2806, 1210, 2922), [(2, (88, 2874, 1198, 2908), "top")]),
    ("Parameters > api_key", (80, 13097, 1210, 13206), [(3, (112, 13174, 560, 13198), "right")]),
    ("Parameters > observation_start", (80, 14220, 1210, 14328), [(4, (112, 14297, 760, 14321), "right")]),
]
BAR = 26
height = sum((c[3] - c[1]) + BAR for _, c, _ in parts)
canvas = Image.new("RGB", (1130, height), "white")
y = 0
for title, crop, boxes in parts:
    d = ImageDraw.Draw(full)
    for label, box, side in boxes:
        callout(d, box, label, side)
    cd = ImageDraw.Draw(canvas)
    cd.rectangle((0, y, 1130, y + BAR), fill=(229, 231, 235))
    cd.text((10, y + 4), title, fill=(88, 94, 96), font=SMALL)
    y += BAR
    canvas.paste(full.crop(crop), (0, y))
    y += crop[3] - crop[1]
canvas.save(os.path.join(HERE, "doc_fred.png"), optimize=True)
print("doc_fred.png", canvas.size)
