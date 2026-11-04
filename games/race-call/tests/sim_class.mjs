// Simulated class against a running server: N phones join, poll /api/state every 2 s like the real
// page, answer every race at random times, and the host steps through the whole game while polling
// /api/board every second. Prints timing and checks that the board agrees with what was sent.
//   node tests/sim_class.mjs http://localhost:4060 A 40        (dev server; ADMIN_KEY in env)
// Never point it at the live site during class: it writes a full game to the section it is given.
const [base = "http://localhost:4060", section = "Z", nStr = "40"] = process.argv.slice(2);
const N = Number(nStr), KEY = process.env.ADMIN_KEY || "local-test";   // the dev server's key
const SEATS = []; for (const s of ["L", "R"]) for (let r = 1; r <= 3; r++) for (let n = 1; n <= 7; n++) SEATS.push(`${s}${r}-${n}`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const lat = [];
async function req(path, opt = {}) {
  const t0 = performance.now();
  const r = await fetch(base + path, { ...opt, headers: { "content-type": "application/json", ...(opt.headers || {}) } });
  const j = await r.json().catch(() => null);
  lat.push(performance.now() - t0);
  if (!r.ok) throw new Error(path + " " + r.status + " " + JSON.stringify(j));
  return j;
}
const host = (action) => req("/api/host", { method: "POST", body: JSON.stringify({ section, action }), headers: { "x-admin-key": KEY } });
const board = () => req("/api/board?section=" + section, { headers: { "x-admin-key": KEY } });

const pub = await req("/questions.json");
const Q = pub.questions;
await host("reset");
const phones = [];
await Promise.all(Array.from({ length: N }, async (_, i) => {
  await wait(Math.random() * 3000);
  const seat = i < SEATS.length ? SEATS[i] : "remote";
  const j = await req("/api/join", { method: "POST", body: JSON.stringify({ section, first: "Sim" + i, initial: "X", seat }) });
  phones.push({ id: j.playerId, skill: 0.3 + 0.6 * Math.random() });
}));
let running = true;
const pollers = phones.map(async () => { while (running) { await req("/api/state?section=" + section).catch(() => {}); await wait(2000); } });
const hostPoll = (async () => { while (running) { await board().catch(() => {}); await wait(1000); } })();

let b = await board();
const problems = [];
if (b.players.length !== N) problems.push(`joined ${b.players.length} of ${N}`);
const sent = [];
for (let q = 1; q <= Q.length; q++) {
  await host("next"); await wait(300);
  await host("open");
  const picks = new Array(4).fill(0);
  let answered = 0;
  await Promise.all(phones.map(async (p) => {
    if (Math.random() < 0.05) return;                         // a few do not answer
    await wait(500 + Math.random() * Math.min(9000, Q[q - 1].seconds * 600));
    const a = Math.floor(Math.random() * 4);
    const r = await req("/api/answer", { method: "POST", body: JSON.stringify({ section, playerId: p.id, q, answer: a }) });
    if (r.ok) { picks[a]++; answered++; }
  }));
  b = await board();
  if (b.answered !== answered) problems.push(`race ${q}: board says ${b.answered} answered, sent ${answered}`);
  if (b.histogram !== null) problems.push(`race ${q}: histogram visible while open`);
  await host("close");
  b = await host("reveal");
  if (JSON.stringify(b.histogram) !== JSON.stringify(picks)) problems.push(`race ${q}: histogram ${b.histogram} vs ${picks}`);
  if (!b.reveal || b.reveal.correct !== b.correct) problems.push(`race ${q}: no reveal payload`);
  sent.push(answered);
  if (q < Q.length && Q[q].block !== Q[q - 1].block) await host("break");
}
b = await host("next");
if (b.phase !== "final") problems.push("did not reach final: " + b.phase);
const seated = Object.keys(b.seatTotals).length;
if (seated !== Math.min(N, SEATS.length)) problems.push(`final map has ${seated} seats`);
running = false; await Promise.all(pollers); await hostPoll;
lat.sort((x, y) => x - y);
const pct = (p) => lat[Math.floor(p * (lat.length - 1))].toFixed(0);
console.log(JSON.stringify({ section, phones: N, races: Q.length, answersPerRace: sent, requests: lat.length,
  latencyMs: { p50: pct(0.5), p95: pct(0.95), max: lat[lat.length - 1].toFixed(0) }, final: { top: b.top.slice(0, 3), seats: seated }, problems }, null, 1));
process.exit(problems.length ? 1 : 0);
