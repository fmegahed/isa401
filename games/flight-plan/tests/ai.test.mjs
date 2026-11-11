import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const AI = require("../api/_ai.js");
const reply = (obj) => async () => ({ ok: true, status: 200, json: async () => ({ output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(obj) }] }] }) });

test("compile asks gpt-6-luna for a strict brief and says to use only the team's notes", () => {
  const body = AI.buildCompileRequest([{ part: "prod", text: "Accuracy: average distance", first: "Ann" }]);
  assert.equal(body.model, "gpt-6-luna");
  assert.equal(body.reasoning.effort, "low");
  assert.equal(body.text.format.strict, true);
  const prompt = JSON.stringify(body.input);
  assert.match(prompt, /only what the notes say/i);
  assert.match(prompt, /do not add/i);
});

test("compileBrief returns the cleaned brief from the model", async () => {
  const b = await AI.compileBrief([{ part: "design", text: "dart", first: "A" }], { key: "k", fetch: reply({ design_process: "We tried a dart.", builder_choice: "", kpis: [{ type: "product", name: "Accuracy", definition: "avg in", our_number: "" }] }) });
  assert.equal(b.design_process, "We tried a dart.");
  assert.equal(b.kpis[0].name, "Accuracy");
});

test("readBoard keeps only marks whose color and symbol are in use, and maps them to teams", async () => {
  const pairs = { "blue|star": "L1", "red|circle": "L2" };
  const out = await AI.readBoard("data:image/jpeg;base64,AAAA", pairs, { key: "k", fetch: reply({
    x_center: { x: 0.5, y: 0.47 }, x_left_tip: { x: 0.44, y: 0.47 }, x_right_tip: { x: 0.56, y: 0.47 },
    marks: [{ color: "blue", symbol: "star", x: 0.54, y: 0.5 }, { color: "purple", symbol: "heart", x: 0.1, y: 0.1 }, { color: "red", symbol: "circle", x: 0.66, y: 0.58 }] }) });
  assert.deepEqual(out.marks.map((m) => m.team), ["L1", "L2"]);
  assert.equal(out.X.cx, 0.5);
  assert.equal(out.X.lx, 0.44);
});

test("an OpenAI failure surfaces as an error, never as empty marks", async () => {
  const bad = async () => ({ ok: false, status: 400, json: async () => ({}) });
  await assert.rejects(() => AI.readBoard("data:image/jpeg;base64,AAAA", { "blue|star": "L1" }, { key: "k", fetch: bad, budgetMs: 2000 }));
});

test("transcribe posts multipart audio to the transcription model and returns the text", async () => {
  let seen = null;
  const f = async (url, init) => { seen = { url, init }; return { ok: true, status: 200, json: async () => ({ text: "we tried a dart" }) }; };
  const t = await AI.transcribe(Buffer.from("abc").toString("base64"), "audio/webm", { key: "k", fetch: f });
  assert.equal(t, "we tried a dart");
  assert.match(seen.url, /audio\/transcriptions$/);
  assert.equal(seen.init.body.get("model"), "gpt-4o-transcribe");
});
