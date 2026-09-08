"""Build campus.json (the object students import) and answers.json (the SHA-256
hashes and hint values the page uses) from two inputs:

  campus_facts.json   verified facts (see data_notes.md): five places with
                      source URLs, per-floor features, and per-room section
                      counts from the course-list scrape
  ../../data/CourseExport.csv   Miami's export of every Fall 2026 ISA section
                      (term 202710) with meeting locations; FSB 2050 is an
                      ISA-only room, so its count here is complete

Shape of campus.json (see the design spec):
  briefing, Farmer{name, code "FSB", address, opened, ..., floors{"0".."3"}},
  Yager, Millett, Upham, King  (each with its own fields and a source)
  floors[k] = {level, feature, sections, rooms:[{room, isa_sections, all_sections, all_subjects}, ...]}
  floors["2"] also carries classes: one row per ISA section on the floor

Usage: python make_campus.py
"""
import csv
import hashlib
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
EXPORT = HERE.parent.parent / "data" / "CourseExport.csv"
BASE = "https://isa401-find-your-seat.vercel.app"
EXPORT_DATE = date.fromtimestamp(EXPORT.stat().st_mtime).isoformat()

facts = json.loads((HERE / "campus_facts.json").read_text(encoding="utf-8"))
places = facts["places"]
fact_rooms = {r["room"]: r for r in facts.get("fsb_rooms", [])}
fsb_floors_facts = facts.get("fsb_floors", {})
scrape = facts.get("scrape", {})

# ---- ISA counts and classes from the export --------------------------------
rows = list(csv.DictReader(EXPORT.open(encoding="utf-8-sig")))
assert rows and all(r["Term"] == "202710" and r["Subject"] == "ISA" for r in rows), "unexpected export contents"
isa_per_room = defaultdict(int)
classes = defaultdict(list)
for r in rows:
    locs = sorted({l.strip() for l in r["Meeting Locations"].split("|") if l.strip().startswith("FSB ")})
    for loc in locs:
        room = loc.replace("FSB ", "")
        isa_per_room[room] += 1
        classes[room[0]].append({
            "course": f'{r["Subject"]} {r["Number"]}',
            "section": r["Section"].strip(),
            "title": r["Title"],
            "days": r["Meeting Days"].split("|")[0],
            "times": r["Meeting Times"].split("|")[0],
            "room": room,
        })
for room, n in isa_per_room.items():
    assert fact_rooms.get(room, {}).get("isa_sections", n) == n, f"scrape and export disagree on {room}"


def floor_feature(lvl):
    feats = fsb_floors_facts.get("features", {}) if isinstance(fsb_floors_facts, dict) else {}
    v = feats.get(lvl)
    if isinstance(v, dict):
        return v.get("feature")
    return v


all_rooms = sorted(set(fact_rooms) | set(isa_per_room))
floors = {}
for lvl in ["0", "1", "2", "3"]:
    entry = {"level": lvl}
    feat = floor_feature(lvl)
    if feat:
        entry["feature"] = feat
    entry["rooms"] = []
    for rm in all_rooms:
        if rm[0] != lvl:
            continue
        rec = {"room": rm, "isa_sections": isa_per_room.get(rm, 0)}
        fr = fact_rooms.get(rm)
        if fr and "all_sections" in fr:
            rec["all_sections"] = fr["all_sections"]
            rec["all_subjects"] = fr.get("all_subjects")
        entry["rooms"].append(rec)
    # total Fall 2026 sections meeting on the floor, all subjects (course-list scrape),
    # falling back to ISA-only counts if a room has no scrape record
    entry["sections"] = sum(r.get("all_sections", r["isa_sections"]) for r in entry["rooms"])
    if not entry["rooms"]:
        entry["note"] = "No Fall 2026 section meets on this floor, so rooms is empty here."
    if lvl == "2":
        entry["classes"] = sorted(classes["2"], key=lambda c: (c["room"], c["course"], c["section"]))
    floors[lvl] = entry

