// POST /api/check  { id, text }            -> { status, ideas: [{met, label?}], note }
// POST /api/check  { id, reveal: true }    -> { ideas: [{label}] }   ("Show the ideas")
// The rubric (idea names, the questions Jev is asked, the wrong claims) stays on the server in
// _rubrics.json. The page only ever receives the label of an idea the student has covered.
const { askJev, judge } = require("./_judge");
const { quiet, sendJSON, readBody, clientIp } = require("./_store");
const rubrics = require("./_rubrics.json");

const MAX_CHARS = 1500;
const PER_MINUTE = 40;   // checks per address per minute; a lab shares few addresses, so this is generous

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  const body = readBody(req);
  const rubric = rubrics[String(body.id || "")];
  if (!rubric) return sendJSON(res, 404, { error: "Unknown question." });

  if (body.reveal) {
    quiet("HINCRBY", "review:stats", body.id + ":revealed", 1);
    return sendJSON(res, 200, { ideas: rubric.ideas.map((i) => ({ label: i.label })) });
  }

  const text = String(body.text || "").trim().slice(0, MAX_CHARS);
  if (text.length < 15) {
    return sendJSON(res, 200, { status: "keep_going", ideas: rubric.ideas.map(() => ({ met: false })), note: null });
  }

  const minute = Math.floor(Date.now() / 60000);
  const rlKey = `review:rl:${clientIp(req)}:${minute}`;
  const used = await quiet("INCR", rlKey);
  if (used === 1) quiet("EXPIRE", rlKey, 120);
  if (used && used > PER_MINUTE * 10) return sendJSON(res, 429, { error: "Too many checks from this network. Wait a minute." });

  const key = process.env.JEV_API_KEY;
  if (!key) return sendJSON(res, 503, { error: "The checker is not configured." });

  try {
    const verdict = judge(rubric, await askJev(rubric, text, key));
    quiet("HINCRBY", "review:stats", body.id + ":checks", 1);
    if (verdict.status === "done" && body.first) quiet("HINCRBY", "review:stats", body.id + ":done", 1);
    return sendJSON(res, 200, verdict);
  } catch (e) {
    return sendJSON(res, 502, { error: "The checker did not answer. Your text is fine; try again in a moment." });
  }
};
