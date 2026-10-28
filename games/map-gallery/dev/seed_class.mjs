// Fills a section on a running dev server with a small simulated class: 4 students write plans,
// submit maps, and each votes on 3 matchups (always for the "good" map when shown). Then it leaves
// the section in the vote phase (or, with "results", puts the results up).
//   node dev/seed_class.mjs [http://localhost:4050] [Z] [results]
import fs from "node:fs";
const base = process.argv[2] || "http://localhost:4050", section = process.argv[3] || "Z", key = process.env.ADMIN_KEY || "fall2026";
const jpg = (f) => "data:image/jpeg;base64," + fs.readFileSync(new URL("../tests/shots/" + f, import.meta.url)).toString("base64");
const post = async (p, b, h = {}) => { const r = await fetch(base + p, { method: "POST", headers: Object.assign({ "content-type": "application/json" }, h), body: JSON.stringify(b) }); return r.json(); };
const get = async (p) => (await fetch(base + p)).json();
const host = (action) => post("/api/host", { section, action }, { "x-admin-key": key });
const people = [
  { first: "Ava", seat: "L1-1", map: "rubric_good.jpg", tool: "Claude", plan: { measure: "confirmed_cases is a running total, so I use the last week and divide by population per 100,000", butler: "outline Butler in red and label its rate", colors: "sequential blues, light to dark", title: "Butler County's COVID rate was close to Ohio's", prompt: "Use the latest week only; cases per 100k; Blues; outline Butler; add a source caption; remove axes." } },
  { first: "Ben", seat: "L3-2", map: "rubric_bad.jpg", tool: "ChatGPT", plan: { measure: "total cases, sum confirmed_cases for each county", prompt: "make a map of total covid cases by county" } },
  { first: "Cam", seat: "R1-4", map: "test_map.jpg", tool: "Gemini", plan: { measure: "cases per 100k", colors: "red and blue around the Ohio average", butler: "black outline", prompt: "rate map, diverging around Ohio" } },
  { first: "Dee", seat: "R3-6", map: "test_map.jpg", tool: "ChatGPT", plan: { measure: "cases divided by population", prompt: "choropleth of rates" } },
];
const ids = [];
for (const p of people) ids.push((await post("/api/join", { section, first: p.first, initial: "T", seat: p.seat })).playerId);
await host("plan");
for (let i = 0; i < 4; i++) await post("/api/plan", { section, playerId: ids[i], plan: people[i].plan, final: true });
await host("build");
const imgs = {};
for (let i = 0; i < 4; i++) {
  const r = await post("/api/submit", { section, playerId: ids[i], image: jpg(people[i].map), w: 960, h: 720, tool: people[i].tool, model: i ? "" : "Sonnet", prompts: [7, 2, 4, 3][i],
    finalPrompt: "make it better", pins: [{ x: 0.3, y: 0.6, kind: "Butler", text: "Butler outlined" }, { x: 0.5, y: 0.05, kind: "Title or text", text: "a title" }] });
  console.log(people[i].first, r.ok ? "submitted" : r.error);
}
await host("submit"); await host("vote");
const csv = await (await fetch(base + "/api/export?section=" + section, { headers: { "x-admin-key": key } })).text();
const goodImg = csv.split("\n")[1].match(/\b[a-f0-9]{24}\b/)[0];   // Ava's map (first row)
for (let i = 0; i < 4; i++) {
  for (let k = 0; k < 3; k++) {
    const m = await get(`/api/match?section=${section}&playerId=${encodeURIComponent(ids[i])}`);
    if (m.status !== "match") break;
    const choice = m.match.left === goodImg ? "L" : m.match.right === goodImg ? "R" : (k % 2 ? "L" : "R");
    await post("/api/vote", { section, playerId: ids[i], matchId: m.match.id, choice, reason: ["Color", "Butler", "Title or text"][k] });
  }
  await post("/api/after", { section, playerId: ids[i], guess: ["Claude", "ChatGPT", "Claude", "Gemini"][i] });
}
console.log("votes in"); console.log("ids:", JSON.stringify(ids));
if (process.argv[4] === "results") { const b = await host("results"); console.log("phase:", b.phase); }
