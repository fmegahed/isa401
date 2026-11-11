// "Replay the games": the last unit of the Exam 02 review, built from the games' own files every time
// build.mjs runs (content/exam02.mjs appends it). Nothing here is typed twice: prompts, options,
// answers, sources and rubrics come from the games, and their charts are copied into
// exam02/replays/<game>/ (Pie on Trial's are drawn from its data.js).
//   Game Day (Class 16)      games/game-day/content/questions.mjs, charts/; the two open questions
//                            become "explain" steps checked by Jev with the game's own rubric
//   Press Time (Class 18)    a redo card: the task from api/_copy.json, the numbers from api/_key.json
//   Map Gallery (Class 19)   a redo card: the plan rubric from api/_rubric.json, Butler County's rate
//                            from the course file data/ohio_covid_weekly.csv
//   Pie on Trial (Class 20)  games/pie-on-trial/data.js: the six charts, drawn to SVG here
//   Race Call (Class 22)     games/race-call/content/questions.mjs, charts/, reveal/; race 8 was an
//                            animation in class and is drawn here as one still frame
// "How the class answered" comes from data/game_mistakes.json when it exists (counts only, written by
// dev/pull_mistakes.mjs, which Fadel runs). Pie on Trial has no export, so it has no class counts.
//
// RACE CALL ANSWERS: this file, exam02/replays/race-call/ and units_exam02.json hold them; they were kept
// out of git and the deploy until Class 22 had ended (Mon Nov 9, 2026) and released on Nov 10.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(here, "..");
const GAMES = path.join(SITE, "..");
const COURSE_DATA = path.join(SITE, "..", "..", "data");
const OUT = "exam02/replays";            // relative to the site, as the page and build.mjs see it
const require = createRequire(import.meta.url);

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const n = (x) => Number(x).toLocaleString("en-US");
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
// copy (or write) a file into exam02/replays/<game>/ only when it changed, and return its site path
function put(game, name, from, text) {
  const dir = path.join(SITE, OUT, game), dest = path.join(dir, name);
  fs.mkdirSync(dir, { recursive: true });
  const buf = text !== undefined ? Buffer.from(text) : fs.readFileSync(from);
  if (!fs.existsSync(dest) || Buffer.compare(fs.readFileSync(dest), buf) !== 0) fs.writeFileSync(dest, buf);
  return `${OUT}/${game}/${name}`;
}
const fig = (src, alt, caption) => `<figure class="chart"><img src="${esc(src)}" alt="${esc(alt)}" loading="lazy"><figcaption>${caption || ""}</figcaption></figure>`;

const MISTAKES_FILE = path.join(SITE, "data", "game_mistakes.json");
const MISTAKES = fs.existsSync(MISTAKES_FILE) ? readJSON(MISTAKES_FILE) : {};
const stats = (key) => { const s = MISTAKES[key]; return s && s.n > 0 ? { right: s.right, n: s.n, top: s.top ?? null } : undefined; };

