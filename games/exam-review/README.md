# ISA 401 Review (Fall 2026)

Live at https://isa401-review.vercel.app: one practice review per exam, each with its own units,
address (`#/exam01`, `#/exam02`) and saved progress (`isa401_exam01_review_v1`, `isa401_exam02_review_v1`).

## Exam 01

Design: `docs/superpowers/specs/2026-10-06-exam01-review-design.md`.

Ten units covering Classes 01 to 13. Each unit reviews an idea, asks for an explanation in the
student's own words (checked while they type by the Jev model), gives broken R code to fix (R runs
in the browser with webR), and asks them to read an output. Every question is tagged with skills from
the Job Scout database. Ungraded, no sign-in, no names.

### Change a question

1. Edit `content/units.mjs`. An idea is `idea(label, hint, claim)`: the label is shown once the
   student covers it, the hint is behind the "?", and the claim is what Jev is asked about.
2. `node build.mjs`
3. `node tests/run.mjs <id-prefix> --repeat 3` until every sample answer is judged as expected.
   For a build step: `node tests/run_builds.mjs <id-prefix> --repeat 3` (the numbers in code, then each stand-in screenshot in `tests/build_shots/` through Jev; `--numbers` skips the API).
   Keep each claim to one condition; claims that bundle two conditions are judged too strictly.
4. `"C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" tests/check_code.R` if a code task changed.
5. `node tests/check_build.mjs`, `node tests/check_page.mjs` and `node tests/check_style.mjs` (see Checks below).
6. `python tests/check_coverage.py`: fails if the review names a function that was not written in
   class (the `isa401a` markdowns plus the Class 13 demo chunk) and is not on its kept list.
   After Class 13 is pushed, add `classCode("class13.Rmd")` to the tidy unit's links.
7. `npx vercel --prod`

### Change a recap clip

1. Edit the drawing in `content/recap.mjs`. To change what is said, edit `recap/scripts.md` first
   (the approved text) and make the `say` strings match it.
2. `node make_recap.mjs --check` checks the text, the cues and the layout without generating audio.
3. `node make_recap.mjs` regenerates only the clips whose narration changed (ElevenLabs, voice
   Juniper, speed 0.8; `ELEVENLABS_API` in the course `.Renviron`). Drawing changes cost nothing.
4. `node build.mjs`, then deploy.

Exam 02's nine clips work the same way with `--exam exam02` (`content/recap_exam02.mjs`,
`recap/scripts_exam02.md`), plus animated charts: a board item `{ sketch, at, phases, until, box }`
draws one of the sketches in `recap_sketches.js` (each is a function of the audio clock, so the slider
and speed control work), starting at the cue `at`, moving on at each cue in `phases`, and fading out at
`until`. `make_recap.mjs` checks each cue and that no text line runs into a sketch.
To look at a clip before paying for audio: `node make_recap.mjs --exam exam02 --preview [clip]` (never
calls ElevenLabs; a clip without cached audio gets estimated timings in `recap/preview/`, which
`.vercelignore` keeps off the site), then `RECAP_PREVIEW=1 node build.mjs` and open the unit locally
(silent, captions only). Run plain `node build.mjs` before deploying; `tests/check_page.mjs` warns if
the build is a preview build.

## Exam 02

Design: `docs/superpowers/specs/2026-11-04-exam02-review-design.md`; plan:
`docs/superpowers/plans/2026-11-04-exam02-review.md`. Classes 15 to 22, no R and no webR. Content is
in `content/exam02.mjs`, built into `units_exam02.json`; written questions share `api/_rubrics.json` and
`tests/cases.json` with Exam 01. Step ids start with `x2-`. Step kinds beyond Exam 01's:

| Kind | Fields | On the page |
|---|---|---|
| `explain` with `charts` and `ai` | `charts: [{src, alt, caption}]`, `ai: {prompt, answer, date, video, seconds}`, `context` (required with charts: what Jev is told the chart and the AI said) | "Check the AI": the chart, our prompt, ChatGPT's answer word for word (always on the page as text), the date, and "Watch the recording (N s)", which opens a `<video controls preload="none">` |
| `choice` | `id, title, prompt, charts, options` (plain text), `answer` (0-based), `why` (html), `source`, `game`, `stats` | "Replay": radio buttons, Check, right or wrong, the why, the source and "How the class answered"; checked in the browser, the pick is saved and shown again on a revisit |
| `task` | `title, html, check` | "Try it": a task and a "Check your work" button; not scored |
| `build` | `title, html, numbers` (each `prompt, label, hint, shown, msg` plus the answer from `content/build_answers.json`), `shots` (each `label, hint, ask, yes, no`), `example`, `shotTests` | "Build it": a real CSV to download, number boxes, and a screenshot of the student's chart (paste, drop or choose a file). `api/build.js` checks the numbers in code (a known wrong value, such as counting rows instead of players, gets its own message) and asks Jev yes-or-no questions about the screenshot (`api/_build.js`), first "is this a chart at all?". Images are a TypeSafe "Danger Zone" feature, so each request sends `TypeSafe-Danger-Zone-Images: true`, and the page calls the chart check experimental. The page sees only neutral prompts and hints; the labels (which state the answers), the answers and the example chart come from the server once a check is met. The screenshot is not stored. |

