# The Import Heist (ISA 401, Class 04 activity)

Live at https://isa401-import-heist.vercel.app

A three-stage data-import game framed as a security-incident investigation.
Students play the analyst on duty for ticket **INC-2026-0902**: an after-hours
VPN sign-in from abroad followed by a download burst on the FSB shared drive.
Each stage is a live URL serving one of the formats taught in Class 04 (CSV,
then JSON), and the value students extract from one file is the query-string
key that unseals the next. The game takes about six minutes in pairs and ends
with each team posting its name on the class Menti wall.

## Why it is built this way

- **Small data on purpose.** Every file is a few rows. Students can open any
  URL in a browser tab, read the raw file, and see the answer by eye before
  they import it in R. The point is the import workflow and the file formats,
  not the arithmetic.
- **Each stage asks a question an analyst would actually ask.** Identify the
  compromised account, scope what it took, close the ticket. The answer to one
  stage is precisely the thing you would need to open the next log, so the
  chain of three files makes narrative sense.
- **Hints are data too.** A wrong key or code never returns an error; it
  returns JSON with a `status` and a `hint` written in R terms (the exact call
  to run, `max()`, `==`, `sum()`, `nrow()`). Students import the hint the same
  way they import everything else.
- **Stateless.** No database and no accounts. The finish order lives on the
  Menti wall, so the app is three serverless functions and one HTML page.

## The storyline

At 02:14 the VPN gateway logs repeated failed sign-ins. At 02:31 a sign-in
succeeds from outside the United States without MFA. Between 02:32 and 02:56
the same account views and downloads files on the FSB shared drive, and the
session ends at 02:58. At 07:00 the ticket is escalated to the analyst on
duty. The incident, accounts, and files are fictional, and every IP address
comes from the ranges that [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737)
reserves for documentation (`192.0.2.0/24`, `198.51.100.0/24`,
`203.0.113.0/24`), so the game never points at a real machine.

## The three stages

### Stage 1: identify the compromised account (CSV)

`GET /api/stage1` serves last night's VPN sign-in log as CSV
(`Content-Type: text/csv`).

```r
logins = readr::read_csv("https://isa401-import-heist.vercel.app/api/stage1")
```

| account  | sign_in_time        | country       | source_ip    | failed_attempts | mfa |
|----------|---------------------|---------------|--------------|-----------------|-----|
| hallm7   | 2026-09-01 08:14:00 | United States | 192.0.2.41   | 0               | yes |
| patelr2  | 2026-09-01 09:02:00 | United States | 192.0.2.118  | 1               | yes |
| chenw4   | 2026-09-01 13:47:00 | United States | 192.0.2.77   | 0               | yes |
| oconnork | 2026-09-01 17:25:00 | United States | 192.0.2.203  | 2               | yes |
| nguyent9 | 2026-09-01 22:10:00 | United States | 192.0.2.156  | 0               | yes |
| smithj31 | 2026-09-02 02:31:00 | Romania       | 203.0.113.57 | 17              | no  |
| garciad5 | 2026-09-02 07:55:00 | United States | 192.0.2.92   | 1               | yes |

Question: which account shows a password-guessing pattern (the most failed
attempts before a successful sign-in)? Answer: **smithj31** (17 attempts,
02:31, Romania, no MFA). Teaching point: `read_csv` types `sign_in_time` as a
date-time and `failed_attempts` as a number straight from the URL, and
`logins$account[logins$failed_attempts == max(logins$failed_attempts)]` is
the Class 03 subsetting lesson applied to a real question.

### Stage 2: scope the damage (JSON)

`GET /api/stage2?key=ACCOUNT` serves that account's shared-drive activity as
pretty-printed JSON, so it is readable in a browser tab.

```r
log = jsonlite::fromJSON("https://isa401-import-heist.vercel.app/api/stage2?key=smithj31")
```

With the right key (case-insensitive, whitespace trimmed) the response is:

- `status`: `"UNLOCKED"`
- `account`: `"smithj31"`
- `briefing`: one paragraph that names the `events` element, says it has an
  `action` column with `VIEW`, `DOWNLOAD`, or `OVERWRITE`, and points to the
  finish URL
- `session`: `{start: "02:31", end: "02:58", source_country: "Romania",
  source_ip: "203.0.113.57", vpn_gateway_ip: "198.51.100.10", mfa: "no"}`
- `events`: 16 rows (`event, time, file, action, size_mb`) between 02:32 and
  02:57. `jsonlite` turns this array into a data frame, so `log$events` is
  the first nested-JSON-to-data-frame moment in the course.