// ================================================================================================
// Game Day (Class 16)
const GD = path.join(GAMES, "game-day");
const gameDay = (await import(pathToFileURL(path.join(GD, "content", "questions.mjs")).href)).default;
const GDC = readJSON(path.join(GD, "data", "computed.json"));
const GD_META = {
  "fox-lie-meaning": { title: "What a lie factor of 4 means",
    alt: "Bar chart, U.S. adults who describe themselves as Christian: 77% in 2009 and 65% in 2019. The y-axis runs from 58% to 78%.",
    why: `<p>Lie factor = the size of the change in the graphic divided by the size of the change in the data. The data dropped from 77% to 65%, which is ${Math.round(GDC.fox.data_drop * 1000) / 10}% of 77. On an axis that starts at 58%, the bar shrinks from 19 points tall to 7, which is ${Math.round(GDC.fox.graphic_drop * 1000) / 10}%. ${Math.round(GDC.fox.graphic_drop * 1000) / 10} / ${Math.round(GDC.fox.data_drop * 1000) / 10} = about ${Math.round(GDC.fox.lie_factor)}: the drop looks about 4 times as large as it is.</p>` },
  "russia-squares": { title: "Squares for budgets",
    alt: "Two squares, Defense budgets, 2020 (US$ billion): a large square for Russia, $60.6B, and a tiny square for Ukraine, $4.32B.",
    why: `<p>The sides are in proportion to the budgets: ${GDC.russia.russia} / ${GDC.russia.ukraine} = ${GDC.russia.side_ratio.toFixed(0)} times. But the eye compares areas, and the area grows with the side squared: ${GDC.russia.side_ratio.toFixed(0)} x ${GDC.russia.side_ratio.toFixed(0)} = about ${Math.round(GDC.russia.area_ratio / 10) * 10}. Area is a weak channel for amounts; bars (length) would show 14 times as 14 times.</p>` },
  "possession-baseline": { title: "Time of possession",
    alt: "Bar chart of time of possession, Miami vs Akron, Oct 17, 2026: Miami 27:56 and Akron 32:04. The y-axis runs from 27:00 to 33:00.",
    why: `<p>Akron held the ball ${GDC.possession.akron} and Miami ${GDC.possession.miami}: a ratio of ${GDC.possession.data_ratio.toFixed(2)}. Drawn from 27:00, the bars are 304 and 56 seconds long, a ratio of about ${GDC.possession.drawn_ratio.toFixed(1)}. A bar's length is its value, so bars must start at zero. Printing the times on the bars does not fix what the eye sees first.</p>` },
  "miners-open": { title: "The mining company's chart",
    alt: "Three panels redrawn from a mining company's annual report: operating revenues, net income (loss), and exploration and development expenditures, 1970 to 1974. Each value is printed above its bar and there is no value axis. The 1970 net income is printed as $(11,014)." },
  "roster-nominal": { title: "Numbers that are labels",
    why: `<p>A jersey number is a label: two players wear #8 and two wear #22, and the average jersey number means nothing. Height and weight are ratio (a true zero); class is ordinal and is not a number at all.</p>` },
  "class-year-type": { title: "Class year",
    why: `<p>Fr, So, Jr, Sr and Gr have a natural order, but the distance between two levels is not a measured amount. Ordered categories without measured distances are ordinal.</p>` },
  "ratio-vs-interval": { title: "Crowds and temperatures",
    why: `<p>Attendance has a true zero (no fans), so a ratio means something: ${n(GDC.stevens.akron_att)} / ${n(GDC.stevens.hc_att)} = ${GDC.stevens.crowd_ratio.toFixed(2)}. Zero degrees Fahrenheit is not "no temperature", so degrees are interval: differences work, ratios do not. ${GDC.stevens.hc_temp} / ${GDC.stevens.akron_temp} = 1.43 does not mean 43% hotter.</p>` },
  "data-ink": { title: "Which ink is data?",
    alt: "Bar chart titled MIAMI POINTS PER GAME!! for 2021 to 2025: red bars with thick black outlines and dark shadows, on a green football-field background with white yard lines.",
    why: `<p>Data-ink is the ink that shows the data, and erasing it would lose information: here, the height of each red bar. The field, the yard lines and the shadows are decoration (chartjunk) and can all go.</p>` },
  "best-channel": { title: "The most accurate encoding",
    why: `<p>In Cleveland and McGill's experiments, readers judged position along a common axis most accurately. Angle, area and color intensity come much lower, which is why a dot plot or bar chart beats a pie, bubbles or shading for comparing values.</p>` },
  "diverging-palette": { title: "A palette for point differential",
    why: `<p>Point differential has a meaningful middle, 0 (a tie), with losses on one side and wins on the other. Values on both sides of a midpoint need a diverging palette: two hues that get darker away from zero.</p>` },
  "red-green": { title: "Red and green",
    alt: "Two panels of horizontal bars, Miami points by game in 2026 for seven opponents. Left, as drawn: wins in green and losses in red. Right, the same chart as a reader with deuteranopia sees it: wins and losses are the same olive color.",
    why: `<p>Under deuteranopia, red and green look alike, so a brighter red or wider bars do not help. Blue and orange stay apart for most readers with a color vision deficiency, and a W or L label works without any color at all.</p>` },
  "fill-mapping": { title: "What fill shows",
    alt: "Bar chart of points by quarter, Miami vs Akron, Oct 17, 2026: quarters Q1 to Q4 on the x-axis, points on the y-axis, red bars for Miami and gray bars for Akron side by side, with a legend.",
    why: `<p>The legend names the two fill colors: Miami and Akron. Quarter is on the x-axis and points on the y-axis: <code>aes(x = quarter, y = points, fill = team)</code> with <code>geom_col(position = "dodge")</code>.</p>` },
  "coord-change": { title: "One layer changed",
    alt: "Share of total yards, Miami vs Akron, Oct 17, 2026. Chart A: one stacked bar per team, split into rushing (red) and passing (gray). Chart B: the same shares drawn as one circle per team.",
    why: `<p>Same data, same mappings, same geom (stacked bars). Chart B adds <code>coord_polar(theta = "y")</code>: the coordinate system wraps each bar into a circle, which is how ggplot2 makes a pie.</p>` },
  "describe-open": { title: "Describe a chart in grammar",
    alt: "Horizontal bar chart, Miami point differential by game, 2026: seven opponents on the y-axis, Miami points minus opponent points on the x-axis, a vertical line at zero, bars filled red for home and gray for away, in two panels: Non-conference and MAC." },
};
const rosterTable = (t) => `<table><thead><tr>${t.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const gdSteps = [];
gameDay.forEach((q, i) => {
  const m = GD_META[q.id];
  if (!m) throw new Error(`Game Day question ${q.id} has no replay text; add it to GD_META`);
  const title = `Game Day ${i + 1}: ${m.title}`;
  const charts = q.chart ? [{ src: put("game-day", path.basename(q.chart), path.join(GD, q.chart)), alt: m.alt, caption: "From Game Day, Class 16." }] : undefined;
  if (q.kind === "choice") {
    gdSteps.push({ type: "choice", id: `x2-gd-${q.id}`, title, game: `Game Day, question ${i + 1} of ${gameDay.length}`,
      prompt: esc(q.prompt) + (q.table ? rosterTable(q.table) : ""), charts, options: q.options, answer: q.answer, why: m.why, source: q.source,
      stats: stats(`game-day:${q.id}`) });
  } else {
    // an open question: the game's rubric, checked by Jev as in the other units, then the strong
    // answer the projector showed (and the redrawn chart, if any) behind "Check your work"
    gdSteps.push({ type: "explain", id: `x2-gd-${q.id}`, title, prompt: esc(q.prompt), charts, context: q.context,
      ideas: q.ideas, wrong: q.wrong || [], tests: q.tests || [] });
    const fixed = q.fix ? fig(put("game-day", path.basename(q.fix), path.join(GD, q.fix)), "The mining company's chart redrawn: horizontal bars that start at zero on a dollar axis, with the 1970 net loss going left of zero.", "The redrawn chart from the reveal in class.") : "";
    gdSteps.push({ type: "task", title: `Game Day ${i + 1}: the answer shown in class`,
      html: `<p>Write your own answer above first. Then compare it with the strong answer the projector showed at the reveal.</p>`,
      check: q.model.map((s) => `<p><b>${esc(s.head)}</b></p><ul>${s.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`).join("") +
        (q.code ? `<p>In ggplot2: <code>${esc(q.code)}</code></p>` : "") + fixed });
  }
});

// ================================================================================================
// Pie on Trial (Class 20): the six charts, drawn from the game's own data.js
const PT = require(path.join(GAMES, "pie-on-trial", "data.js"));
const ptSteps = PT.CHARTS.map((c) => {
  const svg = PT.chartSVG(c).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" font-family="Segoe UI, Roboto, Arial, sans-serif" ');
  const src = put("pie-on-trial", `chart${c.n}_${c.form}.svg`, null, svg);
  const d = PT.DATASETS[c.dataset], big = PT.LETTERS[c.answer];
  const values = d.values.map((v, i) => `${PT.LETTERS[i]} ${v}`).join(", ");
  const pie = c.form === "pie";
  return { type: "choice", id: `x2-pot-chart${c.n}`, title: `Pie on Trial ${c.n}: ${pie ? "the pie" : "the bars"} (${d.label.toLowerCase()} data)`,
    game: `Pie on Trial, chart ${c.n} of ${PT.CHARTS.length}`,
    prompt: `${pie ? "Which slice is the largest?" : "Which bar is the largest?"} In class you had ${PT.SECONDS} seconds.`,
    charts: [{ src, alt: pie ? "Pie chart with five slices labeled a to e, colored yellow, green, teal, blue and purple." : "Bar chart with five bars labeled a to e on an axis from 0 to 25.", caption: `From Pie on Trial, Class 20. ${pie ? "Pie" : "Bar"} chart ${c.n} of 6.` }],
    options: PT.LETTERS.slice(), answer: c.answer,
    why: pie
      ? `<p>The values were ${values} (percent), so <b>${big}</b> was the largest. Slices this close differ by only a few degrees of angle, so a pie makes you guess. Chart ${c.n + 3} shows the same values as bars.</p>`
      : `<p>The same values as pie ${c.n - 3}: ${values} (percent), so <b>${big}</b> was the largest. On a common axis, even a difference of 1 or 2 points shows as a different height. Bars came second in the game, so they had a practice advantage, and the values were close on purpose.</p>`,
    source: "Values from the data-to-viz pie caveat (https://www.data-to-viz.com/caveat/pie.html), adjusted to whole percents, as in the Class 20 slides.",
  };
});

// ================================================================================================
// Race Call (Class 22)
const RC = path.join(GAMES, "race-call");
const raceCall = (await import(pathToFileURL(path.join(RC, "content", "questions.mjs")).href)).default;
const RC_ALT = {
  "q01_donut.svg": "Donut chart, most important issue to your vote, national exit poll of 2024 voters: state of democracy 35%, the economy 31%, abortion 14%, immigration 11%, foreign policy 4%, other or no answer 5%, each issue in its own color with a legend.",
  "q03_waterfall.svg": "Chart of the Democratic ticket's electoral votes, 2020 to 2024: a full bar for 306 in 2020, then floating steps for the census (-3) and six states (AZ -11, GA -16, MI -15, NV -6, PA -19, WI -10), ending in a full bar for 226 in 2024. A dashed line marks 270 to win.",
  "q04_two.svg": "Two charts of the Republican ticket's electoral votes: A, a bar chart with 232 in 2020 and 312 in 2024; B, a line chart joining the same two values on a year axis from 2020 to 2024.",
  "q05_annual.svg": "Bar chart of international airline passengers per year (thousands), 1949 to 1960: the bars rise every year, from about 1,500 to about 5,700.",
  "q06_2022.svg": "Line chart of job postings on Indeed in Ohio, 2022 (index, Feb 1, 2020 = 100): it rises from about 153 to about 158 by spring, then falls to about 142 in December.",
  "q07_calendar.svg": "Calendar plot of traffic crashes per day in Cincinnati, 2025: a small grid per month, each square one day, columns running Sunday to Saturday, darker red for more crashes.",
  "q09_counties.svg": "U.S. map of the 2024 presidential results by county: each county filled red where Trump won and blue where Harris won. Red covers most of the land; Alaska and Connecticut are gray.",
  "q11_ohio.svg": "Three maps of Ohio's 2024 margin by county (Trump % minus Harris %): Map A with a different unordered color for each range, Map B in one purple hue from light to dark, Map C in blue and red on either side of white.",
  "q12_barley.svg": "Dot plots of barley yield by variety (bushels per acre) at six Minnesota sites: Waseca, Crookston, Morris, University Farm, Duluth and Grand Rapids. Each panel shows ten varieties, with 1932 and 1931 as circles of two colors.",
  "q13_small.svg": "Six small maps of Ohio, weekly COVID cases per 100,000 by county, on Sep 5, 2020; Dec 12, 2020; Jun 5, 2021; Sep 18, 2021; Jan 15, 2022; and Apr 2, 2022, all on one color scale from under 50 to 1,000 or more.",
};
const RC_REVEAL_ALT = {
  "r01_bars.svg": "The same exit-poll shares as sorted horizontal bars: state of democracy 35%, the economy 31%, abortion 14%, immigration 11%, foreign policy 4%.",
  "r02_channels.svg": "The donut chart again, titled: issue = color, share = angle and area, among the least accurate channels for comparing amounts.",
  "r03_waterfall.svg": "The waterfall chart again, subtitled: each bar starts where the last ended, 306 - 3 (census) - 77 (six states) = 226.",
  "r04_line.svg": "The line chart from 232 in 2020 to 312 in 2024, with a marker at 2022 labeled: the line claims about 272 votes in 2022, and no election was held.",
  "r05_monthly.svg": "Monthly airline passengers, 1949 to 1960, with July marked in gold: a summer peak every year, and the swings grow with the trend.",
  "r06_five.svg": "Ohio job postings on Indeed, 2022 to 2026, with 2022 shaded: the 2022 hump never repeats; the index declines to about 105.",
  "r07_calendar.svg": "The crash calendar with the weekend columns outlined in gold: weekdays averaged 43.8 crashes a day, weekends 34.0.",
  "r10_bubbles.svg": "U.S. symbol map of the same 2024 results: one circle per county, its area the votes cast, red for Trump and blue for Harris; large blue circles sit on the cities.",
  "r11_diverging.svg": "Ohio margin map with a diverging scale from Harris +70 (blue) through a tie (white) to Trump +70 (red), from Cuyahoga (Harris +32) to Holmes (Trump +69).",
  "r12_barley.svg": "The barley dot plots with the Morris panel outlined: at Morris, 1932 averaged 41.5 and 1931 averaged 29.3.",
};
// titles that name the race, not its answer
const RC_TITLE = {
  "exit-donut": "the exit poll's chart", "pie-channels": "encoding channels", "ev-waterfall": "electoral votes, 2020 to 2024",
  "two-points": "two values", "air-annual": "airline passengers per year", "one-year": "one year of job postings",
  calendar: "a calendar of crashes", motion: "a motion chart", choropleth: "county results map", "land-vs-people": "land and votes",
  "ohio-palette": "a color scheme for margins", barley: "barley at six sites", "small-multiples": "small multiples or animation",
};
// race 8 was an animation (anim.js); here it is one frame, drawn the same way
function gapminderStill(D, k) {
  const CONT = { Africa: "#E69F00", Americas: "#CC79A7", Asia: "#009E73", Europe: "#0072B2", Oceania: "#1A1A1A" };
  const W = 800, H = 500, L = 70, R = 130, T = 46, B = 56, out = [];
  const x = (g) => L + (Math.log10(g) - Math.log10(200)) / (Math.log10(150000) - Math.log10(200)) * (W - L - R);
  const y = (l) => H - B - (l - 20) / (88 - 20) * (H - T - B);
  out.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>`);
  out.push(`<text x="${L + (W - L - R) / 2}" y="${H - B - 40}" text-anchor="middle" font-size="150" font-weight="800" fill="#EEF0F2">${D.years[k]}</text>`);
  for (const g of [300, 1000, 3000, 10000, 30000, 100000]) out.push(`<line x1="${x(g)}" x2="${x(g)}" y1="${T}" y2="${H - B}" stroke="#E6E8EA"/><text x="${x(g)}" y="${H - B + 22}" text-anchor="middle" font-size="15" fill="#444">${g >= 1000 ? "$" + g / 1000 + "k" : "$" + g}</text>`);
  for (const l of [30, 40, 50, 60, 70, 80]) out.push(`<line x1="${L}" x2="${W - R}" y1="${y(l)}" y2="${y(l)}" stroke="#E6E8EA"/><text x="${L - 10}" y="${y(l) + 5}" text-anchor="end" font-size="15" fill="#444">${l}</text>`);
  out.push(`<text x="${L + (W - L - R) / 2}" y="${H - 12}" text-anchor="middle" font-size="16" fill="#222" font-weight="600">Income per person (GDP per capita, log scale)</text>`);
  out.push(`<text x="18" y="${T + (H - T - B) / 2}" text-anchor="middle" font-size="16" fill="#222" font-weight="600" transform="rotate(-90 18 ${T + (H - T - B) / 2})">Life expectancy (years)</text>`);
  out.push(`<text x="${L}" y="28" font-size="20" font-weight="700" fill="#1B1B1B">Income and life expectancy, ${D.countries.length} countries</text>`);
  D.continents.forEach((c, i) => out.push(`<circle cx="${W - R + 26}" cy="${T + 14 + i * 26}" r="7" fill="${CONT[c]}" fill-opacity="0.8"/><text x="${W - R + 40}" y="${T + 19 + i * 26}" font-size="15" fill="#222">${c}</text>`));
  const maxPop = Math.max(...D.countries.map((c) => Math.max(...c.pop)));
  const rad = (p) => 3 + 34 * Math.sqrt(p / maxPop);
  [...D.countries].sort((a, b) => b.pop[k] - a.pop[k]).forEach((c) =>
    out.push(`<circle cx="${x(c.gdp[k]).toFixed(1)}" cy="${y(c.life[k]).toFixed(1)}" r="${rad(c.pop[k]).toFixed(1)}" fill="${CONT[c.continent]}" fill-opacity="0.72" stroke="#fff" stroke-width="0.8"/>`));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Roboto, Arial, sans-serif">${out.join("")}</svg>`;
}
const rcSteps = raceCall.map((q, i) => {
  let charts;
  if (q.chart) {
    const name = path.basename(q.chart);
    if (!RC_ALT[name]) throw new Error(`Race Call chart ${name} has no alt text; add it to RC_ALT`);
    charts = [{ src: put("race-call", name, path.join(RC, q.chart)), alt: RC_ALT[name], caption: "From Race Call, Class 22." }];
  } else if (q.anim === "gapminder") {
    const D = readJSON(path.join(RC, "charts", "gapminder.json")), k = D.years.length - 1;
    charts = [{ src: put("race-call", "gapminder_still.svg", null, gapminderStill(D, k)),
      alt: `One frame (${D.years[k]}) of a motion chart of ${D.countries.length} countries: income per person on a log x-axis, life expectancy on the y-axis, bubble size for population, color for continent, and the year in large type behind the bubbles.`,
      caption: `One still frame (${D.years[k]}) of the motion chart from Race Call. In class it played from ${D.years[0]} to ${D.years[k]}, one frame after another.` }];
  } else throw new Error(`Race Call ${q.id}: no chart and no known animation`);
  // the chart shown at the reveal: an annotated version of the question chart, or a contrast chart
  const after = q.reveal || q.extra;
  const shown = after ? fig(put("race-call", path.basename(after), path.join(RC, after)), RC_REVEAL_ALT[path.basename(after)] || "The chart shown at the reveal in class.", q.extraCap ? esc(q.extraCap) + "." : "The chart shown at the reveal in class.") : "";
  const takeaway = q.takeaway.replace(" (at right)", "");   // the projector showed the animation beside it
  return { type: "choice", id: `x2-rc-${q.id}`, title: `Race Call ${i + 1}: ${RC_TITLE[q.id] || q.call}`, game: `Race Call, race ${i + 1} of ${raceCall.length}`,
    prompt: esc(q.prompt), charts, options: q.options, answer: q.answer,
    why: `<p><b>${esc(q.call)}.</b> ${esc(takeaway)}</p>${shown}`, source: q.source, stats: stats(`race-call:${q.id}`) };
});