Build data: `make_exam02_builds.R` writes the four practice files in `exam02/data/` (NBA per game, Columbus Airbnb, analytics pay, flights from Ohio), the answers in `content/build_answers.json` (never served), the stand-in screenshots in `tests/build_shots/` and the example charts `exam02/charts/build_*_example.png`.

Media: `exam02/charts/` (`make_exam02_charts.R`), `exam02/rec/` (the ChatGPT screen recordings),
`exam02/data/`, `exam02/replays/<game>/` (copied by the build). `_sample.png` and `_sample.mp4` are
placeholders for the sample unit.

### Replay the games

`content/exam02_replays.mjs` builds the last unit from the games' own files each time `node build.mjs`
runs: Game Day (`games/game-day/content/questions.mjs`; its two open questions are checked by Jev with
the game's rubric, then show the strong answer from the reveal), Pie on Trial (the six charts drawn from
`games/pie-on-trial/data.js`), Race Call (`games/race-call/content/questions.mjs`, `charts/`,
`reveal/`; race 8 was an animation and is one still frame here), and redo cards for Press Time
(`games/press-time/api/_key.json`, `_copy.json`) and the Map Gallery (`games/map-gallery/api/_rubric.json`,
Butler County's rate from `data/ohio_covid_weekly.csv`). Media are copied to `exam02/replays/<game>/`.

**Race Call's answers stay out of git until Class 22 has ended (Mon Nov 9, 2026):** `.gitignore` lists
`units_exam02.json`, `content/exam02_replays.mjs` and `exam02/replays/race-call/`. Remove those lines
after that class, before the release.

### Where the class slipped

`dev/pull_mistakes.mjs` reads each game's `/api/export` for sections A and B and writes
`data/game_mistakes.json` (counts only: share right, number of answers, most common wrong answer; no
names). Fadel runs it, with the key in the environment, then rebuilds:

    ADMIN_KEY=... node dev/pull_mistakes.mjs                  # Game Day, Race Call, Press Time, Map Gallery
    GAMES=race-call ADMIN_KEY=... node dev/pull_mistakes.mjs  # after Class 22, Race Call only
    node build.mjs

Game URLs default to the live sites (`GAME_DAY_URL` and the like override them); `RUN_GAME_DAY_A=3`
reads an older run than the current one. Pie on Trial has no export, so its replays show no class counts.

## Checks

- `node tests/check_build.mjs` runs the build, then checks that `units.json` is byte-identical to the
  committed file, no public JSON has a rubric key, every Exam 02 written question has a rubric and test
  answers, every chart, recording and linked file exists, every choice answer is a valid index, and
  there is no ChatGPT chat link and no em dash in student-facing copy.
- `node tests/check_page.mjs` opens the page in headless Chromium (playwright-core, from the npx cache
  of the Playwright plugin) against `dev/server.js` on port 4027, with `/api/*` answered locally. It
  compares every Exam 01 page with `tests/exam01_pages.json` (record a new reference with
  `--update-exam01` only after an intended Exam 01 change), checks the Exam 02 home, an AI block, a
  replay (right, wrong, saved, revisited), a task, separate progress keys, and no sideways scroll at
  375 px. `--shots <folder>` also saves screenshots of every Exam 02 page.
- `node tests/check_style.mjs`: the R style notes, and for Exam 02 no R tasks, no em dash, and
  "nominal" rather than "categorical".

## Run it locally

`node dev/server.js`, then http://localhost:4020 (Exam 02: http://localhost:4020/#/exam02). It serves
video with byte ranges, as Vercel does. It reads `JEV_API_KEY` from the course
`.Renviron` and the shared store from `.env.local`.

## What students reported

    curl -H "Authorization: Bearer <ADMIN_KEY>" https://isa401-review.vercel.app/api/report

returns the saved reports (anonymous answer, verdict, comment) and, under `stats`, how often each
question was checked, completed for the first time, and revealed.

## Rebuild the data

- `python make_jobs.py` (isa401 conda env): `jobs.json` from `data/scout.db`.
- `Rscript make_data.R` (R 4.6.1): the practice files in `data/`. Needs network and `FRED_API_KEY`.
- `Rscript make_outputs.R`: real console output for the "Read the output" questions (`content/outputs.json`).

## Deploy

`npx vercel --prod` from this folder, only on Fadel's OK (project `isa401-review`, scope `fadel-megaheds-projects`; git
commits do not deploy). Environment variables: `JEV_API_KEY`, `KV_REST_API_URL`,
`KV_REST_API_TOKEN`, `ADMIN_KEY`. `.vercelignore` keeps `content/`, `tests/`, `dev/` and the build
scripts off the site; `api/_rubrics.json` is bundled with the functions and never served.