Exactly six events are DOWNLOADs (28.1 MB in total): `dept_directory.xlsx`
(0.4), `finance/budget_fy26.xlsx` (2.1), `finance/payroll_fall2026.xlsx`
(5.6), `hr/employee_roster.csv` (1.3), `isa/isa401_grades_fall2026.xlsx`
(0.3), and `research/survey_responses_pii.csv` (18.4). Nine are VIEWs, and
the last event (02:57) is an OVERWRITE of `fsb_shared/README.txt`. The
overwrite does not change the finish code; it exists so the replay can show
the file being restored from the drive's version history (a Git moment the
students watch but do not type).

Question: how many of the events are DOWNLOADs? Answer: **6**, from
`sum(log$events$action == "DOWNLOAD")`.

Wrong or missing keys return `{status: "LOCKED", hint: ...}`:

- empty key: the exact `fromJSON` call with `?key=ACCOUNT` and where ACCOUNT
  comes from (`logins$account`)
- one of the six benign accounts: that person's alibi (time, country, failed
  attempts, MFA), then the recipe: print `logins`, find the largest
  `failed_attempts` with `max()`, use the account from that row
- anything else: not an account in the sign-in log; the key must be a value
  in `logins$account`, spelled as it appears there

### Stage 3: close the ticket (JSON)

`GET /api/finish?code=NUMBER`

```r
jsonlite::fromJSON("https://isa401-import-heist.vercel.app/api/finish?code=6")
```

The right code (**6**) returns `status: "CLEARED"` plus:

- `verdict`: one paragraph (password guessing, 17 failed attempts, sign-in
  from Romania at 02:31 without MFA, 6 files and 28.1 MB downloaded in 27
  minutes, including payroll, the employee roster, and survey responses with
  PII, and README.txt overwritten at 02:57 and restored from version history)
- `report`: a flat record (`incident`, `compromised_account`, `attack`,
  `source_country`, `source_ip`, `mfa_used`, `session_window`,
  `files_downloaded`, `data_downloaded_mb`, `highest_risk_file`,
  `files_overwritten`)
- `containment`: five actions (disable the account and reset credentials,
  require MFA on VPN, notify the owners of the six files starting with the
  PII export, block 203.0.113.57 and review sign-ins from outside the US,
  restore README.txt from version history)
- `replay`: `https://isa401-import-heist.vercel.app/replay` (see below)
- `message`: open the replay address in a browser, then post your team name
  on the Menti wall

Wrong codes return `{status: "WRONG_CODE", hint: ...}`:

- not a number: explains that `log$events$action == "DOWNLOAD"` gives a TRUE
  for every download and `sum()` counts them
- too high: you are probably counting every event (`nrow(log$events)`), run
  the comparison and look at the TRUEs and FALSEs, then `sum()` them
- too low: the full `sum(log$events$action == "DOWNLOAD")` recipe

## The replay (`/replay`)

The payoff. `replay.html` is an animated replay of the incident (about 70
seconds at the default speed),
built from the records in the two files the students imported (plus one
recovery scene that shows the drive's version history), and styled like the
ticket page. Students learn its address by reading the
CLEARED JSON (the `replay` field and the `message`), which is the point: the
reward is only visible to teams that read what they imported. Step 3 on the
ticket page mentions it as a fallback.

The page first asks for a team name (typed on the page, nothing stored or
sent anywhere), then plays seven scenes with a simulated clock in the corner:

1. **Intro**: INC-2026-0902, "Analyst on duty: TEAM".
2. **VPN gateway**: 17 FAILED sign-in lines for smithj31 from 203.0.113.57,
   one every 62 simulated seconds from 02:14:07, accelerating on screen, with
   a large failed-attempts counter; then the 02:31:22 SUCCESS line, `mfa=no`.
3. **Route**: a map of the North Atlantic with two pins, Romania
   (203.0.113.57, the `source_ip` from both files) and Oxford, Ohio
   (198.51.100.10, the `vpn_gateway_ip` from stage 2); an arc draws itself
   from one to the other, then four fact cards (account, 17 failed before
   success, no MFA challenge, "what the gateway saw: a valid password"). On
   screens narrower than 640 px the in-map labels are hidden and the same
   two location/IP lines appear under the map instead.
4. **Shared drive**: the ten files in the session; the 16 events play at
   0.7 s each, VIEWs flash tan, DOWNLOADs flash yellow and stay red, the
   final OVERWRITE turns README.txt solid red with an "overwritten" tag, each
   download adds a size bar on the right (scaled to the 18.4 MB PII file)
   while the counters climb to 6 files and 28.1 MB; ends with "02:58:03
   session ended. 27 minutes, 6 downloads, 1 file overwritten."
5. **Escalation and the analyst's console**: 07:00:00, the R code the
   students ran types itself out with its results (`"smithj31"`, `6`,
   `"CLEARED"`). The console is styled like the deck's code blocks (Tomorrow
   Night Bright on `#222222`, the colors from
   `style_files/code-tomorrow-night-bright.css`, rainbow brackets), with a
   small in-page R highlighter that mirrors `style_files/hl_r.R`. The code
   uses the native pipe and `pkg::fun()` for the non-base functions
   (`"URL" |> readr::read_csv()`, `"URL" |> jsonlite::fromJSON()`), the
   subsetting line is tagged `# subsetting`, and the answers come from
   `(log$events$action == "DOWNLOAD") |> sum()` and `report$status`.
