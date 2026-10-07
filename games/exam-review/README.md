# Exam 01 Review (ISA 401, Fall 2026)

Live at https://isa401-review.vercel.app. Design: `docs/superpowers/specs/2026-10-06-exam01-review-design.md`.

Ten units covering Classes 01 to 13. Each unit reviews an idea, asks for an explanation in the
student's own words (checked while they type by the Jev model), gives broken R code to fix (R runs
in the browser with webR), and asks them to read an output. Every question is tagged with skills from
the Job Scout database. Ungraded, no sign-in, no names.

## Change a question

1. Edit `content/units.mjs`. An idea is `idea(label, hint, claim)`: the label is shown once the
   student covers it, the hint is behind the "?", and the claim is what Jev is asked about.
2. `node build.mjs`
3. `node tests/run.mjs <id-prefix> --repeat 3` until every sample answer is judged as expected.
   Keep each claim to one condition; claims that bundle two conditions are judged too strictly.
4. `"C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" tests/check_code.R` if a code task changed.
5. `node tests/check_page.mjs` and `node tests/check_style.mjs` if `index.html` changed.
6. `python tests/check_coverage.py`: fails if the review names a function that was not written in
   class (the `isa401a` markdowns plus the Class 13 demo chunk) and is not on its kept list.
   After Class 13 is pushed, add `classCode("class13.Rmd")` to the tidy unit's links.
7. `npx vercel --prod`

## Change a recap clip

1. Edit the drawing in `content/recap.mjs`. To change what is said, edit `recap/scripts.md` first
   (the approved text) and make the `say` strings match it.
2. `node make_recap.mjs --check` checks the text, the cues and the layout without generating audio.
3. `node make_recap.mjs` regenerates only the clips whose narration changed (ElevenLabs, voice
   Juniper, speed 0.8; `ELEVENLABS_API` in the course `.Renviron`). Drawing changes cost nothing.
4. `node build.mjs`, then deploy.

## Run it locally

`node dev/server.js`, then http://localhost:4020. It reads `JEV_API_KEY` from the course
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

`npx vercel --prod` from this folder (project `isa401-review`, scope `fadel-megaheds-projects`; git
commits do not deploy). Environment variables: `JEV_API_KEY`, `KV_REST_API_URL`,
`KV_REST_API_TOKEN`, `ADMIN_KEY`. `.vercelignore` keeps `content/`, `tests/`, `dev/` and the build
scripts off the site; `api/_rubrics.json` is bundled with the functions and never served.
