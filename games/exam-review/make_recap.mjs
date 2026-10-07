// Builds the recap clips: narration audio (ElevenLabs) and, for each clip, a file that says what is
// drawn on the whiteboard and when.
//   node make_recap.mjs --check     check the text, the cues and the layout; no audio is generated
//   node make_recap.mjs             generate (only clips whose narration text or voice settings changed)
//   node make_recap.mjs tidy        one clip
// The narration must equal the approved scripts in recap/scripts.md word for word, or this stops.
// ELEVENLABS_API is read from the course .Renviron and never printed. Character timings from the
// API are cached in content/recap_cache/, so changing a drawing does not pay for the audio again.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import clips from "./content/recap.mjs";

const VOICE = { id: "aMSt68OGf4xUZAnLpTU8", name: "Juniper", model: "eleven_multilingual_v2", speed: 0.8, stability: 0.5, similarity_boost: 0.75 };
const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const only = args.find((a) => !a.startsWith("--"));
const fail = (m) => { console.error("RECAP ERROR: " + m); process.exit(1); };
const norm = (t) => t.replace(/\s+/g, " ").trim();

// ---- the approved scripts ------------------------------------------------------------------------
const md = fs.readFileSync("recap/scripts.md", "utf8").replace(/\r/g, "");
const approved = md.split(/\n## /).slice(1).map((sec) => norm(sec.slice(sec.indexOf("\n"), sec.indexOf("**Board:**"))));
if (approved.length !== clips.length) fail(`scripts.md has ${approved.length} scripts, recap.mjs has ${clips.length} clips`);

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
const caption = (t) => CAPTION.reduce((x, [a, b]) => x.split(a).join(b), t);

// ---- layout: a column of lines on a 960 x 540 board ------------------------------------------------
const H = { big: 54, hand: 44, code: 34, row: 62, gap: 16 };
const LEFT = 44, TOP = 30, BOTTOM = 522;
const MAXCH = { big: 44, hand: 58, code: 66 };

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

  // check cues and layout before spending anything
  let y = TOP, page = 0, nItems = 0;
  for (const seg of clip.segs) for (const it of seg.board || []) {
    if (it.page) { page += 1; y = TOP; continue; }
    if (it.gap) { y += H.gap; continue; }
    const kind = it.row ? "row" : it.code !== undefined ? "code" : it.big ? "big" : "hand";
    for (const cue of [it.at, it.strikeAt]) if (cue && !seg.say.includes(cue)) fail(`${clip.id}: cue "${cue}" is not in the sentence "${seg.say.slice(0, 50)}..."`);
    const str = it.row ? it.row.join("     ") : (it.code ?? it.hand);
    if (kind !== "row" && str.length + (it.indent || 0) * 3 > MAXCH[kind]) fail(`${clip.id}: line too long for the board (${str.length} characters): ${str}`);
    y += H[kind]; nItems += 1;
    if (y > BOTTOM) fail(`${clip.id}: page ${page + 1} is too tall at "${str}"`);
  }
  if (checkOnly) { console.log(`ok   ${clip.id}: ${text.length} characters, ${clip.segs.length} sentences, ${nItems} board items, ${page + 1} pages`); continue; }

  // audio and timings, cached by narration text and voice settings
  const hash = crypto.createHash("sha256").update(JSON.stringify([text, VOICE])).digest("hex").slice(0, 16);
  const cacheFile = `content/recap_cache/${clip.id}.json`, mp3 = `recap/${clip.id}.mp3`;
  let cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : null;
  if (!cache || cache.hash !== hash || !fs.existsSync(mp3)) {
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
  fs.writeFileSync(`recap/${clip.id}.json`, JSON.stringify({ id: clip.id, duration: +duration.toFixed(2), voice: VOICE.name, segments, items }));
  console.log(`ok   ${clip.id}: ${duration.toFixed(1)} s, ${items.filter((i) => i.k !== "page").length} board items`);
}
console.log(checkOnly ? `\n${totalChars} characters of narration in total` : `\n${(totalSecs / 60).toFixed(1)} minutes of narration, ${totalChars} characters`);