6. **Recovery**: 07:04:00, "One more entry in the log: 02:57, README.txt,
   OVERWRITE. The shared drive is versioned." A shell console types `git log
   --format="%h %an %s" -- fsb_shared/README.txt` (two commits: smithj31's
   "update README" and it-admin's original), `git diff` between them (the
   README line replaced by a fictional ransom-style note pointing at
   203.0.113.57), `git restore --source=<original> -- fsb_shared/README.txt`,
   and `git commit -m "restore README.txt (INC-2026-0902)"`. Students watch
   it; nothing in the game asks them to type Git. The commit hashes and diff
   text are story, not data from the imported files, and the footer says so.
7. **Incident report**: the CLEARED stamp, the report fields one by one
   (including "overwritten: README.txt, restored from history"), the five
   containment actions checking off, "Closed by TEAM", the Menti reminder,
   and Replay / Back to the ticket buttons.

A control bar under the stage appears once the replay starts: speed buttons
(0.5x, 0.75x, 1x, 1.5x, 2x) and Pause / Resume. Both take effect
immediately, mid-scene, because the timeline runs on a virtual clock: every
`at(ms, fn)` call goes into a queue and a `requestAnimationFrame` loop
advances the clock by `elapsed * rate / PACE` and fires whatever is due.
`PACE = 1.25` stretches the authored timings by a quarter (the "1x" the
students see), so to make the default faster or slower change that one
constant; the speed buttons multiply on top of it. The arc animation on the
map is the only CSS transition whose duration is tied to the speed. A
background tab does not skip ahead when it returns (frame steps are capped at
250 ms).

No audio, no libraries, no external assets beyond the Google Fonts used by
the ticket page. Scene lengths are the `t += ...` lines in `play()`; the
event and console data sit at the top of that script and must match
`api/stage2.js` and the solution. On phones the stage grows with the active
scene instead of clipping.

## The landing page (`/`)

`index.html` is the incident ticket for the projector and for students'
laptops. It follows the Miami University Brand Identity Guide (v.2, pp. 28-34):
Miami Red `#C41230` and white as the predominant colors, Light Tan `#EDECE2`,
Medium Tan `#CCC9B8`, and Dark Tan `#70685C` as secondary, Medium Gray
`#666666` for the footer, and Corn Yellow `#EFDB72` only for the two
placeholders students replace (ACCOUNT, NUMBER). No tints or shades. Type is
Source Serif 4 for the headline (an approved digital alternate), Arial for
body text, and Source Code Pro for code.

Sections, top to bottom: a red band ("FSB Security Operations Center | ISA
401", blinking "Monitoring"), the headline "Incident INC-2026-0902" with a
"Severity: High" ribbon, the ticket text (what is known, what is not, and
that security tools export CSV/JSON files which are served at a URL here so
students can practice importing them), a typewriter-animated incident log,
a **Rules of engagement** box ("Browser first, R second": open every URL in
a new tab and read the raw file before importing it; every reply is data;
work in pairs in your markdown), then the three-step evidence chain with the
exact `read_csv` and `fromJSON` calls. Each step has an "Open it in a new
tab" link (stage 1 shows the CSV; stage 2 and finish without a key or code
show their sealed-state hints, which is itself the lesson), and step 3 says
the CLEARED report links the replay. The footer notes that everything is
fictional. Code blocks scroll horizontally inside their own box, so the page
works on a phone.

## Where it appears in the deck

Slide "The Import Heist: Game" in `lectures/04_data_import_export/` (Part 3,
six-minute countdown): a Case tab with the story, the three step cards with
the full URLs, the ticket hyperlink, and rules of engagement (open each URL in
a browser tab first, read every hint, glimpse everything), and an Answer tab
whose chunk evaluates against the live app at knit time. Knitting therefore
needs network access.

## Solution (instructor)

