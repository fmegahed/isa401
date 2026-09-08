# Find Your Seat

The opener of ISA 401 Class 05 (Wed Sep 9, 2026). Students subset one nested R
object from Miami's campus down to the seat they are sitting in, FSB 2050,
while the projector shows the room's 42 seats lighting up live. The pair formed
here is the pair for the Import Heist later in the class, and the Heist reports
to the same board. Design specs:
`docs/superpowers/specs/2026-09-02-find-your-seat-design.md` (the game) and
`docs/superpowers/specs/2026-09-04-find-your-seat-board-v2-design.md` (the board).

Live: https://isa401-find-your-seat.vercel.app

## Run book (class day)

| What | Address |
|---|---|
| Students, section A | `https://isa401-find-your-seat.vercel.app/?section=A` |
| Students, section B | `https://isa401-find-your-seat.vercel.app/?section=B` |
| Projector board | `https://isa401-find-your-seat.vercel.app/board?section=A&mode=opener` (switch section and mode with the chips at the top) |
| Board with the reset button | add `&key=ADMIN_KEY` to the board address (the key is fall2026, set as the ADMIN_KEY env var; Fadel chose to keep it in the deck's speaker notes) |
| The object students import | `https://isa401-find-your-seat.vercel.app/campus.json` |

Before each section: open the board with the key, click **Start a new run**
twice (it asks for confirmation), and check that the run number went up and
every seat is dark. Runs never mix: a reset starts a new run id for that
section only, and old runs are never displayed again. Then click **Sound on**
once (browsers need a click before they will play audio) and leave the board
on the projector while students settle.

Board buttons, top right: **Sound** (chime per arrival, chord per completed
table, fanfare at the finish), **Replay run** (the run so far at 30x),
**Celebrate** (plays the finish sequence now; it also fires by itself the
moment every seat that tapped in has arrived, once at least ten seats are
in). Switch the **Mode** chip to Heist at Part 2; the seats that tapped in
this morning show as "here, not started" until they run stage 1.

Monday's data: `readr::read_csv("https://isa401-find-your-seat.vercel.app/api/export?section=A")`
returns the section's current run as tidy CSV, one row per seat per level
reached, both tracks (`run=7` picks an older run).

The one line students run:

```r
campus = jsonlite::fromJSON("https://isa401-find-your-seat.vercel.app/campus.json")
```

## Levels

| Level | Question | R | Answer |
|---|---|---|---|
| 0 | Tap your seat | none | seat id, e.g. `L2-3` |
| 1 | The business school's `code` | `campus[["Farmer"]]$code` | `MUFSB` |
| 2 | Fall 2026 sections on the floor holding 2050 | `campus$Farmer$floors[["2"]]$sections` | the floor total (printed by make_campus.py) |
| 3 | Fall 2026 ISA sections meeting in 2050 | `r = campus$Farmer$floors[["2"]]$rooms; r$isa_sections[r$room == "2050"]` | 11 |

Answers are checked in the page against SHA-256 hashes in `answers.json`.
Wrong answers get an R-flavored hint (single bracket returning NULL, the
position trap `floors[[2]]` being floor "1", `nrow`, the floor-wide sum, the
other room's count). Nothing locks.

## Data

- Element order is briefing, Yager, Millett, Upham, Farmer, King: the business
  school is fifth on purpose.
- `campus.json` is built by `make_campus.py` from two inputs:
  `campus_facts.json` (the five places, each with a source URL; see
  `data_notes.md`) and `../../data/CourseExport.csv`, Miami's export of every
  Fall 2026 ISA section (term 202710) with meeting locations. FSB 2050 is an
  ISA-only room, so its count from the export is complete. Counts for other
  FSB rooms cover ISA sections only, and the object says so.
- `campus$Farmer$floors[["2"]]$classes` lists every ISA section on the floor
  (course, section, title, days, times, room). Both ISA 401 sections are in it.
- Re-run `python make_campus.py` after replacing the export; it rewrites
  `campus.json` and `answers.json` and prints the 2050 count.

Shape check from R (part of verification):
`class(campus)` list, `class(campus$Farmer$floors)` list,
`class(campus$Farmer$floors[["2"]]$rooms)` data.frame,
`campus$Farmer$floors[[2]]$level` is `"1"` (the trap), `campus["Farmer"]$code` is NULL.

## Seat plan

`make_plan.py` draws `plan.svg`: the front of the room at the top with a door
in each front corner, two screens on the front wall, the podium at the left end of the left screen by the door, then six long tables in three
rows and two columns split by the centre aisle, seven computers per table
(3 x 2 x 7 = 42), windows along the back wall on both sides, per Fadel's
description of the room. Seat id = side + row + position: `L2-3` is the left
table in row 2, third seat from the left as you face the front. Every seat is `<g class="seat" data-seat="L2-3">` and every table
`<rect class="table" data-table="L2">`; the CSS classes `picked`, `l1`, `l2`,
`l3`, `done`, `here`, `mine` set a seat's state and `lit` a table's.

## What the board shows

Every denominator on the board is the **present set**: the seats that tapped
in during this run's opener. Never 42, never 7 per table, so absences and
uneven tables cannot skew anything, and nobody's name is collected.

- **Goal bar**: "N of M arrived" (opener) or "cleared" (heist) over the
  present set, with the elapsed clock since the first tap.
- **Tables** glow when every present seat at the table has reached the top
  level. Tables are never ranked; a table with one person glows when that
  person arrives.
- **Where the room is**: the strip under the top bar and the photo behind
  the board (campus, FSB, atrium, hallway) follow the section's **median
  level** over present seats. In Heist mode the stage is dark and the strip
  reads Stage 1, Stage 2, Cleared.
- **The code chain** under the plan is collapsed by default; click its
  header or press **T** to open it (the board remembers the choice). It
  grows with the same median: fragments
  show as yellow `?` boxes until the room's median clears that level, then
  fill in (`"Farmer"`, `"2"`, `"2050"`). The answers themselves (`MUFSB`,
  the counts, `smithj31`, `6`) are never shown; the Heist lines keep the
  deck's `ACCOUNT` and `NUMBER` placeholders.
- **Finish sequence**: confetti, first and median arrival times, the level
  the room spent longest on (median per-seat time between levels), tables
  complete, the full chain. Auto-fires once per run when arrived equals
  present and present is at least ten; the Celebrate button plays it any time.
- **Replay run** re-paints the run from its timestamps at 30x.
- **Attract mode**: until the first seat taps in, the plan is covered by the
  section's QR code (`images/qr_A.png`, `qr_B.png`, copied from the Class 05
  deck) and the one line to run. It dissolves on the first tap.
- **Scene cuts**: when the room's median advances (opener levels 1 to 3, any
  Heist stage) the whole projector cuts for four seconds to the matching
  photo, a title ("Farmer School of Business") and the bracket that got the
  room there, then returns to the plan. `fysCut(2)` in the console previews one.
