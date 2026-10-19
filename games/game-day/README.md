# Game Day at Yager

A Kahoot-style class game for ISA 401 Class 16 (Mon Oct 19, 2026). It reviews
Classes 14-15 (distortion, data-ink, data types, encodings, color) and opens
the grammar of graphics. Students play on their phones; the projector shows
the host page with a seat map of FSB 2050, live answer counts and a
leaderboard. The charts are drawn in R from cited data on Miami football and
three published examples. Points count for nothing.

Live: https://isa401-game-day.vercel.app (Vercel project `isa401-game-day`,
team `fadel-megaheds-projects`).

## Run book (class day)

| What | Address |
|---|---|
| Students, section A (8:30) | `https://isa401-game-day.vercel.app/?section=A` (QR: `images/qr_A.png`) |
| Students, section B (10:05) | `https://isa401-game-day.vercel.app/?section=B` (QR: `images/qr_B.png`) |
| Test section (never used in class) | `https://isa401-game-day.vercel.app/?section=Z` |
| Projector (host) | `https://isa401-game-day.vercel.app/host?section=A` (or `B`, `Z`) |
| Projector, rehearsal without a server | `https://isa401-game-day.vercel.app/host?section=A&demo=1` |

The QR codes in `images/` and in the Class 16 deck decode to the two section
addresses above.

### The admin key

The host page opens with a key prompt. Type the admin key once; the page
checks it against the server, then keeps it in `sessionStorage` for that
browser tab only. It is never put in the address bar, and closing the tab
forgets it. The value is the `ADMIN_KEY` environment variable on the Vercel
project, a short word Fadel chose on Oct 19, 2026 so it is quick to type in
class (the game has no effect on grades). It is not in this README, the deck
or the repository; locally it sits in `games/game-day/.env.local`, which is
gitignored.

The right key always works. A wrong key gets "The key was not accepted"; after
ten wrong keys from one address in one minute that address gets a one-minute
lockout for wrong keys only, so students guessing from the campus network
cannot lock the host out.

### Before each section

1. Open the host page for the section and enter the key.
2. Press **X** twice (or click Reset twice within 3 seconds). The run number
   in the bottom left goes up and the lobby is empty.
3. Leave the lobby on the projector. It shows the section's QR code and
   address and fills the seat map as students join.

Each section has its own runs. A reset starts a new run for that section only;
old runs stay in storage for 30 days and can still be exported.

### Running the game

**Space** always does the next logical step, and its label shows on the red
button in the dock: Next (show the question without its answer choices, clock
not running), Open (start the clock and show the choices), Close, Reveal, then
Break at the end of the 1st, 2nd and 3rd quarters, otherwise Next; Final after
question 14.

| Key | Action |
|---|---|
| Space | next logical step (see above) |
| N | next question (pre-open: shown, clock stopped) |
| O | open: start the clock |
| C | close early (the clock also closes it by itself) |
| R | reveal: correct option, histogram, points, seat colors; on an open question, a strong answer in bullets (Q4: what misleads and fixes) and how many answers covered each key idea, in place of the seat map |
| B | break (only from a reveal): leaderboard with movement since the last break |
| E | final; before the last question it asks for a second press |
| J | rejudge: send open answers Jev could not check back to Jev |
| X | reset; asks for a second press within 3 seconds |
| M | sound on or off |
| F | full screen |
| H | hide or show the dock |
| Esc | close a scene cut |

A double-tapped key cannot skip a step: one action runs at a time, and keys
are ignored for 800 ms after an action finishes.

**Breaks.** Space offers Break after questions 4, 8 and 11 (the ends of the
1st, 2nd and 3rd quarters). The 4th quarter runs straight into the Two-Minute
Drill (question 14). From a break, Space goes to the next question.

**Open questions (4 and 14, 90 seconds).** Jev checks each answer against the
question's rubric in the background, usually within a few seconds. The host
shows "Reviewing answers" while any are pending. Reveal adds the points; a
verdict that lands after the reveal is still counted, once. If Jev fails, the
answer is stored as unchecked with 0 points and the phone says "Could not be
checked". The **Rejudge** button turns red when any answer is unchecked; press
J to send them again (reveal also does this by itself). Answers under 15
characters are not sent to Jev and earn 0 ("Too short to earn points").

