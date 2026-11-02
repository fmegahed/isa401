# Pie on Trial

A two-minute game for ISA 401 Class 20 (Mon Nov 2, 2026). Students see the three datasets from the
"Pie Charts are Awful By Design" slides as pies, then as bars, and tap the largest slice or bar with
15 seconds per chart. The projector then shows how the class answered, pie next to bars. It has no names,
seats or points, and nothing counts toward grades.

Live: https://isa401-pie-on-trial.vercel.app (Vercel project `isa401-pie-on-trial`, team
`fadel-megaheds-projects`). Deploy with `npx vercel --prod` from this folder; git does nothing.

## Run book (class day)

| What | Address |
|---|---|
| Students, section A (8:30) | `https://isa401-pie-on-trial.vercel.app/?section=A` (QR: `images/qr_A.png`) |
| Students, section B (10:05) | `https://isa401-pie-on-trial.vercel.app/?section=B` (QR: `images/qr_B.png`) |
| Test section (never used in class) | `https://isa401-pie-on-trial.vercel.app/?section=Z` |
| Projector (host) | `https://isa401-pie-on-trial.vercel.app/host?section=A` (or `B`, `Z`) |
| Projector rehearsal, simulated class | `https://isa401-pie-on-trial.vercel.app/host?section=A&demo=1` (no key, no writes) |

The admin key is Game Day's `ADMIN_KEY` (same value); the host page asks once per browser tab.

1. Open the host page before the pie slides, enter the key and press **X** twice to reset.
2. Leave the lobby up while students scan the code.
3. Press **Space** to start. The count shows who has finished. A phone appears in the count after its
   first answer or timeout, so wait about 15 seconds before trusting the total.
4. Press **Space** to stop and reveal. Students who were not finished keep the answers they gave.
5. **Space** steps through the three exhibits and the verdict, then return to the deck.

| Key | Action |
|---|---|
| Space or right arrow | next step (the label is on the red dock button) |
| B or left arrow | back, inside the reveal |
| X twice within 3 s | reset: new run, phones return to waiting |
| M | music on or off |
| F / H | full screen / hide the dock |

## What the numbers mean

The percent right for a chart is the phones that tapped the largest, out of all phones shown that chart,
including those that ran out of time. Phones stopped early by the reveal count only for the charts they saw.
Bars always come second, so they carry a practice advantage, and the values are close on purpose. The verdict
screen says both. The title follows the data, including if pies win or the two tie.

## Data

`data.js` holds the three datasets, shared by both pages. They come from the data-to-viz pie caveat
(https://www.data-to-viz.com/caveat/pie.html), adjusted so each adds up to 100 in whole percents:
rising 16, 18, 20, 22, 24; flat 20, 19, 21, 20, 20; falling 23, 22, 20, 18, 17. The Class 20 slides use
the same values. The colors are the slides' viridis scale and fail the dataviz lightness and chroma checks;
they are kept so the game matches the slides, and every slice and bar carries a letter.

## Files

| Path | What it is | Served? |
|---|---|---|
| `index.html`, `host.html`, `data.js` | phone page, projector page (`/host`), shared data and chart drawing | yes |
| `images/qr_*.png`, `favicon.png` | QR codes for sections A and B, icon | yes |
| `audio/sneaky-snitch.mp3` | "Sneaky Snitch" by Kevin MacLeod (incompetech.com), CC BY 4.0; plays on the projector only, from Start to the reveal, with its credit on screen | yes |
| `api/*.js` | state, answer, board, host (Vercel functions) | as endpoints |
| `api/_game.js`, `api/_store.js` | game logic and Upstash helper (keys start with `pot:`; `pt:` belongs to Press Time in the same store) | no |
| `dev/`, `tests/` | local server with an in-memory store, tests (`npm test`) | no |

Environment on Vercel: `KV_REST_API_URL`, `KV_REST_API_TOKEN` (the shared store), `ADMIN_KEY`.
