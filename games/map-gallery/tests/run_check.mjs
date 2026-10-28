// Live check of the OpenAI pin checker on tests/shots/test_map.png with pins drawn by the browser:
// pass a JPEG data URL file made by the page (see README), or run with no file to send the plain map.
//   node tests/run_check.mjs [composite.txt]
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
for (const l of fs.readFileSync(new URL("../../../.Renviron", import.meta.url), "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }
const V = require("../api/_vision.js");
const file = process.argv[2];
const image = file ? fs.readFileSync(file, "utf8").trim() : "data:image/png;base64," + fs.readFileSync(new URL("./shots/test_map.png", import.meta.url)).toString("base64");
const pins = [
  { kind: "Butler", text: "Butler outlined in black so it stands out" },
  { kind: "Title or text", text: "Title says the takeaway" },
  { kind: "Change over time", text: "Small line chart of weekly cases next to the legend" },
  { kind: "Change over time", text: "Line chart of weekly cases for Butler vs Ohio" },
];
const t = Date.now();
console.log(JSON.stringify(await V.checkPins(image, pins), null, 1), (Date.now() - t) + " ms");