// ================================================================================================
// Redo cards: Press Time (Class 18) and the Map Gallery (Class 19)
const PTK = readJSON(path.join(GAMES, "press-time", "api", "_key.json"));
const PTC = readJSON(path.join(GAMES, "press-time", "api", "_copy.json"));
const share = (key, what) => { const s = stats(key); return s ? `${Math.round(100 * s.right)}% of the ${s.n} analysts ${what}` : null; };
const ptClass = [share("press-time:q2", "reported Butler's cases right"), share("press-time:q3", "reported its population right")].filter(Boolean);
const deb = PTC.debrief;
const pressTime = { type: "task", title: "Press Time: redo it",
  html: `<p><b>Press Time, Class 18.</b> In 15 minutes, with Tableau (or Power BI) and <code>covid_cases_county.csv</code> (on Canvas, the Class 18 file), make:</p>
<ol><li>a map of the total number of COVID cases by county; and</li><li>a table of the population of the counties in Ohio.</li></ol>
<p>Then read Butler County, OH's two numbers off your own work: its total cases (hover over it on the map) and its population (its row in the table). Save the workbook so someone else could open it.</p>
<p><b>Before you drag a measure:</b> what is one row of this file?</p>`,
  check: `<p><b>Butler County, OH: ${n(PTK.key.cases)} cases and ${n(PTK.key.pop)} people.</b> Cases are the running total on the last date, ${esc(PTK.key.date)}.</p>
<p><b>The SUM trap.</b> One row is one county on one day, and Butler County has ${n(PTK.sums.butler_rows)} rows. Its population, ${n(PTK.key.pop)}, is on every one of them, so Tableau's default SUM adds it ${n(PTK.sums.butler_rows)} times: ${n(PTK.sums.butler_pop)} people, more than the ${n(PTK.sums.us_pop)} in the whole United States. Confirmed cases is already a running total, so SUM adds ${n(PTK.sums.butler_rows)} running totals: ${n(PTK.sums.butler_cases)}.</p>
<ul>${deb.panels.map((p) => `<li><b>${esc(p.h)}.</b> ${esc(p.fix)}</li>`).join("")}</ul>
<p>${esc(deb.q1)}</p>${ptClass.length ? `<p class="classline"><b>In class:</b> ${ptClass.join("; ")}.</p>` : ""}` };

