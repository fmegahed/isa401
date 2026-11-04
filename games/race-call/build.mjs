// Splits the authored content (content/questions.mjs) into what phones and the projector may see
// before a reveal and what stays on the server until then:
//   questions.json          public: block, prompt, chart or anim, options, source
//   api/_questions.json     server only: answer index, call headline, takeaway, reveal chart,
//                           contrast chart (extra) and its caption
//   charts/r-<hash>.svg     the reveal and contrast charts, copied from reveal/ under names nobody
//                           can guess before the server hands them out at the reveal
//   node build.mjs          (run make_charts.R first; it writes data/computed.json and reveal/)
import fs from "node:fs";
import crypto from "node:crypto";
import questions, { BLOCKS } from "./content/questions.mjs";

const fail = (m) => { console.error("BUILD ERROR: " + m); process.exit(1); };
const ids = new Set();
const pub = [], server = [];
const ANIMS = ["gapminder", "ohio"];
const ANIM_FILE = { gapminder: "charts/gapminder.json", ohio: "charts/ohio_weeks.json" };

// old hashed reveal charts go first, so a renamed chart never lingers
for (const f of fs.readdirSync("charts")) if (/^r-[0-9a-f]{12}\.svg$/.test(f)) fs.unlinkSync("charts/" + f);

questions.forEach((q, i) => {
  if (!q.id || ids.has(q.id)) fail(`missing or duplicate id at position ${i + 1}`);
  ids.add(q.id);
  if (!BLOCKS[q.block]) fail(`${q.id}: block`);
  if (!q.prompt || !q.source || !q.call || !q.takeaway) fail(`${q.id}: prompt, source, call and takeaway are required`);
  if (!(q.seconds >= 10 && q.seconds <= 60)) fail(`${q.id}: seconds`);
  if (!q.chart === !q.anim) fail(`${q.id}: exactly one of chart or anim`);
  if (q.chart && !fs.existsSync(q.chart)) fail(`${q.id}: ${q.chart} not found (run make_charts.R)`);
  if (q.anim && (!ANIMS.includes(q.anim) || !fs.existsSync(ANIM_FILE[q.anim]))) fail(`${q.id}: anim ${q.anim}`);
  if (q.revealAnim && (!ANIMS.includes(q.revealAnim) || !fs.existsSync(ANIM_FILE[q.revealAnim]))) fail(`${q.id}: revealAnim`);
  if (q.extraAnim && (!ANIMS.includes(q.extraAnim) || !fs.existsSync(ANIM_FILE[q.extraAnim]))) fail(`${q.id}: extraAnim`);
  if ((q.reveal || q.revealAnim) && (q.extra || q.extraAnim)) fail(`${q.id}: an annotated reveal or a contrast chart, not both`);
  if ((q.extra || q.extraAnim) && !(typeof q.extraCap === "string" && q.extraCap.length >= 8 && q.extraCap.length <= 70)) fail(`${q.id}: extraCap (8 to 70 characters) is required with a contrast chart`);
  if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => typeof o !== "string" || !o)) fail(`${q.id}: 4 options`);
  if (new Set(q.options).size !== 4) fail(`${q.id}: duplicate options`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) fail(`${q.id}: answer index`);
  if (typeof q.check !== "function" || !q.check()) fail(`${q.id}: computed answer check failed`);
  // the takeaway must not be readable from the public file
  if (q.prompt.length > 170) fail(`${q.id}: prompt is ${q.prompt.length} characters (max 170)`);
  if (q.takeaway.length > 260) fail(`${q.id}: takeaway is ${q.takeaway.length} characters (max 260)`);
  const hashed = (file) => {
    if (!file) return null;
    if (!fs.existsSync(file)) fail(`${q.id}: ${file} not found (run make_charts.R)`);
    const buf = fs.readFileSync(file);
    const h = crypto.createHash("sha256").update(buf).update(q.id).digest("hex").slice(0, 12);
    const out = `charts/r-${h}.svg`;
    fs.writeFileSync(out, buf);
    return out;
  };
  const reveal = hashed(q.reveal), extra = hashed(q.extra);
  const base = { id: q.id, block: q.block, seconds: q.seconds };
  pub.push({ ...base, prompt: q.prompt, chart: q.chart || null, anim: q.anim || null, options: q.options, source: q.source });
  server.push({ ...base, options: 4, answer: q.answer, call: q.call, takeaway: q.takeaway,
                reveal, revealAnim: q.revealAnim || null, extra, extraAnim: q.extraAnim || null, extraCap: q.extraCap || null });
});

const text = JSON.stringify([pub, server]);
if (text.includes(String.fromCharCode(0x2014))) fail("em dash found");
if (/categorical/i.test(text)) fail("'categorical' found");
const pubText = JSON.stringify(pub);
for (const s of server) if (pubText.includes(s.takeaway.slice(0, 40))) fail(`${s.id}: takeaway leaked into the public file`);
for (const s of server) if (s.extraCap && pubText.includes(s.extraCap)) fail(`${s.id}: extraCap leaked into the public file`);

fs.writeFileSync("questions.json", JSON.stringify({ blocks: BLOCKS, questions: pub }, null, 1));
fs.writeFileSync("api/_questions.json", JSON.stringify(server, null, 1));
console.log(`${pub.length} questions in ${Object.keys(BLOCKS).length} blocks; ${server.filter((s) => s.reveal).length} annotated reveal charts and ${server.filter((s) => s.extra).length} contrast charts copied`);
