# Salvage Run (ISA 401, Class 11: Web Scraping II)

Live at https://isa401-salvage.vercel.app. Design spec:
`docs/superpowers/specs/2026-09-30-salvage-run-design.md`.

Pairs scrape the fictional **Ceres Salvage Registry** (400 derelict ships, 50 a
page) from R and price the Dreadnoughts' salvage. Three stages, one skill each:
the right CSS selector, how the URL changes across pages (offset pagination,
`?start=1, 51, 101, ...`), and a `for` loop over every page. The projector shows
a 3D belt where each seat's tug flies further out with each stage and tows a
core home at the end. Stage 4 (a function mapped over the dossier pages) was
cut on 2026-09-30; the finish screen and `solution.R` keep map as an extra.

## Run book (class day)

| What | Address |
|---|---|
| Students, section A | `https://isa401-salvage.vercel.app/?section=A` |
| Students, section B | `https://isa401-salvage.vercel.app/?section=B` |
| Projector board | `https://isa401-salvage.vercel.app/board?section=A` |
| Board with reset | add `&key=fall2026` (the ADMIN_KEY env var) |
| Rehearsal (fake class, no Redis) | `https://isa401-salvage.vercel.app/board?demo=1` |
| The site students scrape | `https://isa401-salvage.vercel.app/registry?start=1` |

Before each section: open the board with the key, click **Start a new run**
twice (the second click confirms), click **Sound off** once to turn sound on,
and leave the board up. It shows a QR code and the address until the first seat
checks in. **Celebrate** plays the finale on demand; it also fires by itself
when every seat that checked in has finished (at least ten seats).

Board rules, as on the seat board: seat is the only identity, every count is
"n of the seats that checked in this run", tables are never compared, and no
answer appears on the board. An amber halo marks a seat with three or more
wrong tries on its current stage: walk over.

## Stages and answers

| # | Skill | Question | Answer |
|---|---|---|---|
| 1 | CSS selector | Dreadnoughts among the 50 cards on `start=1` | **3** (check `length()` is 50 first) |
| 2 | URL pattern | By how much does `start=` change from one page to the next? | **50** (1, 51, 101, ...) |
| 3 | for loop | Total salvage of every Dreadnought, MCr | **224.0** (14 Dreadnoughts; +/- 0.05 accepted) |

`solution.R` is the instructor key and runs top to bottom against the live
site in about 20 seconds (it pauses 1 s per request, as robots.txt asks). Set
`SALVAGE_BASE=http://localhost:4010` to run it against the dev server.

Traps built into the pages, each with a hint that names it:

- **Offset, not page number.** `start=2` shows wrecks 2-51; `start=0` is a 404
  that explains the registry counts from 1.

Wrong answers the hints recognise are generated with the data
(`wrong` in `api/_data.json`): first page only, first k pages,
`start = 1:8`, `seq(50, 400, 50)`, all classes; for stage 2, the page number
(1), page 2's start (51), 49, and multi-page jumps. A stage 1 count below 3 gets a hint about
selectors that miss cards (for example a `div > span` child combinator).

## Files

| File | Role |
|---|---|
| `make_registry.py` | seeded generator (seed 401): writes `api/_data.json` (registry + answers). Run with the isa401 conda env. |
| `api/_data.json` | data and answers; `_` files under `api/` are bundled, never served |
| `api/registry.js`, `api/wreck.js`, `api/_site.js` | the scraped HTML pages (`/registry`; `/wreck/:hull` dossiers are still served but no stage uses them) |
| `api/check.js` | checks answers server-side, records progress, returns hints |
| `api/board.js`, `api/reset.js`, `api/_store.js` | board state and runs; Upstash Redis shared with the seat game, keys prefixed `salvage:` |
| `index.html` | crew console (students) |
| `board.html` | Three.js projector board (bloom, instanced asteroid belt, one tug per seat, finale) |
| `blender/build_models.py` | procedural ships, station, asteroids; renders `img/*` and exports `models/salvage.glb` |
| `dev/server.js` | local stand-in for Vercel on port 4010 (uses `.env.local`, the shared store: test in section Z) |

Rebuild the art: `"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P blender/build_models.py`
(add `-- --fast` for quick previews). About one minute on the RTX 5000.

Deploy: `npx vercel --prod` from this folder (project `isa401-salvage`; git
commits do not deploy). Env vars: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `ADMIN_KEY`.