const MG = readJSON(path.join(GAMES, "map-gallery", "api", "_rubric.json"));
// Butler County's rate on the last week of the course file the game used
const rows = fs.readFileSync(path.join(COURSE_DATA, "ohio_covid_weekly.csv"), "utf8").trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
const lastWeek = rows.reduce((m, r) => (r[0] > m ? r[0] : m), "");
const rates = rows.filter((r) => r[0] === lastWeek).map((r) => ({ county: r[2].replace(/ County$/, ""), rate: (Number(r[4]) / Number(r[3])) * 1e5 })).sort((a, b) => b.rate - a.rate);
const butler = rates.findIndex((r) => r.county === "Butler");
if (butler < 0 || rates.length !== 88) throw new Error("ohio_covid_weekly.csv: expected 88 counties including Butler on the last week");
const ordinal = (k) => k + ([, "st", "nd", "rd"][(k % 100 >> 3 ^ 1) && k % 10] || "th");
const r0 = (x) => n(Math.round(x));
const ohioRate = rows.filter((r) => r[0] === lastWeek).reduce((a, r) => [a[0] + Number(r[4]), a[1] + Number(r[3])], [0, 0]);
// the plan rubric's nine points, in the words of the rubric's own "yes" criteria, written for students
const MG_POINTS = {
  running_total: "Cases are a running total: map the latest week (or the maximum, or week-to-week changes), never the weeks added up.",
  per_capita: "A rate, not a count: cases per 100,000 residents (cases divided by population), so large counties do not stand out just for their size.",
  title: "A title that says what is shown (the measure, the place, the period) or states the finding.",
  butler: "Butler County singled out: an outline, a highlight, a label or a callout.",
  scale: "A sequential scale (one hue, light to dark), or a diverging scale centered on Butler County's value.",
  time: "Change over time: a line chart, small multiples, several dates or an animation.",
  touches: "A finishing touch: a source caption, key words emphasized, or a styling choice of your own.",
  values: "Some rate values on the map itself, such as Butler County's or the highest.",
  clean: "A clean map: no needless gridlines, axes or clutter.",
};
for (const i of MG.ideas) if (!MG_POINTS[i.key]) throw new Error(`Map Gallery rubric point ${i.key} has no student wording; add it to MG_POINTS`);
const mgClass = [share("map-gallery:rate_map", "in class mapped a rate"), share("map-gallery:butler_captured", "made Butler County stand out")].filter(Boolean);
const mapGallery = { type: "task", title: "Map Gallery: redo it",
  html: `<p><b>Map Gallery, Class 19.</b> The question: <i>How did Butler County's COVID experience compare with the rest of Ohio?</i></p>
<p>Data: <code>ohio_covid_weekly.csv</code> and <code>ohio_counties.geojson</code> (on Canvas, the Class 19 files). One row per Ohio county per week, March 2020 to December 2022, with the columns date, state, county, population and confirmed_cases.</p>
<ol><li><b>Plan first, before any AI tool:</b> who the map is for and what they should take away; the number each county shows; the time period; how Butler County will stand out; colors and legend; a title; one creative idea; and your first prompt to the AI.</li>
<li><b>Build</b> a choropleth map with any AI chat tool, Tableau or Power BI. Keep count of your prompts.</li>
<li><b>Check</b> your plan and your map against the points behind the button.</li></ol>`,
  check: `<p>The points the plans were checked against in class:</p><ol>${MG.ideas.map((i) => `<li>${esc(MG_POINTS[i.key])}</li>`).join("")}</ol>
<p><b>The classic mistakes:</b> adding up confirmed_cases over the weeks (it is already a running total), and adding up population over the weekly rows.</p>
<p><b>Numbers to check against</b> (the last week, ${esc(lastWeek)}): Butler County had ${r0(rates[butler].rate)} cases per 100,000 residents, ${ordinal(butler + 1)} of Ohio's ${rates.length} counties from the top; Ohio as a whole had ${r0((ohioRate[0] / ohioRate[1]) * 1e5)}. The counties ran from ${esc(rates[rates.length - 1].county)} (${r0(rates[rates.length - 1].rate)}) to ${esc(rates[0].county)} (${r0(rates[0].rate)}).</p>${mgClass.length ? `<p class="classline"><b>In class:</b> ${mgClass.join("; ")}.</p>` : ""}` };

