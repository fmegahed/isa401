// Tests the soft style check in index.html: our own solutions and starters must draw no style
// notes, and code that breaks a course convention must draw the matching note. For Exam 02 it
// checks the course style of the copy (no em dash, "nominal" not "categorical") and that the
// review has no R tasks.
//   node tests/check_style.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "..", "index.html"), "utf8");
const a = html.indexOf("const PKG = {"), b = html.indexOf("function codeStep(");
// the block between the two markers is our own code from index.html (PKG, BARE, styleNotes)
const styleNotes = new Function(html.slice(a, b) + "\nreturn styleNotes;")();
const units = JSON.parse(fs.readFileSync(path.join(here, "..", "units.json"), "utf8"));

let bad = 0;
const expect = (name, code, wanted) => {
  const notes = styleNotes(code);
  const ok = wanted.length === notes.length && wanted.every((w, i) => notes[i].includes(w));
  if (!ok) { bad += 1; console.log(`FAIL ${name}: expected ${wanted.length} note(s) ${JSON.stringify(wanted)}, got ${notes.length}\n     ${notes.map((n) => n.slice(0, 90)).join("\n     ")}`); }
  else console.log(`ok   ${name}`);
};

for (const u of units) for (const s of u.steps) if (s.type === "code") {
  expect(s.id + " solution", s.solution, []);
  expect(s.id + " starter", s.starter, []);
}
expect("arrow assignment draws no note", 'x <- c(1, 2)\nmean(x)', []);
expect("right arrow at the end of a pipe draws no note", 'page |> rvest::html_elements("h2") |> rvest::html_text2() -> title', []);
expect("old pipe", 'jobs %>% head()', ["native pipe"]);
expect("setwd", 'setwd("C:/Users/me")', ["No <code>setwd()</code>"]);
expect("library", 'library(dplyr)\njobs |> dplyr::count(category)', ["You loaded a package"]);
expect("bare verbs", 'jobs |>\n  filter(category == "fulltime") |>\n  dplyr::count(location_state)', ["<code>filter()</code> as <code>dplyr::filter()</code>"]);
expect("bare verb listed once", 'a |> mutate(x = 1) |> mutate(y = 2)', ["<code>mutate()</code> as <code>dplyr::mutate()</code>"]);
expect("prefixed is fine", 'crashes |> tidyr::separate(fatalities, into = c("a", "b"))', []);
expect("words in strings and comments are ignored", 'x = "use filter(x) <- here"   # library(dplyr) %>% setwd()\nnchar(x)', []);
expect("comparison with a negative number", 'sum(x < -1)', []);
expect("column named like a function", 'df$count\ndf |> dplyr::arrange(dplyr::desc(count))', []);
expect("bare verb at the start of a line", 'filter(jobs, remote == 1)', ["<code>filter()</code> as <code>dplyr::filter()</code>"]);
expect("prefixed call after a pipe on a new line", 'jobs |>\n  dplyr::filter(remote == 1) |>\n  dplyr::count(category)', []);
expect("everything at once", 'library(dplyr)\nx <- jobs %>% filter(remote == 1)', ["native pipe", "You loaded a package"]);

// ---- Exam 02: course style in the copy, and no R in a review of an exam that has none ----------
const check = (name, ok, detail = "") => { if (ok) console.log(`ok   ${name}`); else { bad += 1; console.log(`FAIL ${name}${detail ? "\n     " + detail : ""}`); } };
const u2file = path.join(here, "..", "units_exam02.json");
if (!fs.existsSync(u2file)) check("units_exam02.json exists (run node build.mjs)", false);
else {
  const u2 = JSON.parse(fs.readFileSync(u2file, "utf8"));
  const steps2 = u2.flatMap((u) => u.steps);
  const code2 = steps2.filter((s) => s.type === "code").map((s) => s.id);
  check("Exam 02 has no R code tasks (the exam has none, so nothing there starts webR)", !code2.length, code2.join(", "));
  // what students read in Exam 02, without ChatGPT's verbatim answers (quoted as they came)
  const copy = JSON.stringify(u2.map((u) => ({ ...u, steps: u.steps.map((s) => (s.ai ? { ...s, ai: { ...s.ai, answer: "" } } : s)) })));
  const EM = String.fromCharCode(0x2014);
  check("no em dash in the Exam 02 copy or in index.html", !copy.includes(EM) && !html.includes(EM));
  // the games and decks say "nominal" (Stevens' levels), never "categorical"
  const cat = [...new Set((copy.match(/[^.<>]{0,40}categorical[^.<>]{0,30}/gi) || []))];
  check('Exam 02 copy says "nominal", not "categorical"', !cat.length, cat.slice(0, 3).join(" | "));
  const r = steps2.filter((s) => /webR|\bRun\b the code/i.test(JSON.stringify(s))).map((s) => s.id || s.title);
  check("no Exam 02 step asks for R or webR", !r.length, r.join(", "));
}

console.log(bad ? `\n${bad} style check(s) failed` : "\nAll style checks behave as intended.");
process.exit(bad ? 1 : 0);
