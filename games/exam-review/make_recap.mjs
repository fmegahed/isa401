// Builds the recap clips: narration audio (ElevenLabs) and, for each clip, a file that says what is
// drawn on the whiteboard and when.
//   node make_recap.mjs --check     check the text, the cues and the layout; no audio is generated
//   node make_recap.mjs             generate (only clips whose narration text or voice settings changed)
//   node make_recap.mjs tidy        one clip
//   node make_recap.mjs --exam exam02 [--check] [clip]   the Exam 02 clips (content/recap_exam02.mjs,
//                                   recap/scripts_exam02.md); the clips share recap/ (unit ids differ)
//   node make_recap.mjs --exam exam02 --preview [clip]   never calls ElevenLabs: a clip whose audio is
//                                   already cached is built as usual; any other clip gets estimated timings
//                                   and goes to recap/preview/<id>.json (silent; kept off the site by
//                                   .vercelignore; shown locally by RECAP_PREVIEW=1 node build.mjs)
// The narration must equal the approved scripts in recap/scripts.md word for word, or this stops.
// ELEVENLABS_API is read from the course .Renviron and never printed. Character timings from the
// API are cached in content/recap_cache/, so changing a drawing does not pay for the audio again.
// Board items: { hand }, { code }, { row }, { gap }, { page }, and (Exam 02) { sketch, at, phases, until, box }: an
// animated chart from recap_sketches.js, started at the cue `at`, moved on at each cue in `phases` (searched forward
// from `at`, so a phase may fall in a later sentence), and faded out at the cue `until` if given, so that several
// sketches can take turns in one box. Text lines on a page with a sketch must keep clear of it.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { PHASES, BOXES } from "./recap_sketches.js";

const VOICE = { id: "aMSt68OGf4xUZAnLpTU8", name: "Juniper", model: "eleven_multilingual_v2", speed: 0.8, stability: 0.5, similarity_boost: 0.75 };
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const preview = args.includes("--preview");
const EXAM = args.includes("--exam") ? args[args.indexOf("--exam") + 1] : "exam01";
const FILES = { exam01: { clips: "./content/recap.mjs", scripts: "recap/scripts.md" },
                exam02: { clips: "./content/recap_exam02.mjs", scripts: "recap/scripts_exam02.md" } }[EXAM];
if (!FILES) { console.error("RECAP ERROR: unknown exam " + EXAM); process.exit(1); }
const clips = (await import(FILES.clips)).default;
const only = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--exam");
const fail = (m) => { console.error("RECAP ERROR: " + m); process.exit(1); };
const norm = (t) => t.replace(/\s+/g, " ").trim();

// ---- the approved scripts ------------------------------------------------------------------------
const md = fs.readFileSync(FILES.scripts, "utf8").replace(/\r/g, "");
const approved = md.split(/\n## /).slice(1).map((sec) => norm(sec.slice(sec.indexOf("\n"), sec.indexOf("**Board:**"))));
if (approved.length !== clips.length) fail(`${FILES.scripts} has ${approved.length} scripts, ${FILES.clips} has ${clips.length} clips`);

// what the caption shows for words that are spelled for the voice
const CAPTION = [
  ["dee plier", "dplyr"], ["R vest", "rvest"], ["H T T R two", "httr2"], ["tidy R", "tidyr"], ["the elmer package", "the ellmer package"],
  ["chat open A I", "chat_openai()"], ["Read C S V, from reader", "read_csv(), from readr"], ["Read excel, from read X L", "read_excel(), from readxl"],
  ["From JSON, from JSON lite", "fromJSON(), from jsonlite"], ["from JSON turns", "fromJSON() turns"],
  ["Req U R L query", "req_url_query()"], ["Req perform", "req_perform()"], ["Resp body string", "resp_body_string()"],
  ["Read H T M L", "read_html()"], ["H T M L elements", "html_elements()"], ["H T M L text two", "html_text2()"],
  ["Paths allowed", "paths_allowed()"], ["robots dot T X T", "robots.txt"], ["sys get env", "Sys.getenv()"], ["sys sleep", "Sys.sleep()"],
  ["dot R environ", ".Renviron"], ["map D F", "map_df()"], ["paste zero", "paste0()"], ["D M Y", "dmy()"], ["as integer", "as.integer"],
  ["U S A Jobs", "USAJOBS"], ["A P I", "API"], ["C S S", "CSS"], ["L L M", "LLM"], ["the two letters O H", "the two letters OH"],
  ["gets N A", "gets NA"], ["and N counts", "and n() counts"], ["type of returned", "typeof() returned"], ["dot dot, slash, data", "../data"],
];
// Exam 02 only (applied after the shared list, so the Exam 01 captions do not change)
if (EXAM === "exam02") CAPTION.push(["Power B I", "Power BI"], ["An A I", "An AI"], ["three D", "3D"]);
const caption = (t) => CAPTION.reduce((x, [a, b]) => x.split(a).join(b), t);

// ---- layout: a column of lines on a 960 x 540 board ------------------------------------------------
const H = { big: 54, hand: 44, code: 34, row: 62, gap: 16 };
const LEFT = 44, TOP = 30, BOTTOM = 522;
const MAXCH = { big: 44, hand: 58, code: 66 };
const PX = { big: 880 / MAXCH.big, hand: 880 / MAXCH.hand, code: 880 / MAXCH.code };   // about how wide a character is

// rough timings for a preview without audio: the pace of the voiced clips, with pauses after punctuation
const PACE = 14;   // characters a second at speed 0.8, without the pauses (from the Exam 02 clips already voiced)
function fakeTimings(text) {
  let t = 0.1; const starts = [], ends = [];
  for (let i = 0; i < text.length; i++) {
    starts.push(t); t += 1 / PACE;
    if (".?!".includes(text[i])) t += 0.35; else if (",:;".includes(text[i])) t += 0.12;
    ends.push(t);
  }
  return { starts, ends };
}
const boxOf = (it) => (typeof it.box === "object" ? it.box : BOXES[it.box || "right"]);

const env = fs.readFileSync(path.join("..", "..", ".Renviron"), "utf8");
const keyMatch = env.match(/^ELEVENLABS_API\s*=\s*"?([^"\r\n]+)"?/m);
fs.mkdirSync("content/recap_cache", { recursive: true });

