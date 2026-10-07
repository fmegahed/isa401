# -*- coding: utf-8 -*-
"""jobs.json for the review site: for each skill tag in the Job Scout database, how many postings
ask for it and a few example postings. Reads data/scout.db (read-only); no descriptions are exported.

    C:/ProgramData/anaconda3/envs/isa401/python.exe make_jobs.py
"""
import json, sqlite3, collections, pathlib

here = pathlib.Path(__file__).parent
db = here.parent.parent / "data" / "scout.db"
con = sqlite3.connect(f"file:{db.as_posix()}?mode=ro", uri=True)
con.row_factory = sqlite3.Row
rows = con.execute("""select title, company, location_city, location_state, remote, category, apply_url,
                             posted_at, active, skills_json from scout_postings""").fetchall()

total = len(rows)
harvested = con.execute("select max(harvested_at) from scout_postings").fetchone()[0][:10]
n = collections.Counter(); req = collections.Counter(); posts = collections.defaultdict(list)
for r in rows:
    for s in json.loads(r["skills_json"] or "[]"):
        sid = s["skillId"]; n[sid] += 1
        if s.get("importance") == "required":
            req[sid] += 1
        posts[sid].append((r, s.get("importance") == "required"))

LABEL = {"r": "R", "sql": "SQL", "etl": "ETL (extract, transform, load)", "llm_applications": "LLM applications",
         "generative_ai": "Generative AI", "power_bi": "Power BI"}


def examples(sid, k=4):
    """Still-open postings first, then required before preferred, then newest; at most one per employer."""
    ranked = sorted(posts[sid], key=lambda p: (-p[0]["active"], -int(p[1]), p[0]["posted_at"] or ""), reverse=False)
    ranked = sorted(ranked, key=lambda p: p[0]["posted_at"] or "", reverse=True)
    ranked = sorted(ranked, key=lambda p: (p[0]["active"], int(p[1])), reverse=True)
    out, seen = [], set()
    for r, required in ranked:
        if r["company"] in seen:
            continue
        seen.add(r["company"])
        place = ", ".join(x for x in [r["location_city"], r["location_state"]] if x) or ("Remote" if r["remote"] else "")
        out.append({"title": r["title"], "company": r["company"], "place": place, "kind": r["category"],
                    "posted": r["posted_at"], "required": required,
                    "url": r["apply_url"] if r["active"] else None})
        if len(out) == k:
            break
    return out


skills = {sid: {"label": LABEL.get(sid, sid.replace("_", " ").capitalize()), "n": n[sid], "required": req[sid],
                "examples": examples(sid)} for sid in n}
json.dump({"total": total, "harvested": harvested, "skills": skills}, open(here / "jobs.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"jobs.json: {total} postings, {len(skills)} skills, harvested {harvested}")