**Players.** A phone that reloads or loses signal rejoins with the same
player and score (the id is kept in the phone's `localStorage`). Tapping a
seat someone else holds takes it, and the first phone goes back to the join
screen. Names are cut to 20 characters and stripped of tags. The projector
shows first name and seat, or "Remote"; the last initial is only in the export.

## Questions

| # | Quarter | Kind | Seconds | Topic |
|---|---|---|---|---|
| 1 | 1st: Distortion | choice | 30 | what a lie factor of about 4 means, Fox News chart (Pew data) |
| 2 | 1st | choice | 30 | area of squares (defense budgets) |
| 3 | 1st | choice | 30 | time of possession baseline, Miami vs Akron, Oct 17 |
| 4 | 1st | open | 90 | the mining company's annual report chart (Tufte, p. 54); the reveal swaps in the redrawn chart |
| 5 | 2nd: Data-Ink and Data Types | choice | 30 | nominal column on the 2025 roster |
| 6 | 2nd | choice | 20 | class year as a variable type |
| 7 | 2nd | choice | 30 | ratio vs interval (attendance, temperature) |
| 8 | 2nd | choice | 30 | which element is data-ink |
| 9 | 3rd: Encodings and Color | choice | 20 | most accurate encoding (Cleveland and McGill) |
| 10 | 3rd | choice | 20 | diverging palette for point differential |
| 11 | 3rd | choice | 30 | red-green under simulated deuteranopia |
| 12 | 4th: Grammar of Graphics | choice | 30 | which variable is mapped to fill |
| 13 | 4th | choice | 30 | which layer changed (coordinates) |
| 14 | Two-Minute Drill | open | 90 | describe a chart in grammar-of-graphics terms |

Scoring: a right choice answer earns 2000 points if instant, falling linearly
to 1000 at the buzzer; a wrong answer earns 0. An open answer earns 2000 times
the share of rubric ideas it covers, with no speed component. The leaderboard
only moves at a reveal.

Every number in a prompt or option comes from `data/` with a `source_url`
(see `data/SOURCES.md`), and each question shows its source under the chart.

## Files

| Path | What it is | Served? |
|---|---|---|
| `index.html` | player page (phones) | yes |
| `host.html` | projector page, served at `/host` | yes |
| `questions.json` | public question data: prompt, chart, options, source; no answers, no rubrics | yes |
| `charts/*.svg` | the question charts | yes |
| `plan.svg`, `favicon.png`, `images/qr_*.png` | seat plan of FSB 2050 (from find-your-seat), icon, QR codes | yes |
| `api/*.js` | the API (Vercel functions) | as endpoints |
| `api/_game.js`, `_judge.js`, `_store.js` | game logic, Jev judge, Upstash helper (underscore files are not endpoints) | no |
| `api/_questions.json`, `api/_coach.json` | answer key and rubrics, read by the functions only | no |
| `content/questions.mjs` | the authored questions, with computed-answer checks | no |
| `build.mjs` | splits `content/questions.mjs` into `questions.json` and `api/_questions.json` | no |
| `make_charts.R` | draws `charts/*.svg` and writes `data/computed.json` | no |
| `data/` | source CSVs and `SOURCES.md` | no |
| `dev/`, `tests/` | local dev server with an in-memory store, tests | no |

`.vercelignore` keeps `content/`, `build.mjs`, `*.R`, `data/`, `dev/`,
`tests/`, `.env*` and `README*` out of the deployment.

To change a question: edit `content/questions.mjs`, run `Rscript make_charts.R`
if a chart or number changed, then `node build.mjs`, `npm test` and deploy.

## API

All JSON. `section` is `A`, `B` or `Z`; `q` is the 1-based question number
(0 in the lobby). Admin calls take the key in the `x-admin-key` header (or as
`key` in a POST body), never in the query string.

| Endpoint | Who | What |
|---|---|---|
| `POST /api/join` `{section, first, initial, seat, playerId?}` | phone | join or rejoin; `seat` is `L1-1` to `R3-7` or `remote` |
| `GET /api/state?section=A` | phone | public snapshot, cached 1 s by the Vercel CDN (`s-maxage=1`); phones poll it every 2 s |
| `GET /api/me?section=A&playerId=...` | phone | this player's points, rank and last result (never cached) |
| `POST /api/answer` `{section, playerId, q, answer}` | phone | option index (0-based) or text (cut to 600 characters); first answer counts |
| `POST /api/host` `{section, action}` + key | host | `open`, `close`, `reveal`, `rejudge`, `next`, `break`, `final`, `reset` |
| `GET /api/board?section=A` + key | host | everything the projector shows, polled every second |
| `GET /api/export?section=A[&run=3][&excel=1]` + key | Fadel | CSV, one row per answer |
| `POST /api/coach` | deck | the Class 16 "Describe a Chart in Grammar" coach, below |

## Export

One row per answer: `section, run, first, initial, seat, joined_at, q,
answer, correct, points, judged`. `run` defaults to the current run; pass
`run=` for an older one (the run number is on the host dock). `excel=1`
prefixes cells that start with `=`, `+`, `-` or `@` with an apostrophe for
opening in Excel; leave it off for R.

The key goes in a header, so read the export from R with httr2 (put the key
in the course `.Renviron` as `GD_ADMIN_KEY`):

```r
url = "https://isa401-game-day.vercel.app/api/export?section=A"
answers = httr2::request(url) |>
  httr2::req_headers("x-admin-key" = Sys.getenv("GD_ADMIN_KEY")) |>
  httr2::req_perform() |>
  httr2::resp_body_string() |>
  readr::read_csv()
```

## Rehearsal

- **No server:** `/host?section=A&demo=1` runs the whole game on the projector
  with 30 simulated players and no network, no key and no writes. Correct
  answers in demo mode are simulated, not the real key.
- **Live, on the test section:** open `/host?section=Z` with the key and join
  from one or more phones at `/?section=Z`. Section Z behaves exactly like A
  and B but has no QR code. Reset Z afterwards.

The dress rehearsal on Oct 19, 2026 (1 AM) played all 14 questions on section
Z with one host and three players (one remote), including a break, both open
questions judged by Jev and the export (3 players x 14 rows). Sections Z, A and
B were reset afterwards.

## Coach endpoint (Class 16 deck)

The deck's "Describe a Chart in Grammar" activity (the penguins facet chart)
posts to `POST /api/coach` with `{"activity":"c16-describe","text":"..."}`
and gets back `{status, ideas, note}`: `status` is `keep_going`,
`more_detail`, `revisit` or `done`; each idea is either met (with its label)
or not met (with a hint). Every string comes from the rubric in
`api/_coach.json`, never from the model.

- CORS allows `https://fmegahed.github.io`, `localhost`/`127.0.0.1` on any
  port, and `null` (a deck opened from a file). The deck sends `text/plain`,
  so there is no preflight.
- Texts under 15 characters get "Write a little more." without a Jev call.
- Identical texts (ignoring case and spacing) are answered from a 10-minute
  cache.
- Limits: 600 calls per address per minute, and `COACH_PER_DAY` Jev calls per
  UTC day for everyone (env var, default and current value 20000). Change the
  env var on Vercel and redeploy to raise or lower it. Past either limit the
  endpoint returns 429 `{error:"rate_limited"}`; when Jev fails it returns 503
  `{error:"unavailable"}`.

## Storage and the Upstash budget

Storage is the shared Upstash for Redis store that also backs Find Your Seat
(REST API, no SDK; `api/_store.js` reads `KV_REST_API_URL` and
`KV_REST_API_TOKEN`). Game Day keys all start with `gd:`, so they never touch
the other games' keys.

- `gd:{s}:cur` (hash: run, state, players, kicks; no expiry).
- Per run, 30-day expiry: `gd:{s}:{run}:players`, `:seats`, `:a:{q}`
  (answers), `:lb` (leaderboard), `:scored`, `:counted`.
- Rate limits: `gd:rl:*` (2-10 minute expiry). Coach: `gd:coach:c:*` (cache,
  10 minutes) and `gd:coach:day:{date}` (24 hours).

Estimated use for a 45-student section over the 14 questions: about 26,000
Redis commands (the snapshot behind the CDN about 1,200, `/api/me` about
16,000, answers about 5,000, host board polling 3,000-6,000, joins under
1,000), so about 52,000 per class day for both sections, plus 3 commands per
coach check. Check the monthly command limit of the store's plan in the
Upstash console before reusing the game on other days.

## Environment variables (Vercel, production)

| Name | What |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | the shared Upstash store |
| `JEV_API_KEY` | the Jev judge (same key as the course `.Renviron`) |
| `ADMIN_KEY` | host and export key |
| `COACH_PER_DAY` | daily cap on coach Jev calls (20000) |

## Deploy

```
vercel --yes --prod
```

from this folder (linked to `isa401-game-day`; the `.vercel/` folder is
gitignored). The project's Node.js version is 24.x. After a deploy, check that
`/api/_questions.json`, `/api/_coach.json`, `/content/questions.mjs` and
`/build.mjs` return 404.

## Local development

`npm test` runs the server and coach tests (in-memory store, Jev stubbed).
`npm run dev` starts `dev/server.js` on port 4030. It reads `.env.local` and
`JEV_API_KEY` from the course `.Renviron`. With no KV variables set it uses the
in-memory store (`GD_MEMORY=1` forces it). Its admin key is `ADMIN_KEY` from
`.env.local` (the production key), or `fall2026` when that file has none.