// ================================================================================================
const hasStats = (steps) => steps.some((s) => s.stats);
// Race Call is played in Class 22 (Mon Nov 9, 2026), so its answers are held off the site until that class has ended
// (Fadel, Nov 5: deploy now without Race Call). After the class: set HOLD_RACE_CALL to false, remove
// exam02/replays/race-call from .vercelignore, restore the two Race Call lines in index.html, rebuild, and deploy.
const HOLD_RACE_CALL = false;   // released Nov 10, 2026, after Class 22 (Fadel)
export default [{
  id: "replay", title: "Replay the games", classes: HOLD_RACE_CALL ? "Classes 16 to 20" : "Classes 16 to 22",
  blurb: (HOLD_RACE_CALL ? "Game Day and Pie on Trial" : "Game Day, Pie on Trial and Race Call") + " at your own pace, with the answers and how the class answered, plus redo cards for Press Time and the Map Gallery." + (HOLD_RACE_CALL ? " Race Call is added after Class 22." : ""),
  tags: [],
  links: { slides: [
    { label: "Class 16 slides", url: "https://fmegahed.github.io/isa401/fall2026/class16/16_grammar_of_graphics.html" },
    { label: "Class 18 lab", url: "https://github.com/fmegahed/isa401/blob/main/lectures/18_lab_powerbi/18_powerbi_lab.pdf" },
    { label: "Class 19 lab", url: "https://github.com/fmegahed/isa401/blob/main/lectures/19_lab_ai_maps/19_ai_maps_lab.pdf" },
    { label: "Class 20 slides", url: "https://fmegahed.github.io/isa401/fall2026/class20/20_commonly_used_charts.html" },
    { label: "Class 22 slides", url: "https://fmegahed.github.io/isa401/fall2026/class22/22_high_dimensional_charts.html" },
  ], code: [] },
  steps: [
    { type: "read", title: "Game Day (Class 16)", html: `<p>The ${gameDay.length} questions of Game Day at Yager, in the order they were played: distortion, data-ink and data types, encodings and color, and the grammar of graphics. Pick an answer and press <b>Check</b> to see the answer and why${hasStats(gdSteps) ? ", and how the class answered" : ""}. Questions 4 and 14 were open questions: write your answer and it is checked as you type, as in the other units.</p>` },
    ...gdSteps,
    { type: "read", title: "Press Time (Class 18) and the Map Gallery (Class 19)", html: "<p>The two build challenges, to do again on your own. Each card gives the task and the data; open <b>Check your work</b> when you are done.</p>" },
    pressTime,
    mapGallery,
    { type: "read", title: "Pie on Trial (Class 20)", html: `<p>The two-minute game from Class 20: three sets of values drawn as pies, then the same three as bars. Find the largest slice or bar. The game kept no record of who answered what, so there is no class count here.</p>` },
    ...ptSteps,
    ...(HOLD_RACE_CALL ? [] : [
      { type: "read", title: "Race Call (Class 22)", html: `<p>The ${raceCall.length} races of Race Call, the election-night chart game that opened Class 22: commonly used charts, time series, maps, and space and time. Race 8 was an animated chart in class; here it is one still frame.</p>` },
      ...rcSteps]),
  ],
}];