F = places["FSB"]
fsb = {
    "name": F.get("official_name", "Farmer School of Business"),
    "code": "MUFSB",
    "address": F.get("street_address"),
    "opened": F.get("year_current_building_opened"),
    "source": F.get("official_name_source"),
    "photo_credit": "Jay Murdock, Farmer School of Business",
    "rooms_source": (
        f"isa_sections: Miami University course export of Fall 2026 ISA sections (term 202710), file dated {EXPORT_DATE}. "
        f"all_sections and all_subjects: Miami course list ({scrape.get('source', '')}), {scrape.get('datetime', '')}."
    ),
    "floors": floors,
}
Y = places["Yager"]
M = places["Millett"]
U = places["Upham"]
K = places["King"]
campus = {
    "briefing": (
        "You are holding Miami University's campus as one R object: this briefing plus five very different "
        "places, so it is a named list, not a data frame. One of the places is the business school. Inside it, "
        "floors is a named list of four floors (\"0\" to \"3\", the first digit of every FSB room "
        "number). Each floor's rooms element is a data frame: one row per FSB room that hosts a Fall 2026 "
        f"section, with isa_sections (ISA sections, from Miami's course export dated {EXPORT_DATE}) and "
        "all_sections (every subject, from Miami's course list). Three questions: (1) the business school's "
        "code, (2) the total number of Fall 2026 sections (sections field) on the floor that holds room 2050, (3) the number of Fall 2026 ISA sections meeting "
        f"in FSB 2050. Answer them at {BASE}/?section=A or ?section=B."
    ),
    "Yager": {k: Y[k] for k in ("name", "full_name", "sport", "opened", "seating_capacity", "source") if k in Y},
    "Millett": {k: M[k] for k in ("name", "full_name", "sports", "opened", "seating_capacity", "basketball_configuration_capacity", "source") if k in M},
    "Upham": {k: U[k] for k in ("name", "what_it_is", "arch_tradition", "arch_source") if k in U},
    "Farmer": fsb,   # deliberately fifth: students have to look for the business school
    "King": {k: K[k] for k in ("name", "what_it_is", "street_address", "source") if k in K},
}

(HERE / "campus.json").write_text(json.dumps(campus, indent=2, ensure_ascii=False), encoding="utf-8")

# ---- answers ---------------------------------------------------------------
n2050 = isa_per_room["2050"]
answers = {"1": "MUFSB", "2": str(floors["2"]["sections"]), "3": str(n2050)}
assert len({floors[k]["sections"] for k in floors}) == 4, "floor totals must be distinct for the hints to work"


def h(s):
    return hashlib.sha256(s.strip().upper().encode("utf-8")).hexdigest()


floor2 = floors["2"]["rooms"]
out = {
    "hashes": {k: h(v) for k, v in answers.items()},
    "hints2": {"floor_name": "2", "totals": {k: floors[k]["sections"] for k in floors}},
    "hints3": {
        "nrow": len(floor2),
        "sum": sum(r["isa_sections"] for r in floor2),
        "rooms": {r["room"]: r["isa_sections"] for r in floor2 if r["room"] != "2050"},
        "classes_nrow": len(floors["2"]["classes"]),
        "all_2050": next((r.get("all_sections") for r in floor2 if r["room"] == "2050"), None),
    },
    "export_date": EXPORT_DATE,
    # plain text only for the finish line and the too-high hint; the value is
    # in campus.json anyway, and the check itself uses the hash
    "answer3": answers["3"],
}
(HERE / "answers.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
print("campus.json:", {k: len(v["rooms"]) for k, v in floors.items()}, "rooms per floor | 2050 ISA sections =", n2050,
      "| features:", {k: bool(v.get("feature")) for k, v in floors.items()}, "| places:", [k for k in campus if k != "briefing"])
