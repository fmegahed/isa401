// Checks one "Build it" submission: the numbers in code, the chart screenshot with Jev.
// Jev answers yes/no questions (Nouls) about the image; code decides what the student sees, and every word they
// see comes from the rubric (content/exam02_units.mjs via build.mjs), never from the model.
// Images are a TypeSafe "Danger Zone" feature (off by default, not production-ready), so each request opts in with a
// header, and the page says the chart check is experimental. Used by api/build.js and tests/run_builds.mjs.
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const MET = 0.7;        // a chart check counts as met at or above this probability
const NOT_CHART = 0.5;  // below this, the image is not taken for a chart at all
const REF = "img-7f3a9c-student-chart";   // the image's reference string; it replaces `chart` in the state
const GUARD = {
  ask: "Is `chart` a screenshot of a chart, graph or map of data?",
  yes: "The image shows a chart, graph or map of data, such as one made in Tableau or Power BI.",
  no: "The image is not a chart: for example a photo, text only, a blank or mostly empty screen, or a screenshot of something else.",
};

// "$208", "1,234", "22.7%", " 107 " -> number; anything else -> null
function parseNumber(s) {
  const t = String(s == null ? "" : s).replace(/[$,%\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

// rubric.numbers: [{ id, label, answer, tol, wrong: [{ value, tol, msg }], msg }]
function judgeNumbers(rubric, given) {
  let note = null;
  const numbers = rubric.numbers.map((n) => {
    const x = parseNumber((given || {})[n.id]);
    if (x === null) return { met: false, empty: !String((given || {})[n.id] || "").trim() };
    if (Math.abs(x - n.answer) <= n.tol + 1e-9) return { met: true, label: n.label };
    const w = (n.wrong || []).find((w) => Math.abs(x - w.value) <= w.tol + 1e-9);
    if (w && !note) note = w.msg;
    else if (!note && n.msg) note = n.msg;
    return { met: false };
  });
  return { numbers, note };
}

function buildRequest(rubric, b64, format) {
  const questions = { guard: { type: "noul", instructions: GUARD.ask, criteria: { true: GUARD.yes, false: GUARD.no } } };
  rubric.shots.forEach((s, i) => { questions["shot_" + i] = { type: "noul", instructions: s.ask, criteria: { true: s.yes, false: s.no } }; });
  return { model: "jev-latest", state: { chart: REF }, assets: { [REF]: { type: "image", format, data_base64: b64 } }, questions };
}

async function askJevImage(rubric, b64, format, key) {
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(JEV_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "TypeSafe-Danger-Zone-Images": "true" },
      body: JSON.stringify(buildRequest(rubric, b64, format)),
    });
    if (r.ok) return (await r.json()).answers;
    last = "Jev HTTP " + r.status + " " + (await r.text()).slice(0, 200);
    if (r.status !== 429 && r.status !== 529) break;
    await new Promise((s) => setTimeout(s, 400 * (attempt + 1)));
  }
  throw new Error(last);
}

// answers: Jev's "answers". Returns the chart checks the page may see, and the raw probabilities for the tests.
function judgeShots(rubric, answers) {
  const p = (k) => (answers[k] ? answers[k].noul : 0);
  const isChart = p("guard") >= NOT_CHART;
  const shots = rubric.shots.map((s, i) => (isChart && p("shot_" + i) >= MET ? { met: true, label: s.label } : { met: false }));
  return { isChart, shots, probs: { guard: p("guard"), shots: rubric.shots.map((s, i) => p("shot_" + i)) } };
}

function status(numbers, shots) {
  const all = [...numbers, ...shots], met = all.filter((x) => x.met).length;
  return met === all.length ? "done" : met === 0 ? "keep_going" : "more_detail";
}

module.exports = { parseNumber, judgeNumbers, buildRequest, askJevImage, judgeShots, status, MET, NOT_CHART };
