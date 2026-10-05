"""Build the Ceres Salvage Registry for the Salvage Run game (ISA 401, Class 11).

Writes api/_data.json: 400 wrecks, the
four stage answers, and the wrong values the hints recognise. Files that start
with _ under api/ are bundled with the functions but never served, so the
answers stay on the server.

Run:  C:\\ProgramData\\anaconda3\\envs\\isa401\\python.exe make_registry.py
"""
import json
import random
from pathlib import Path

SEED = 401
N = 400
PER_PAGE = 50
HERE = Path(__file__).parent

rng = random.Random(SEED)

CLASSES = {  # class: (weight, low MCr, high MCr)
    "Hauler": (22, 1.0, 6.0),
    "Freighter": (22, 2.0, 9.0),
    "Corvette": (18, 3.0, 10.0),
    "Tug": (15, 0.3, 1.5),
    "Probe": (15, 0.1, 0.9),
}
N_DREAD = 14
SECTORS = ["Vesta Drift", "Hygiea Reach", "Pallas Gap", "Juno Shelf", "Psyche Deep", "Ceres Near", "Eros Belt"]
PREFIX = ["KV", "RX", "TD", "NB", "MZ", "HQ", "JL", "CS", "VR", "PX"]
ADJ = ["Marrow", "Silent", "Copper", "Hollow", "Amber", "Iron", "Pale", "Distant", "Crimson", "Quiet", "Last", "Brass",
       "Cold", "Wandering", "Broken", "Gilded", "Ashen", "Bright", "Salt", "Northern", "Patient", "Ninth", "Velvet", "Lone"]
NOUN = ["Quill", "Lantern", "Heron", "Anvil", "Meridian", "Tide", "Covenant", "Sparrow", "Harbor", "Ember", "Vigil",
        "Compass", "Orchard", "Halyard", "Cinder", "Promise", "Kestrel", "Tern", "Ledger", "Solace", "Wake", "Bastion"]
CARGO = ["ice cores", "nickel ore", "hydroponic racks", "medical stores", "reactor shielding", "survey drones",
         "water tanks", "cobalt ingots", "spare hull plate", "navigation beacons", "seed vault", "fuel cells"]

# --- class for every position -------------------------------------------------
# 14 Dreadnoughts: exactly 3 on page 1 (positions 1..50), none at 286..288,
# and at least one on the last page so forgetting page 8 changes the stage 3 total.
dread_pos = set(rng.sample(range(1, 51), 3))
dread_pos.add(rng.randint(352, 400))
while len(dread_pos) < N_DREAD:
    p = rng.randint(51, 351)
    if p not in (286, 287, 288):
        dread_pos.add(p)

names, weights = list(CLASSES), [CLASSES[c][0] for c in CLASSES]
used_hulls, used_names = set(), set()
wrecks = []
for pos in range(1, N + 1):
    cls = "Dreadnought" if pos in dread_pos else rng.choices(names, weights)[0]
    while True:
        hull = f"{rng.choice(PREFIX)}-{rng.randint(1000, 9999)}"
        if hull not in used_hulls:
            used_hulls.add(hull)
            break
    while True:
        nm = f"{rng.choice(ADJ)} {rng.choice(NOUN)}"
        if nm not in used_names:
            used_names.add(nm)
            break
    lo, hi = (8.0, 25.0) if cls == "Dreadnought" else CLASSES[cls][1:]
    lost = rng.randint(2231, 2289)
    wrecks.append({
        "pos": pos,
        "hull": hull,
        "name": ("CSS " if cls in ("Dreadnought", "Corvette") else "ISV ") + nm,
        "cls": cls,
        "value": round(rng.uniform(lo, hi), 1),
        "sector": rng.choice(SECTORS),
        "built": lost - rng.randint(8, 60),
        "lost": lost,
        "crew": {"Dreadnought": rng.randint(900, 2400), "Corvette": rng.randint(40, 120), "Freighter": rng.randint(8, 30),
                 "Hauler": rng.randint(4, 16), "Tug": rng.randint(2, 5), "Probe": 0}[cls],
        "cargo": rng.sample(CARGO, rng.randint(1, 3)),
    })