async function speak(text) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE.id}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": keyMatch[1].trim(), "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: VOICE.model, voice_settings: { stability: VOICE.stability, similarity_boost: VOICE.similarity_boost, speed: VOICE.speed } }),
  });
  if (!r.ok) fail(`ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return { audio: Buffer.from(j.audio_base64, "base64"), starts: j.alignment.character_start_times_seconds, ends: j.alignment.character_end_times_seconds, chars: j.alignment.characters };
}

let totalChars = 0, totalSecs = 0;
for (const [ci, clip] of clips.entries()) {
  if (only && clip.id !== only) continue;
  const text = clip.segs.map((s) => s.say).join(" ");
  if (norm(text) !== approved[ci]) {
    const a = norm(text), b = approved[ci]; let k = 0; while (k < a.length && a[k] === b[k]) k += 1;
    fail(`${clip.id}: narration differs from the approved script near: "...${a.slice(Math.max(0, k - 40), k + 40)}..." vs "...${b.slice(Math.max(0, k - 40), k + 40)}..."`);
  }
  totalChars += text.length;

  // where a sketch starts and moves on, as positions in the clip's text (the start cue is in its own sentence)
  const sketchCues = (it, seg, off) => {
    if (it.at && !seg.say.includes(it.at)) fail(`${clip.id}: cue "${it.at}" is not in the sentence "${seg.say.slice(0, 50)}..."`);
    let pos = off + (it.at ? seg.say.indexOf(it.at) : 0); const out = [pos];
    for (const cue of [...(it.phases || []), ...(it.until ? [it.until] : [])]) {
      const k = text.indexOf(cue, pos);
      if (k < 0) fail(`${clip.id}: the ${it.sketch} cue "${cue}" does not come after "${it.at || seg.say.slice(0, 20)}"`);
      out.push(k); pos = k;
    }
    return out;   // [start, ...phases, until?]
  };

  // which pages carry a sketch, and where it sits, so the lines on that page can keep clear of it
  const boxes = {};
  { let pg = 0;
    for (const seg of clip.segs) for (const it of seg.board || []) {
      if (it.page) { pg += 1; continue; }
      if (!it.sketch) continue;
      if (!(it.sketch in PHASES)) fail(`${clip.id}: there is no sketch called "${it.sketch}" in recap_sketches.js`);
      if (!boxOf(it)) fail(`${clip.id}: unknown box "${it.box}" for ${it.sketch}`);
      if ((it.phases || []).length !== PHASES[it.sketch]) fail(`${clip.id}: ${it.sketch} needs ${PHASES[it.sketch]} phase cue(s), not ${(it.phases || []).length}`);
      (boxes[pg] ||= []).push(boxOf(it));
    } }

  // check cues and layout before spending anything
  let y = TOP, page = 0, nItems = 0, nSketches = 0, off = 0;
  for (const seg of clip.segs) {
    for (const it of seg.board || []) {
      if (it.page) { page += 1; y = TOP; continue; }
      if (it.gap) { y += H.gap; continue; }
      if (it.sketch) { sketchCues(it, seg, off); nSketches += 1; continue; }
      const kind = it.row ? "row" : it.code !== undefined ? "code" : it.big ? "big" : "hand";
      for (const cue of [it.at, it.strikeAt]) if (cue && !seg.say.includes(cue)) fail(`${clip.id}: cue "${cue}" is not in the sentence "${seg.say.slice(0, 50)}..."`);
      const str = it.row ? it.row.join("     ") : (it.code ?? it.hand);
      if (kind !== "row" && str.length + (it.indent || 0) * 3 > MAXCH[kind]) fail(`${clip.id}: line too long for the board (${str.length} characters): ${str}`);
      const x0 = LEFT + (it.indent || 0) * 34, x1 = kind === "row" ? 930 : x0 + str.length * PX[kind];
      for (const b of boxes[page] || []) if (y < b.y + b.h && y + H[kind] > b.y && x1 > b.x - 10 && x0 < b.x + b.w)
        fail(`${clip.id}: "${str}" runs into the sketch on page ${page + 1}; keep it to about ${Math.max(0, Math.floor((b.x - 10 - x0) / PX[kind]))} characters`);
      y += H[kind]; nItems += 1;
      if (y > BOTTOM) fail(`${clip.id}: page ${page + 1} is too tall at "${str}"`);
    }
    off += seg.say.length + 1;
  }
  if (checkOnly) { console.log(`ok   ${clip.id}: ${text.length} characters, ${clip.segs.length} sentences, ${nItems} board items${nSketches ? `, ${nSketches} sketches` : ""}, ${page + 1} pages`); continue; }

  // audio and timings, cached by narration text and voice settings
  const hash = crypto.createHash("sha256").update(JSON.stringify([text, VOICE])).digest("hex").slice(0, 16);
  const cacheFile = `content/recap_cache/${clip.id}.json`, mp3 = `recap/${clip.id}.mp3`;
  let cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : null;
  const voiced = cache && cache.hash === hash && fs.existsSync(mp3);
  if (!voiced && preview) cache = fakeTimings(text);
  else if (!voiced) {
    if (!keyMatch) fail("ELEVENLABS_API is not in .Renviron");
    const res = await speak(text);
    if (res.chars.join("") !== text) fail(`${clip.id}: the timings returned do not line up with the text`);
    fs.writeFileSync(mp3, res.audio);
    cache = { hash, starts: res.starts, ends: res.ends };
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
    console.log(`     ${clip.id}: generated audio (${text.length} characters)`);
  }
  const duration = cache.ends[cache.ends.length - 1];
  totalSecs += duration;

  // resolve every board item to a time, a page and a position
  const segments = [], items = [];
  let offset = 0; y = TOP; page = 0;
  for (const seg of clip.segs) {
    const segStart = cache.starts[offset], segEnd = cache.ends[offset + seg.say.length - 1];
    segments.push({ t: +segStart.toFixed(2), cap: caption(seg.say) });
    let free = 0;
    for (const it of seg.board || []) {
      if (it.page) { page += 1; y = TOP; items.push({ k: "page", page, t: +segStart.toFixed(2) }); continue; }
      if (it.gap) { y += H.gap; continue; }
      if (it.sketch) {
        const [p0, ...ps] = sketchCues(it, seg, offset).map((p) => +cache.starts[p].toFixed(2));
        const end = it.until ? ps.pop() : undefined;   // a sketch with `until` fades out at that cue
        items.push({ k: "sketch", page, t: p0, name: it.sketch, box: boxOf(it), phases: ps, ...(end !== undefined ? { end } : {}) });
        continue;
      }
      const kind = it.row ? "row" : it.code !== undefined ? "code" : "hand";
      const hgt = it.row ? H.row : it.code !== undefined ? H.code : it.big ? H.big : H.hand;
      const when = (cue) => cache.starts[offset + seg.say.indexOf(cue)];
      const t = it.at ? when(it.at) : Math.min(segStart + 0.25 + free++ * 1.1, Math.max(segStart, segEnd - 0.6));
      const o = { k: kind, page, t: +t.toFixed(2), x: LEFT + (it.indent || 0) * 34, y, h: hgt };
      if (kind === "row") { o.cells = it.row; o.arrows = it.arrows !== false; }
      else { o.text = it.code ?? it.hand; o.d = +Math.min(1.6, Math.max(0.5, o.text.length * 0.035)).toFixed(2); }
      if (it.big) o.big = true;
      if (it.color) o.color = it.color;
      if (it.strikeAt) o.strike = +when(it.strikeAt).toFixed(2);
      items.push(o); y += hgt;
    }
    offset += seg.say.length + 1;
  }
  const out = voiced || !preview ? `recap/${clip.id}.json` : `recap/preview/${clip.id}.json`;
  if (out.includes("preview")) fs.mkdirSync("recap/preview", { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ id: clip.id, duration: +duration.toFixed(2), voice: VOICE.name, ...(out.includes("preview") ? { silent: true } : {}), segments, items }));
  console.log(`ok   ${clip.id}: ${duration.toFixed(1)} s${out.includes("preview") ? " (estimated, no audio)" : ""}, ${items.filter((i) => i.k !== "page").length} board items -> ${out}`);
}
console.log(checkOnly ? `\n${totalChars} characters of narration in total` : `\n${(totalSecs / 60).toFixed(1)} minutes of narration, ${totalChars} characters`);
