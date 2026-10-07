// Tests the soft style check in index.html: our own solutions and starters must draw no style
// notes, and code that breaks a course convention must draw the matching note.
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

console.log(bad ? `\n${bad} style check(s) failed` : "\nAll style checks behave as intended.");
process.exit(bad ? 1 : 0);