- **Toasts** at the bottom of the plan: each arrival with rank and time,
  "First in", "Half the room has arrived", "Table L1 is complete".
- **Needs a hand**: a seat that has sat on one level for longer than twice
  the room's median step (never less than 75 seconds) gets an amber halo.
  Walk to it.
- **Fullscreen** button (or F). Keys: S sound, R replay, C celebrate, T
  show or hide the code, Esc closes the finish overlay.

The phone's finish page polls the board every three seconds and lights up
everyone else on the student's own plan ("23 of 31 seats have arrived. Help a
neighbor."), so finishers watch the room instead of their phone.

## Board and API

- `POST /api/progress` `{section, seat, track, level, key?}` records the highest
  level per seat in the current run and assigns finish ranks. `track` is
  `opener` (levels 0 to 3) or `heist` (1, 2, 4 = CLEARED); Heist calls carry
  `key = PROGRESS_KEY`.
- `GET /api/board?section=A&track=opener` returns every seat's state, the
  finishers in order, and `present`, the seats seen in this run's opener.
- `GET /api/export?section=A&run=7&track=all` returns the run as CSV
  (`section, run, track, seat, table, level, level_name, reached_at, seconds,
  rank`); `run` defaults to the current run, `track` to both.
- `POST /api/progress` also returns `present` (seats tapped in) and
  `arrived` (finishers so far); the phone's finish page uses them for
  "N seats still on the way".
- `POST /api/reset?section=A&key=ADMIN_KEY` starts a new run.

Storage is Upstash for Redis from the Vercel Marketplace (REST API, no SDK);
`api/_store.js` accepts either `KV_REST_API_*` or `UPSTASH_REDIS_REST_*` env
vars. Keys: `run:{section}:id`, `run:{section}:{id}:{track}` (hash seat ->
`{level, t, rank}`), `...:finishers` (counter). Thirty-day expiry.

Env vars on the project: `PROGRESS_KEY` (shared with the Heist project),
`ADMIN_KEY`, plus the Redis vars the integration adds.

## Images

`images/` holds web-size, EXIF-free copies of four photographs by Jay Murdock,
the Farmer School of Business photographer: campus from above, the FSB facade, the second-floor atrium, and the
hallway to 2050. Each scene carries its credit in the corner. No published
image shows an identifiable person; the class photograph used to trace the
plan stays out of the repository.

## Deploy

```
vercel --yes --prod
```

from this folder (the project is linked to `isa401-find-your-seat`).

## Retuning for a new term

1. Replace `../../data/CourseExport.csv` with the new export and run
   `make_campus.py`; the answer to level 3 and the hints update themselves.
2. If the room changes, edit `make_plan.py` (tables, seats per side, rows).
3. Reset both sections from the board before the first class.