# --- warp cores on the Dreadnoughts -----------------------------------------------
# One LIVE, five COLD, four BREACHED, four with no reading at all (element absent).
dreads = [w for w in wrecks if w["cls"] == "Dreadnought"]
states = ["LIVE"] + ["COLD"] * 5 + ["BREACHED"] * 4 + [None] * 4
rng.shuffle(states)
# keep the LIVE core off page 1 and off the last page, so it takes the whole loop
while any(s == "LIVE" and (w["pos"] <= 50 or w["pos"] > 350) for s, w in zip(states, dreads)):
    rng.shuffle(states)
for w, s in zip(dreads, states):
    w["core"] = s
# a decoy log line mentions an old LIVE reading on two other Dreadnoughts,
# so searching the whole page text for "LIVE" finds three hulls, not one
for w in rng.sample([d for d in dreads if d["core"] != "LIVE"], 2):
    w["log"] = f"Archive: core read LIVE at the {w['lost'] - 3} inspection, before the loss."

starts = list(range(1, N + 1, PER_PAGE))
by_pos = {w["pos"]: w for w in wrecks}

# --- answers -----------------------------------------------------------------------
def dsum(ws):
    return round(sum(w["value"] for w in ws if w["cls"] == "Dreadnought"), 1)

page = lambda s: [w for w in wrecks if s <= w["pos"] < s + PER_PAGE]

a1 = sum(w["cls"] == "Dreadnought" for w in page(1))
a2 = PER_PAGE   # how much start= goes up from one page to the next
a3 = dsum(wrecks)
a4 = next(w["hull"] for w in dreads if w["core"] == "LIVE")

# wrong values the hints name, stage by stage
w1 = {
    str(sum(w["cls"] == "Dreadnought" for w in wrecks)): "all_pages",
    "50": "cards",
}
for c in CLASSES:
    n = sum(w["cls"] == c for w in page(1))
    w1.setdefault(str(n), "class:" + c)
w1.pop(str(a1), None)

w3 = {}
def add3(v, why):
    k = f"{round(v, 1):.1f}"
    if k != f"{a3:.1f}":
        w3.setdefault(k, why)

add3(dsum(page(1)), "page1_only")
for k in range(2, 8):
    add3(dsum([w for w in wrecks if w["pos"] < 1 + k * PER_PAGE]), f"pages:{k}")
add3(sum(dsum(page(s)) for s in range(1, 9)), "start_1_to_8")           # start = 1:8, overlapping pages
add3(sum(dsum(page(s)) for s in range(50, 401, 50)), "start_50_by_50")  # 0-based thinking, first page skipped
add3(dsum([w for w in wrecks if w["pos"] > 50]), "missing_page1")
add3(round(sum(w["value"] for w in wrecks), 1), "all_classes")

data = {
    "seed": SEED, "per_page": PER_PAGE, "n": N,
    "wrecks": wrecks,
    "answers": {"1": a1, "2": a2, "3": a3},
    "wrong": {"1": w1, "3": w3},
}
out = HERE / "api" / "_data.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(data, indent=1), encoding="utf-8")

print(f"wrote {out}")
print(f"stage 1: {a1} Dreadnoughts on page 1")
print(f"stage 2: start goes up by {a2} per page")
print(f"stage 3: Dreadnought total {a3} MCr over {len(dreads)} Dreadnoughts at positions {sorted(dread_pos)}")
print(f"stage 4: LIVE core on {a4} (position {next(w['pos'] for w in dreads if w['hull'] == a4)})")
print("cores:", [(w["hull"], w["core"]) for w in dreads])
print("stage 3 wrong values:", w3)
