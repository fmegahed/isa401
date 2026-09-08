// Best-effort progress report to the Find Your Seat board (Class 05 opener).
// Not a function of its own: Vercel ignores underscore-prefixed files in api/.
//
// stage1.js, stage2.js, and finish.js call report(req.query, level) when the
// request carries ?seat=L2-3&s=A and the stage was genuinely reached (stage 1 on
// any fetch, stage 2 with the right key, finish with the right code). The POST
// goes to the seat board with the shared PROGRESS_KEY and is never awaited by
// the handler, so it cannot delay or fail a response: bad params are ignored,
// the request is abandoned after 2 seconds, and every error is swallowed.
const BOARD_URL = "https://isa401-find-your-seat.vercel.app/api/progress";
const SEAT_RE = /^[LR][1-3]-[1-7]$/;
const SECTION_RE = /^[AB]$/;
const TIMEOUT_MS = 2000;

// {seat, section} from the query string, or null when either is missing or malformed.
function seatFrom(query) {
  const q = query || {};
  const seat = String(q.seat || "").trim().toUpperCase();
  const section = String(q.s || "").trim().toUpperCase();
  if (!SEAT_RE.test(seat) || !SECTION_RE.test(section)) { return null; }
  return { seat: seat, section: section };
}

// Vercel keeps the function alive for promises handed to waitUntil (this is what
// @vercel/functions does under the hood); elsewhere it is a no-op.
function keepAlive(promise) {
  try {
    const ctx = globalThis[Symbol.for("@vercel/request-context")];
    const store = ctx && typeof ctx.get === "function" ? ctx.get() : null;
    if (store && typeof store.waitUntil === "function") { store.waitUntil(promise); }
  } catch (e) { /* ignore */ }
}

function report(query, level) {
  const id = seatFrom(query);
  if (!id || typeof fetch !== "function") { return false; }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const p = fetch(BOARD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: id.section,
        seat: id.seat,
        track: "heist",
        level: level,
        key: process.env.PROGRESS_KEY || "",
      }),
      signal: ctrl.signal,
    })
      .then(() => undefined, () => undefined)
      .finally(() => clearTimeout(timer));
    keepAlive(p);
  } catch (e) { /* ignore */ }
  return true;
}

module.exports = { report, seatFrom, BOARD_URL };
