// POST /api/progress  {section, seat, track, level, key?}
// Records the highest level a seat has reached in the current run of its
// section, with a timestamp per level, and assigns finish ranks in order.
// Heist calls (track "heist") must carry key = PROGRESS_KEY.
const { redis, runId, sendJSON, readBody, SECTIONS, TRACKS, SEAT_RE, TOP } = require("./_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  const b = readBody(req);
  const section = String(b.section || "").toUpperCase();
  const seat = String(b.seat || "").toUpperCase();
  const track = String(b.track || "opener");
  const level = Number(b.level);
  if (!SECTIONS.includes(section) || !SEAT_RE.test(seat) || !TRACKS.includes(track) || !Number.isInteger(level) || level < 0 || level > TOP[track]) {
    return sendJSON(res, 400, { error: "bad section, seat, track, or level" });
  }
  if (track === "heist" && process.env.PROGRESS_KEY && b.key !== process.env.PROGRESS_KEY) {
    return sendJSON(res, 403, { error: "bad key" });
  }
  try {
    const id = await runId(section);
    const key = `run:${section}:${id}:${track}`;          // hash: seat -> JSON {level, t: {level: ms}, rank?}
    const raw = await redis("HGET", key, seat);
    const cur = raw ? JSON.parse(raw) : { level: -1, t: {} };
    if (level > cur.level) {
      cur.level = level;
      cur.t[level] = Date.now();
      if (level === TOP[track] && cur.rank == null) {
        cur.rank = await redis("INCR", `${key}:finishers`);
      }
      await redis("HSET", key, seat, JSON.stringify(cur));
      await redis("EXPIRE", key, 60 * 60 * 24 * 30);
      await redis("EXPIRE", `${key}:finishers`, 60 * 60 * 24 * 30);
    }
    // present: how many seats have tapped in during this run's opener (the phone
    // page says "N seats still on the way" from it)
    const present = track === "opener" ? await redis("HLEN", key) : await redis("HLEN", `run:${section}:${id}:opener`);
    const arrived = await redis("GET", `${key}:finishers`);
    return sendJSON(res, 200, { ok: true, runId: id, seat, level: cur.level, rank: cur.rank == null ? null : cur.rank, present: Number(present || 0), arrived: Number(arrived || 0) });
  } catch (e) {
    return sendJSON(res, 500, { error: String(e.message || e) });
  }
};
