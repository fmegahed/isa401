// Syntax check of the script inside index.html, so a broken page is caught before a deploy.
//   node tests/check_page.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "..", "index.html"), "utf8");
const js = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const tmp = path.join(os.tmpdir(), "isa401_review_page_check.mjs");
fs.writeFileSync(tmp, js);
try {
  execFileSync(process.execPath, ["--check", tmp], { stdio: "pipe" });
  console.log("index.html script: syntax ok");
} catch (e) {
  console.error("index.html script has a syntax error:\n" + String(e.stderr).split("\n").slice(0, 8).join("\n"));
  process.exit(1);
}
