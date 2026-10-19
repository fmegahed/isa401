// Turns one written answer into a verdict with the TypeSafe Jev API.
// Jev does not write text. For each idea in the rubric it returns the probability that the
// student's answer contains it (a "noul" question), and the same for each known wrong claim.
// Every word a student sees comes from the rubric, never from the model.
// Copied from games/exam-review/api/_judge.js. Used by api/_game.js (open questions), so any
// rubric test runner exercises the same thresholds.
const JEV_URL = "https://api.typesafe.ai/v1/systemone";
const MET = 0.6;      // an idea counts as covered at or above this probability
const WRONG = 0.6;    // a wrong claim is flagged at or above this probability

function buildRequest(rubric, text) {
  const state = { question_asked_to_student: rubric.prompt, student_answer: text };
  if (rubric.context) state.material_shown_to_student = rubric.context;
  const questions = {};
  rubric.ideas.forEach((idea, i) => {
    questions["idea_" + i] = { type: "noul", instructions: idea.ask, criteria: { true: idea.yes, false: idea.no } };
  });
  (rubric.wrong || []).forEach((w, i) => {
    questions["wrong_" + i] = { type: "noul", instructions: w.ask, criteria: { true: w.yes, false: w.no } };
  });
  return { model: "jev-latest", state, questions };
}

// Game Day change: every attempt runs under AbortSignal.timeout so no request outlives the
// budget, and 429/529/5xx/network errors are retried with jittered exponential backoff
// (base, 2x base, 4x base ... capped at 4 s, each times 0.5-1.5) until the budget is spent.
// opts: {budgetMs = 20000, baseMs = 400, fetch} (fetch is a test hook).
async function askJev(rubric, text, key, opts = {}) {
  const budget = opts.budgetMs || 20000;
  const base = opts.baseMs || 400;
  const doFetch = opts.fetch || fetch;
  const start = Date.now();
  const left = () => budget - (Date.now() - start);
  let last = "Jev not reached";
  for (let attempt = 0; attempt < 8 && left() > 300; attempt++) {
    let retry = false;
    try {
      const r = await doFetch(JEV_URL, {
        method: "POST",
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
        body: JSON.stringify(buildRequest(rubric, text)),
        signal: AbortSignal.timeout(Math.max(1, Math.min(left(), 15000))),
      });
      if (r.ok) return (await r.json()).answers;
      last = "Jev HTTP " + r.status;
      retry = r.status === 429 || r.status === 529 || r.status >= 500;
    } catch (e) {
      last = e && (e.name === "TimeoutError" || e.name === "AbortError") ? "Jev timeout" : "Jev network error";
      retry = last !== "Jev timeout";
    }
    if (!retry) break;
    const wait = Math.min(4000, base * 2 ** attempt) * (0.5 + Math.random());
    if (wait > left() - 300) break;
    await new Promise((s) => setTimeout(s, wait));
  }
  throw new Error(last);
}

// answers: the "answers" object from Jev. Returns what the page needs and nothing it should not see:
// an idea's label is included only once the idea is covered.
function judge(rubric, answers) {
  const ideas = rubric.ideas.map((idea, i) => {
    const p = answers["idea_" + i] ? answers["idea_" + i].noul : 0;
    return p >= MET ? { met: true, label: idea.label } : { met: false };
  });
  const flagged = (rubric.wrong || [])
    .map((w, i) => ({ w, p: answers["wrong_" + i] ? answers["wrong_" + i].noul : 0 }))
    .filter((x) => x.p >= WRONG);
  const nMet = ideas.filter((i) => i.met).length;
  let status = "more_detail";
  if (flagged.length) status = "revisit";
  else if (nMet === ideas.length) status = "done";
  else if (nMet === 0) status = "keep_going";
  return { status, ideas, note: flagged.length ? flagged[0].w.msg : null };
}

module.exports = { askJev, judge, buildRequest, MET, WRONG };
