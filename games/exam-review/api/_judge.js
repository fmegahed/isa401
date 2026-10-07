// Turns one written answer into a verdict with the TypeSafe Jev API.
// Jev does not write text. For each idea in the rubric it returns the probability that the
// student's answer contains it (a "noul" question), and the same for each known wrong claim.
// Every word a student sees comes from the rubric, never from the model.
// Used by api/check.js and by tests/run.mjs, so the tests exercise the same thresholds.
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

async function askJev(rubric, text, key) {
  let last = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(JEV_URL, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(buildRequest(rubric, text)),
    });
    if (r.ok) return (await r.json()).answers;
    last = "Jev HTTP " + r.status;
    if (r.status !== 429 && r.status !== 529) break;
    await new Promise((s) => setTimeout(s, 300 * (attempt + 1)));
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
