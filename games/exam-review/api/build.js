// POST /api/build  { id, numbers: { <id>: "text" }, image?: base64 (no data: prefix), format?: "jpeg"|"png", first? }
//   -> { status, numbers: [{met, label?}], shots: [{met, label?}], note, chartNote }
// POST /api/build  { id, reveal: true }   -> { numbers: [{label, answer}], shots: [{label}], example }   ("Show the answers")
// The example chart (one that passes) is sent only when the build is done or the answers are revealed.
// The answers and the questions Jev is asked stay on the server (_rubrics.json). The screenshot is sent to TypeSafe's
// Jev to be judged and is not stored anywhere.
const { judgeNumbers, askJevImage, judgeShots, status } = require("./_build");
const { quiet, sendJSON, readBody, clientIp } = require("./_store");
const rubrics = require("./_rubrics.json");

const MAX_B64 = 4_000_000;   // about 3 MB of image; the page sends a JPEG of at most 1,568 px a side, far below this
const PER_MINUTE = 20;       // image checks cost more than text checks

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  const body = readBody(req);
  const rubric = rubrics[String(body.id || "")];
  if (!rubric || rubric.kind !== "build") return sendJSON(res, 404, { error: "Unknown build." });

  if (body.reveal) {
    quiet("HINCRBY", "review:stats", body.id + ":revealed", 1);
    return sendJSON(res, 200, { numbers: rubric.numbers.map((n) => ({ label: n.label, answer: n.shown })), shots: rubric.shots.map((s) => ({ label: s.label })), example: rubric.example });
  }

  const { numbers, note } = judgeNumbers(rubric, body.numbers);
  const image = typeof body.image === "string" ? body.image : "";
  const format = body.format === "png" ? "png" : "jpeg";
  if (!image) {
    return sendJSON(res, 200, { status: status(numbers, rubric.shots.map(() => ({ met: false }))), numbers,
      shots: rubric.shots.map(() => ({ met: false })), note, chartNote: "Add a screenshot of your chart to check it." });
  }
  if (image.length > MAX_B64 || !/^[A-Za-z0-9+/=]+$/.test(image.slice(0, 2000))) return sendJSON(res, 400, { error: "That image could not be read. Try a PNG or JPEG screenshot." });

  const minute = Math.floor(Date.now() / 60000);
  const rlKey = `review:rlb:${clientIp(req)}:${minute}`;
  const used = await quiet("INCR", rlKey);
  if (used === 1) quiet("EXPIRE", rlKey, 120);
  if (used && used > PER_MINUTE * 10) return sendJSON(res, 429, { error: "Too many checks from this network. Wait a minute." });

  const key = process.env.JEV_API_KEY;
  if (!key) return sendJSON(res, 503, { error: "The checker is not configured." });
  try {
    const v = judgeShots(rubric, await askJevImage(rubric, image, format, key));
    const st = status(numbers, v.shots);
    quiet("HINCRBY", "review:stats", body.id + ":checks", 1);
    if (st === "done" && body.first) quiet("HINCRBY", "review:stats", body.id + ":done", 1);
    return sendJSON(res, 200, { status: st, numbers, shots: v.shots, note, example: st === "done" ? rubric.example : null,
      chartNote: v.isChart ? null : "That image does not look like a chart. Take a screenshot of just your chart and try again." });
  } catch (e) {
    return sendJSON(res, 502, { error: "The chart checker did not answer. Your numbers were checked; try the chart again in a moment.", numbers, note });
  }
};