```r
logins = readr::read_csv("https://isa401-import-heist.vercel.app/api/stage1")
logins$account[logins$failed_attempts == max(logins$failed_attempts)]  # "smithj31"
log = jsonlite::fromJSON("https://isa401-import-heist.vercel.app/api/stage2?key=smithj31")
sum(log$events$action == "DOWNLOAD")                                   # 6
jsonlite::fromJSON("https://isa401-import-heist.vercel.app/api/finish?code=6")$status  # "CLEARED"
```

## Files

```
games/data-import/
  index.html       incident ticket page served at /
  replay.html      animated incident replay served at /replay
  vercel.json      { "cleanUrls": true } so replay.html answers at /replay
  api/stage1.js    VPN sign-in log (CSV)
  api/stage2.js    shared-drive activity for ?key=ACCOUNT (JSON), alibis, hints
  api/finish.js    verdict, report, containment, replay link for ?code=NUMBER (JSON), hints
  make_map.py      regenerates the coastline path inside replay.html (a helper, not part of the game)
  README.md        this file
```

To change the answers, edit `KEY` in `api/stage2.js` (and the `ALIBIS` map)
and `CODE` in `api/finish.js`; keep the stage-1 CSV, the `EVENTS` table, and
the `verdict`/`report` text consistent with them. The IP addresses appear in
`api/stage1.js`, `api/stage2.js`, `api/finish.js`, and the replay's VPN log
lines, map labels, and legend; if you change them, stay inside the RFC 5737
ranges.

**The map.** The coastline in `replay.html` is a single inline SVG path
(about 32 KB) generated by `make_map.py` from Natural Earth 1:110m land
(public domain), taken from the `world-atlas` npm package
(`https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json`). The
script decodes the TopoJSON, projects it with a plain equirectangular
projection cropped to longitude -100..35 and latitude 22..62, and prints the
path plus the pixel coordinates of Oxford and Bucharest, which are the pin
and arc endpoints in the SVG (`viewBox 0 0 500 200`). Run
`python make_map.py land-110m.json map_path.txt` and paste the output into
the `d` attribute of the `<path clip-path="url(#mapclip)" ...>` element to
regenerate it; there are no external assets at run time.

## Deployment and maintenance

**Where it runs.** Vercel, under Fadel's account (`fmegahed`), project
`isa401-import-heist`. Production alias: https://isa401-import-heist.vercel.app.
Each deploy also gets its own `isa401-import-heist-<hash>.vercel.app` preview
URL, but only the production alias is referenced in the deck, the landing
page, and the hints, so keep that alias as it is.

**How it is deployed.** From the Vercel CLI, not from GitHub. The project is
not connected to the `isa401` repository, so committing or pushing changes
does nothing to the live site; a deploy happens only when the CLI is run
from this folder:

```powershell
cd "games\data-import"
npx vercel --prod
```

`npx` fetches the CLI on demand (it is not installed globally). The first
run on a new machine asks you to sign in (browser flow) and to link the
folder to the existing project: answer "link to existing project" and pick
`isa401-import-heist`. The link is stored in `.vercel/project.json`
(`projectName`, `projectId`, `orgId`); that folder and `.env.local` (a CLI
token) are gitignored by the local `.gitignore`, so a fresh clone has to
link once before its first deploy.

**Almost zero config.** No build step and no dependencies: `index.html` is
served at `/`, `replay.html` at `/replay` (the only setting in `vercel.json`
is `cleanUrls: true`, which drops the `.html`), and every file in `api/` is
a Node.js serverless function reached at `/api/<name>` (CommonJS
`module.exports = (req, res) => {...}`; query parameters are on `req.query`).
Editing a file and redeploying is the whole workflow. The CSV endpoint sends
`Cache-Control: public, max-age=300`, so a changed stage-1 log can take up to
five minutes to show for someone who just loaded the old one.

**Checking a deploy.** Open the three URLs in a browser (`/api/stage1`,
`/api/stage2?key=smithj31`, `/api/finish?code=6`) and confirm the CSV, the
`UNLOCKED` JSON, and `CLEARED`; open `/replay`, enter a name, and let it run
to the report; then re-knit the Class 04 deck, whose Answer
tab runs the solution above against production. Logs and past deployments
are in the Vercel dashboard for the project (Deployments tab; a previous
deployment can be promoted back to production from there if a change breaks
something).

**Reusing the game in a later semester.** Update the dates in `api/stage1.js`
(the sign-in times) and the incident id `INC-2026-0902` in `index.html`,
`replay.html`, `api/finish.js`, and the deck; if the class Menti wall changes, nothing in
the app needs to change (the finish message only says to post on the wall).
