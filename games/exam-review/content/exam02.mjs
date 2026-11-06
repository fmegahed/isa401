// Content of the Exam 02 review (Classes 15 to 22), split by build.mjs.
// Design: docs/superpowers/specs/2026-11-04-exam02-review-design.md; plan:
// docs/superpowers/plans/2026-11-04-exam02-review.md. No R tasks in this exam.
//
//   content/exam02_units.mjs     the nine content units (every AI answer is a real, recorded ChatGPT run)
//   content/exam02_replays.mjs   "Replay the games" (built from the games' own files; kept out of git
//                                until after Class 22 because it holds Race Call's answers)
//
// Step kinds:
//   read     { title, html }
//   explain  { id, title, prompt, ideas, wrong, tests, charts?, ai?, context? }
//            charts: [{ src, alt, caption }]   ai: { prompt, answer, date, video, seconds }
//   choice   { id, title, prompt, charts, options, answer, why, source, game, stats }   (replays)
//   task     { title, html, check }   (build practice and redo cards; not scored)

import fs from "node:fs";
import units from "./exam02_units.mjs";
const replays = fs.existsSync(new URL("./exam02_replays.mjs", import.meta.url))
  ? (await import("./exam02_replays.mjs")).default : [];

export default [...units, ...replays];
