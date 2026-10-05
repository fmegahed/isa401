// GET /api/board?section=A
// Every seat's state in the section's current run. The present set is every
// seat that checked in (stage 0) during this run: the board's only denominator.
// Nothing here contains an answer.
const { runId, readSeats, sendJSON, SECTIONS, TOP } = require("./_store");

module.exports = async (req, res) => {
  const section = String((req.query && req.query.section) || "A").toUpperCase();
  if (!SECTIONS.includes(section)) return sendJSON(res, 400, { error: "bad section" });
  try {
    const id = await runId(section);
    const seats = await readSeats(section, id);
    const present = Object.keys(seats).sort();
    const done = present.filter((s) => seats[s].level >= TOP).length;
    return sendJSON(res, 200, { section, runId: id, top: TOP, seats, present, done, now: Date.now() });
  } catch (e) {
    return sendJSON(res, 500, { error: String(e.message || e) });
  }
};
