"""Build the Exam 01 copy of the salvage registry (ISA 401, Fall 2026).

Same markup as the Class 11 game, different data: a new seed, 360 wrecks, 40 a
page. Writes api/_exam_data.json (bundled with the function, never served) and
exam_key.json (the instructor key; listed in .vercelignore, so it is not deployed).
The Class 11 game reads api/_data.json and is not touched by this script.

Run:  python make_exam_registry.py
"""
import json
import random
from pathlib import Path

SEED = 20261012
N = 360
PER_PAGE = 40
HERE = Path(__file__).parent

rng = random.Random(SEED)

CLASSES = {  # class: (weight, low MCr, high MCr)
    "Hauler": (20, 1.0, 6.0),
    "Freighter": (24, 2.0, 9.0),
    "Corvette": (19, 3.0, 10.0),
    "Tug": (17, 0.3, 1.5),
    "Probe": (12, 0.1, 0.9),
}
N_DREAD = 17
SECTORS = ["Vesta Drift", "Hygiea Reach", "Pallas Gap", "Juno Shelf", "Psyche Deep", "Ceres Near", "Eros Belt"]
PREFIX = ["AK", "BN", "DW", "FY", "GT", "LQ", "OS", "UE", "WH", "ZC"]
ADJ = ["Tallow", "Drifting", "Cobalt", "Empty", "Russet", "Steel", "Wan", "Far", "Scarlet", "Still", "First", "Bronze",
       "Frozen", "Roaming", "Sundered", "Burnished", "Sooty", "Clear", "Brine", "Southern", "Steady", "Seventh", "Linen", "Sole"]
NOUN = ["Plume", "Beacon", "Egret", "Hammer", "Zenith", "Current", "Accord", "Finch", "Mooring", "Coal", "Watch",
        "Sextant", "Grove", "Hawser", "Ash", "Oath", "Falcon", "Gull", "Tally", "Respite", "Trail", "Rampart"]

# 17 Dreadnoughts: 2 on the first page, at least 2 on the last page, the rest spread out,
# so a scrape that stops early or uses the class page size gets a different total.
dread_pos = set(rng.sample(range(1, PER_PAGE + 1), 2))
dread_pos.update(rng.sample(range(N - PER_PAGE + 1, N + 1), 2))
while len(dread_pos) < N_DREAD:
    dread_pos.add(rng.randint(PER_PAGE + 1, N - PER_PAGE))

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
    wrecks.append({
        "pos": pos,
        "hull": hull,
        "name": ("CSS " if cls in ("Dreadnought", "Corvette") else "ISV ") + nm,
        "cls": cls,
        "value": round(rng.uniform(lo, hi), 1),
        "sector": rng.choice(SECTORS),
    })

data = {"seed": SEED, "per_page": PER_PAGE, "n": N, "wrecks": wrecks}
out = HERE / "api" / "_exam_data.json"
out.write_text(json.dumps(data, indent=1), encoding="utf-8")

# ---- instructor key ---------------------------------------------------------------
def total(ws, cls=None):
    return round(sum(w["value"] for w in ws if cls is None or w["cls"] == cls), 1)

page = lambda s, per=PER_PAGE: [w for w in wrecks if s <= w["pos"] < s + per]
all_classes = sorted({w["cls"] for w in wrecks})
key = {
    "n": N, "per_page": PER_PAGE, "starts": list(range(1, N + 1, PER_PAGE)),
    "count_by_class": {c: sum(w["cls"] == c for w in wrecks) for c in all_classes},
    "value_by_class": {c: total(wrecks, c) for c in all_classes},
    "value_all": total(wrecks),
    "count_by_sector": {s: sum(w["sector"] == s for w in wrecks) for s in SECTORS},
    "page1_count_by_class": {c: sum(w["cls"] == c for w in page(1)) for c in all_classes},
    "most_valuable": max(wrecks, key=lambda w: w["value"]),
    # what a scrape returns when the class page size is reused: start = 1, 51, ..., 351 (pages overlap and skip)
    "wrong_if_by_50": {
        "rows": sum(len(page(s)) for s in range(1, N + 1, 50)),
        "dreadnought_value": round(sum(total(page(s), "Dreadnought") for s in range(1, N + 1, 50)), 1),
        "dreadnought_count": sum(sum(w["cls"] == "Dreadnought" for w in page(s)) for s in range(1, N + 1, 50)),
    },
    "wrong_if_page1_only": {"rows": len(page(1)), "dreadnought_value": total(page(1), "Dreadnought")},
}
(HERE / "exam_key.json").write_text(json.dumps(key, indent=1), encoding="utf-8")

print(f"wrote {out} and exam_key.json")
print(json.dumps({k: v for k, v in key.items() if k != "most_valuable"}, indent=1))
print("most valuable:", key["most_valuable"])
print("dreadnought positions:", sorted(dread_pos))
