// GET /api/export?section=A&run=7&track=opener
// The run as tidy CSV, one row per seat per level reached, for the Monday
// dplyr exercise:  readr::read_csv("https://isa401-find-your-seat.vercel.app/api/export?section=A")
// run defaults to the section's current run; track defaults to both tracks.
const { redis, runId, SECTIONS, TRACKS, TOP } = require("./_store");

const NAMES = {
  opener: { 0: "seat picked", 1: "FSB found", 2: "floor 2", 3: "arrived" },
  heist: { 1: "stage 1 read", 2: "stage 2 unlocked", 4: "cleared" },
};

function csvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const section = String(q.section || "A").toUpperCase();
  const trackQ = String(q.track || "all");
  if (!SECTIONS.includes(section) || (trackQ !== "all" && !TRACKS.includes(trackQ))) {
    res.status(400).send("bad section or track\n");
    return;
  }
  try {
    const run = q.run && /^\d+$/.test(String(q.run)) ? Number(q.run) : await runId(section);
    const tracks = trackQ === "all" ? TRACKS : [trackQ];
    const rows = [["section", "run", "track", "seat", "table", "level", "level_name", "reached_at", "seconds", "rank"]];
    for (const track of tracks) {
      const flat = (await redis("HGETALL", `run:${section}:${run}:${track}`)) || [];
      const seats = {};
      for (let i = 0; i < flat.length; i += 2) seats[flat[i]] = JSON.parse(flat[i + 1]);
      const starts = Object.values(seats).flatMap((v) => Object.values(v.t || {})).map(Number).filter(Boolean);
      const t0 = starts.length ? Math.min(...starts) : null;
      const recs = [];
      for (const [seat, v] of Object.entries(seats)) {
        for (const [lv, ms] of Object.entries(v.t || {})) {
          const level = Number(lv);
          recs.push([section, run, track, seat, seat.slice(0, 2), level, NAMES[track][level] || "", new Date(ms).toISOString(),
            t0 == null ? "" : Math.round((ms - t0) / 1000), level === TOP[track] && v.rank != null ? v.rank : ""]);
        }
      }
      recs.sort((a, b) => a[7] < b[7] ? -1 : a[7] > b[7] ? 1 : 0);
      rows.push(...recs);
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", `inline; filename="find_your_seat_${section}_run${run}.csv"`);
    res.status(200).send(rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
  } catch (e) {
    res.status(500).send("error: " + String(e.message || e) + "\n");
  }
};
