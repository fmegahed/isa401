// GET /api/board?section=A&track=opener
// Returns every seat's state in the current run of the section, plus the
// present set: every seat that tapped in during the opener of this run. The
// board uses the present set as the only denominator (goal bar, table glow),
// so absences and uneven tables never skew anything.
const { redis, runId, sendJSON, SECTIONS, TRACKS, TOP } = require("./_store");

async function readHash(key) {
  const flat = (await redis("HGETALL", key)) || [];
  const seats = {};
  for (let i = 0; i < flat.length; i += 2) seats[flat[i]] = JSON.parse(flat[i + 1]);
  return seats;
}

module.exports = async (req, res) => {
  const section = String((req.query && req.query.section) || "A").toUpperCase();
  const track = String((req.query && req.query.track) || "opener");
  if (!SECTIONS.includes(section) || !TRACKS.includes(track)) return sendJSON(res, 400, { error: "bad section or track" });
  try {
    const id = await runId(section);
    const seats = await readHash(`run:${section}:${id}:${track}`);
    const opener = track === "opener" ? seats : await readHash(`run:${section}:${id}:opener`);
    const present = Object.keys(opener).sort();
    const finishers = Object.entries(seats)
      .filter(([, v]) => v.rank != null)
      .sort((a, b) => a[1].rank - b[1].rank)
      .map(([seat, v]) => ({ seat, rank: v.rank, t: v.t[TOP[track]] }));
    const started = Object.values(seats).map((v) => v.t[0] || v.t[1]).filter(Boolean);
    return sendJSON(res, 200, {
      section, track, runId: id, top: TOP[track], seats, present, finishers,
      firstStart: started.length ? Math.min(...started) : null, now: Date.now(),
    });
  } catch (e) {
    return sendJSON(res, 500, { error: String(e.message || e) });
  }
};
