// POST /api/check  {section, seat, stage, answer}
// Stage 0 checks a seat in. Stages 1-3 compare the answer with api/_data.json
// (never served), record progress in Redis, and on a miss return a hint that
// names the likely mistake in R terms. Stages unlock in order; nothing locks.
const { redis, runId, runKey, sendJSON, readBody, SECTIONS, SEAT_RE, TOP } = require("./_store");
const { DATA } = require("./_site");

const A = DATA.answers;
const REG = "https://isa401-salvage.vercel.app/registry?start=";

const num = (s) => {
  const t = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return t ? Number(t[0]) : NaN;
};

function judge(stage, raw) {
  const a = String(raw || "").trim();
  if (stage === 1) {
    const n = num(a);
    if (n === A["1"] && /^\s*\d+\s*$/.test(a)) return { ok: true };
    if (!a || Number.isNaN(n)) return { hint: `A whole number. Read page 1 with page = rvest::read_html("${REG}1"), pull the class text with html_elements() and html_text2(), then count: sum(classes == "Dreadnought").` };
    const why = DATA.wrong["1"][String(n)];
    if (why === "all_pages") return { hint: "That is every Dreadnought in the whole registry. Stage 1 is about the first page only, the one whose address ends in ?start=1." };
    if (why === "cards") return { hint: "50 is the number of cards, length() of your result. You were close: now count only the Dreadnoughts, sum(classes == \"Dreadnought\")." };
    if (why && why.startsWith("class:")) return { hint: `${n} is how many ${why.slice(6)}s are on page 1. The question asks about Dreadnoughts. R is case-sensitive: compare with "Dreadnought", capital D.` };
    if (n < A["1"]) return { hint: "Too few. Your selector is missing some cards. Check length() first: a good selector returns one class per card, 50 in all. Right-click a card, Inspect, and look at which element holds the class text. A > in a selector means direct child only, which is easy to get wrong." };
    return { hint: "Not that count. Select the class of every card on page 1 (check that length() is 50) and count the ones equal to \"Dreadnought\"." };
  }
  if (stage === 2) {
    const n = num(a);
    if (n === A["2"]) return { ok: true };
    if (!a || Number.isNaN(n)) return { hint: "A number. Open the registry, click Next, and compare the start= value at the end of the address before and after." };
    if (n === 1) return { hint: "1 is how much the page number goes up. Look at the start= part of the address instead: page 1 is start=1, page 2 is start=51." };
    if (n === 51) return { hint: "51 is the start value of page 2. The question asks how much it changed: from start=1 to start=51." };
    if (n === 49) return { hint: "Off by one. Page 1 is start=1 and page 2 is start=51. Subtract." };
    if (n === 400) return { hint: "400 is how many wrecks the registry holds. Compare the start= value of two pages next to each other." };
    if (n === 8) return { hint: "8 is how many pages there are. The question asks how much start= changes from one page to the next." };
    if (n > A["2"] && n % A["2"] === 0) return { hint: `${n} is the jump across ${n / A["2"]} pages. Compare two pages next to each other: click Next once.` };
    return { hint: "Click Next once and compare the start= value in the address bar before and after. How much did it go up?" };
  }
  if (stage === 3) {
    const n = num(a);
    if (!Number.isNaN(n) && Math.abs(n - A["3"]) <= 0.051) return { ok: true };
    if (!a || Number.isNaN(n)) return { hint: "A number in MCr, like 123.4. readr::parse_number(\"12.4 MCr\") turns the text into 12.4." };
    const key = n.toFixed(1), why = DATA.wrong["3"][key];
    if (why === "page1_only") return { hint: "That is page 1 only. Loop over every page: for (s in seq(1, 351, by = 50)) { ... read_html(paste0(url, s)) ... }." };
    if (why === "start_1_to_8") return { hint: "It looks like you looped over start = 1:8. start is a wreck number, not a page number: start=2 shows wrecks 2-51, so the pages overlap. The starts are seq(1, 351, by = 50)." };
    if (why === "start_50_by_50") return { hint: "Your total misses the first page. start=50 shows wrecks 50-99, and the registry counts from 1. Use seq(1, 351, by = 50): 1, 51, 101, ..., 351." };
    if (why === "all_classes") return { hint: "That is the salvage value of every wreck. Keep only the rows whose class is \"Dreadnought\" before you sum." };
    if (why && why.startsWith("pages:")) return { hint: `That is the total over the first ${why.slice(6)} pages. The registry holds 400 wrecks at 50 a page, so 8 pages. Check that your sequence of start values ends at 351.` };
    if (Math.abs(n - A["3"]) < 30) return { hint: "Close, but not exact. Check that each page's class and value vectors line up (both from \".wreck ...\") and that every value went through readr::parse_number()." };
    return { hint: "Build one data frame with a row per wreck: in a for loop over seq(1, 351, by = 50), read each page, take \".wreck .ship-class\" and \".wreck .salvage-value\", and bind the rows. Then sum(value[class == \"Dreadnought\"])." };
  }
  return { hint: "Unknown stage." };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return sendJSON(res, 405, { error: "POST only" });
  const b = readBody(req);
  const section = String(b.section || "").toUpperCase();
  const seat = String(b.seat || "").toUpperCase();
  const stage = Number(b.stage);
  if (!SECTIONS.includes(section) || !SEAT_RE.test(seat) || !Number.isInteger(stage) || stage < 0 || stage > TOP) {
    return sendJSON(res, 400, { error: "bad section, seat, or stage" });
  }
  try {
    const id = await runId(section);
    const key = runKey(section, id);                    // hash: seat -> {level, t:{stage: ms}, miss:{stage: n}, rank?}
    const raw = await redis("HGET", key, seat);
    const cur = raw ? JSON.parse(raw) : { level: -1, t: {}, miss: {} };
    if (stage > cur.level + 1) return sendJSON(res, 409, { ok: false, runId: id, level: cur.level, hint: `Clear stage ${cur.level + 1} first.` });
    const verdict = stage === 0 ? { ok: true } : judge(stage, b.answer);
    if (verdict.ok) {
      if (stage > cur.level) {
        cur.level = stage;
        cur.t[stage] = Date.now();
        if (stage === TOP && cur.rank == null) cur.rank = await redis("INCR", `${key}:finishers`);
      }
    } else {
      cur.miss[stage] = (cur.miss[stage] || 0) + 1;
    }
    await redis("HSET", key, seat, JSON.stringify(cur));
    await redis("EXPIRE", key, 60 * 60 * 24 * 30);
    const present = Number((await redis("HLEN", key)) || 0);
    const done = Number((await redis("GET", `${key}:finishers`)) || 0);
    return sendJSON(res, 200, { ok: !!verdict.ok, hint: verdict.hint || null, runId: id, seat, level: cur.level, rank: cur.rank ?? null, present, done });
  } catch (e) {
    return sendJSON(res, 500, { error: String(e.message || e) });
  }
};
module.exports.judge = judge;
