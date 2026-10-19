// Content of "Game Day at Yager": 14 questions in play order, split by build.mjs into
//   questions.json          public: prompt, chart or table, options, source (no answers, no rubrics)
//   api/_questions.json     server only: the answer index of each choice question and the Jev rubric
//                           of each open question
//   tests/jev_cases.json    sample answers each open question is tested against (tests/run_jev.mjs)
// Every number in a prompt or option comes from data/computed.json, written by make_charts.R from
// the CSVs in data/ (sources in data/SOURCES.md).
//
// An open question lists 2 or 3 ideas. For each idea Jev is asked one yes/no question about the
// student's answer; `wrong` lists known wrong claims. `tests` are sample answers with the verdict we
// expect: [1, 0, 0] means idea 1 covered, ideas 2 and 3 not; null means either verdict is fine.

import fs from "node:fs";
const C = JSON.parse(fs.readFileSync(new URL("../data/computed.json", import.meta.url), "utf8"));

const idea = (label, hint, claim) => ({
  label, hint,
  ask: `Does the student's answer say that ${claim}?`,
  yes: `The answer states or clearly paraphrases that ${claim}.`,
  no: "The answer does not say this, says something too vague to tell, or says the opposite.",
});
const wrong = (claim, msg) => ({
  ask: `Does the student's answer claim that ${claim}?`,
  yes: `The answer asserts that ${claim}.`,
  no: "The answer does not assert this. It may not mention it, or may reject it.",
  msg,
});
const t = (text, ideas, kind, isWrong = false) => ({ text, ideas, wrong: isWrong, kind });

const n = (x) => x.toLocaleString("en-US");
const P = C.possession, S = C.stevens, Q = C.quarters, Y = C.yards, M = C.margin;

const LINK = {
  pew: "https://www.pewresearch.org/religion/2019/10/17/in-u-s-decline-of-christianity-continues-at-rapid-pace/",
  fox: "https://video.foxnews.com/v/6274513508001",
  russia: "https://x.com/CedScherer/status/1498593405408059394",
  tufte: "https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/",
  roster: C.roster.source_url,
  akron: S.akron_url,
  holycross: S.hc_url,
  family: "https://miamioh.edu/news/2026/10/family-weekend-puts-focus-on-miami-traditions-oct-16-18.html",
  schedule2026: "https://miamiredhawks.com/sports/football/schedule/2026",
  recordbook: "https://miamiredhawks.com/documents/2026/6/17/2026_FB_Record_Book.pdf",
  cleveland: "https://doi.org/10.1080/01621459.1984.10478080",
  stevens: "https://doi.org/10.1126/science.103.2684.677",
  machado: "https://doi.org/10.1109/TVCG.2009.113",
};

export default [
  // ---------------- First quarter: Distortion ----------------
  {
    id: "fox-lie-meaning", quarter: 1, kind: "choice", seconds: 30,
    prompt: "This chart of U.S. adults who describe themselves as Christian has a lie factor of about 4. What does that mean?",
    chart: "charts/fox.svg",
    options: [
      "The values are off by about 4 percentage points",
      "The drop looks about 4 times as large as it really is",
      "The chart shows the drop at about a quarter of its real size",
      "About 4 of the values on the chart are wrong",
    ],
    answer: 1,   // graphic drop (77-58 to 65-58) = 63.2%, data drop 12/77 = 15.6%, 63.2 / 15.6 = 4.05
    check: () => Math.round(C.fox.lie_factor) === 4,
    source: `Pew Research Center (2019), values shown in a Fox News chart with a y-axis from 58%; redrawn. ${LINK.pew} ; ${LINK.fox}`,
  },
  {
    id: "russia-squares", quarter: 1, kind: "choice", seconds: 30,
    prompt: "Each square's side is proportional to the country's defense budget. By area, how many times larger does Russia's square look than Ukraine's?",
    chart: "charts/russia.svg",
    options: ["About 14", "About 4", "About 200", "About 10"],
    answer: 2,   // side ratio 60.6 / 4.32 = 14.0; area ratio 14.0^2 = 197 (about 200); sqrt(14) = 3.7 (about 4)
    check: () => Math.round(C.russia.area_ratio) === 197 && Math.round(C.russia.side_ratio) === 14 && C.russia.sqrt_ratio.toFixed(2).startsWith("3.7"),
    source: `Values printed on a squares chart shared by Cedric Scherer (2022), original outlet unclear; redrawn. ${LINK.russia}`,
  },
  {
    id: "possession-baseline", quarter: 1, kind: "choice", seconds: 30,
    prompt: `This chart shows time of possession in Miami's Oct 17, 2026 game against Akron: Miami ${P.miami}, Akron ${P.akron}. What is the main problem with it?`,
    chart: "charts/possession.svg",
    options: [
      "The axis starts at 27:00, not at zero",
      "Clock times are ordinal, so bars do not fit",
      "No problem: Akron had the ball about 5 times as long",
      "No problem: the times are printed on the bars",
    ],
    answer: 0,   // data: 32:04 / 27:56 = 1.148; drawn from 27:00: 304 s / 56 s = 5.43; lie factor 29.9
    check: () => P.data_ratio.toFixed(2) === "1.15" && Math.round(P.drawn_ratio) === 5,
    source: `Miami vs Akron box score, Oct 17, 2026. ${LINK.akron}`,
  },
  {
    id: "miners-open", quarter: 1, kind: "open", seconds: 90,
    prompt: "This chart is redrawn from a mining company's annual report. What is misleading about it, and how would you fix it?",
    chart: "charts/miners.svg",
    source: `Tufte, E. R. (2001). The Visual Display of Quantitative Information (2nd ed.), p. 54; redrawn without the photographs; bar heights approximate the original's distortion; values exact. ${LINK.tufte}`,
    context:
      "A redrawn chart from a mining company's annual report, in three side-by-side panels titled 'Operating revenues', " +
      "'Net income (loss)' and 'Exploration and development expenditures'. Each panel has five gray bars for 1970 to 1974 " +
      "(labeled '70 to '74), with the dollar value printed above each bar. There is no y-axis and no zero line. " +
      "Values: operating revenues $3,549,385, $4,520,362, $4,916,444, $6,814,503, $7,382,599; net income $(11,014), " +
      "$397,747, $521,943, $1,647,001, $1,435,102; exploration $351,341, $85,149, $75,243, $329,421, $1,226,007. " +
      "In every panel the tallest bar ($7,382,599, $1,647,001 and $1,226,007) is drawn at exactly the same height, and the " +
      "shortest bar in every panel is still about 30% as tall as the tallest, so bar heights are not proportional to the values. " +
      "In the net income panel, the 1970 value is a loss printed as $(11,014), but its bar points upward from the bottom like " +
      "the profits, about 30% as tall as the $1,647,001 bar.",
    ideas: [
      idea("The 1970 loss is drawn as a positive bar",
        "Read the 1970 label in the net income panel. Which way does its bar point?",
        "the 1970 net income is a loss (a negative value) but its bar is drawn upward like a profit or positive value"),
      idea("Bar heights are not proportional: no zero baseline or common scale",
        "Compare $75,243 with $351,341, or the tallest bars of the three panels.",
        "the bar heights are not proportional to the dollar values, because the bars do not start at a zero baseline or the panels do not share one scale (for example, bars for very different amounts look about the same height)"),
      idea("A concrete fix",
        "Say how you would redraw it.",
        "a concrete way to redraw the chart, such as starting every bar at a zero baseline, drawing the loss as a bar below or to the left of zero, adding a value axis that starts at zero, putting all panels on one common scale, or switching to horizontal bars so the dollar labels read left to right"),
    ],
    model: [
      { head: "What misleads", items: [
        "The bars do not start at zero, so heights are not proportional to the dollars: $75,243 looks almost as tall as $351,341.",
        "The 1970 net loss of $11,014 is drawn as an upward bar, like a profit.",
        "Each panel has its own hidden scale: the tallest bars ($7.38M, $1.65M, $1.23M) are drawn the same height, so comparisons across panels mislead.",
        "There is no value axis, so the size of a bar means nothing without its printed label.",
        "The dollar labels run sideways, which makes them hard to read.",
      ] },
      { head: "Fixes", items: [
        "Start every bar at zero on a labeled dollar axis.",
        "Draw the 1970 loss below (or left of) zero.",
        "Show each panel's scale, or put the panels on one common axis to compare across them.",
        "Use horizontal bars so the dollar labels read left to right.",
      ] },
    ],
    fix: "charts/miners_fix.svg",
    wrong: [wrong("nothing is misleading because every bar has its dollar value printed on it",
      "The printed values do not fix the drawing: readers see the bar heights first.")],
    tests: [
      t("The 1970 net income was a loss of $11,014, yet its bar points up like a profit. The bars also do not start at zero, so a tiny value like $75,243 looks almost as tall as $351,341, and the tallest bars in all three panels are the same height even though $7.4 million is far more than $1.2 million. Fix: draw every bar from a zero baseline on one common axis, with the 1970 loss going below zero.", [1, 1, 1], "good"),
      t("The loss in 1970 is shown as a positive bar going up. Heights are not proportional to the numbers since there is no zero baseline. I would add a y-axis starting at 0 and draw the loss as a negative bar under the zero line.", [1, 1, 1], "good"),
      t("Net income in 1970 was negative but it is drawn upward like a gain. Each panel uses its own scale, so 1.2 million and 7.4 million look the same height. Put all three panels on one common scale that starts at zero and let the loss bar drop below zero.", [1, 1, 1], "good"),
      t("The 1970 net income bar is the problem: it was a loss, but the bar goes up like it was a profit.", [1, 0, 0], "partial"),
      t("The heights are misleading: $75,243 looks almost as tall as $351,341, so the bars are not proportional to the numbers.", [0, 1, 0], "partial"),
      t("Nothing is misleading here because every bar has its exact dollar amount written on top, so readers get the real numbers.", [0, 0, 0], "wrong", true),
      t("the 70 net income is a loss but the bar goes up like a profit. also bars dont start at 0 so the heights arent proportional to the money. fix: zero baseline for every bar and the loss goes below 0", [1, 1, 1], "good"),
      t("The chart is misleading and kind of confusing, so I would redesign it to make it clearer and more honest.", [0, 0, 0], "vague"),
      t("The 1970 loss is drawn going up like a profit, and the bar heights do not match the dollar amounts because the bars do not start at zero. I would make it a horizontal bar chart that starts at zero, with the loss going left of zero, so the labels are easy to read.", [1, 1, 1], "good"),
    ],
  },

  // ---------------- Second quarter: Data-ink and data types ----------------
  {
    id: "roster-nominal", quarter: 2, kind: "choice", seconds: 30,
    prompt: "Six rows of the 2025 RedHawks roster. Which column holds numbers but is nominal?",
    table: { cols: C.roster.cols, rows: C.roster.rows },
    options: ["Height (in)", "Weight (lb)", "Jersey", "Class"],
    answer: 2,   // jersey numbers are labels: two players wear #8 and two wear #22
    check: () => C.roster.rows.filter((r) => r[0] === "8").length === 2 && C.roster.rows.filter((r) => r[0] === "22").length === 2,
    source: `Miami RedHawks 2025 football roster (names removed). ${LINK.roster}`,
  },
  {
    id: "class-year-type", quarter: 2, kind: "choice", seconds: 20,
    prompt: "The roster lists each player's class year as Fr, So, Jr, Sr or Gr. Which type of variable is class year?",
    options: ["Nominal", "Ordinal", "Interval", "Ratio"],
    answer: 1,   // the levels have a natural order but no meaningful distance between them
    check: () => ["Fr", "So", "Jr", "Sr", "Gr"].every((x) => C.roster.class_levels.includes(x)),
    source: `Miami RedHawks 2025 football roster. ${LINK.roster} ; Stevens (1946), On the theory of scales of measurement. ${LINK.stevens}`,
  },
  {
    id: "ratio-vs-interval", quarter: 2, kind: "choice", seconds: 30,
    prompt: `Akron game: ${n(S.akron_att)} fans, ${S.akron_temp} °F kickoff. Holy Cross game: ${n(S.hc_att)} fans, ${S.hc_temp} °F kickoff. Claim 1: the Akron crowd was ${S.crowd_ratio.toFixed(2)} times the Holy Cross crowd. Claim 2: the Holy Cross kickoff was ${S.temp_pct}% hotter. Which claims are valid?`,
    options: ["Both claims", "Only claim 1", "Only claim 2", "Neither claim"],
    answer: 1,   // attendance is ratio (true zero): 18,515 / 11,126 = 1.66; degrees F are interval: 76 / 53 = 1.43 is meaningless
    check: () => S.crowd_ratio === 1.66 && S.temp_pct === 43,
    source: `Box scores: Akron, Oct 17, 2026 (the Family Weekend game) ${LINK.akron} ; Holy Cross, Sept 12, 2026 ${LINK.holycross} ; Family Weekend, Oct 16-18, 2026: ${LINK.family}`,
  },
  {
    id: "data-ink", quarter: 2, kind: "choice", seconds: 30,
    prompt: "Which element of this chart is data-ink?",
    chart: "charts/chartjunk.svg",
    options: ["The green field behind the bars", "The thick white yard lines", "The dark shadow beside each bar", "The height of each red bar"],
    answer: 3,
    check: () => C.ppg.seasons.length === 5,
    source: `Miami points per game by season, 2026 Football Record Book (Year-By-Year Records, printed p. 57). ${LINK.recordbook}`,
  },

  // ---------------- Third quarter: Encodings and color ----------------
  {
    id: "best-channel", quarter: 3, kind: "choice", seconds: 20,
    prompt: "You want readers to compare Miami's points per game across seasons as accurately as possible. Which encoding should carry the values?",
    options: ["Angle of pie slices", "Area of circles", "Position along a common axis", "Color intensity"],
    answer: 2,
    check: () => true,
    source: `Cleveland, W. S., and McGill, R. (1984). Graphical perception. Journal of the American Statistical Association, 79(387), 531-554. ${LINK.cleveland}`,
  },
  {
    id: "diverging-palette", quarter: 3, kind: "choice", seconds: 20,
    prompt: `You want to color each 2026 game by Miami's point differential, from ${M.min} at ${M.min_opp} to +${M.max} against ${M.max_opp}. Which kind of palette fits?`,
    options: ["Qualitative", "Sequential", "Diverging", "One color for all games"],
    answer: 2,   // values on both sides of a meaningful midpoint (0 = tie)
    check: () => M.min < 0 && M.max > 0,
    source: `Miami 2026 schedule and box scores, through Oct 17, 2026. ${LINK.schedule2026}`,
  },
  {
    id: "red-green", quarter: 3, kind: "choice", seconds: 30,
    prompt: "The left chart colors wins green and losses red. The right panel simulates how a reader with deuteranopia sees it. What is the best fix?",
    chart: "charts/redgreen.svg",
    options: [
      "Use a brighter red for the losses",
      "Make the bars wider so the colors show",
      "Switch to a dark background",
      "Use blue and orange, and label W or L",
    ],
    answer: 3,
    check: () => C.redgreen.deutan.W !== C.redgreen.original.W,
    source: `Miami 2026 schedule, through Oct 17, 2026 (${LINK.schedule2026}); simulation with colorspace::deutan (Machado, Oliveira and Fernandes, 2009, ${LINK.machado}).`,
  },

  // ---------------- Fourth quarter: Grammar of graphics ----------------
  {
    id: "fill-mapping", quarter: 4, kind: "choice", seconds: 30,
    prompt: "In this chart, which variable is mapped to fill?",
    chart: "charts/fill.svg",
    options: ["team", "quarter", "points", "game date"],
    answer: 0,   // aes(x = quarter, y = points, fill = team) + geom_col(position = "dodge")
    check: () => Q.miami.reduce((a, b) => a + b) === 34 && Q.akron.reduce((a, b) => a + b) === 14,
    source: `Miami vs Akron box score, scoring by quarter, Oct 17, 2026. ${Q.source_url}`,
  },
  {
    id: "coord-change", quarter: 4, kind: "choice", seconds: 30,
    prompt: "Chart B was made from the code for Chart A by changing one layer. Which layer?",
    chart: "charts/coord.svg",
    options: ["geom", "facet", "aesthetic mapping", "coord"],
    answer: 3,   // Chart B = Chart A + coord_polar(theta = "y")
    check: () => Y.miami_rush + Y.miami_pass === 389 && Y.akron_rush + Y.akron_pass === 315,
    source: `Miami vs Akron box score, rushing and passing yards, Oct 17, 2026. ${LINK.akron}`,
  },

  // ---------------- Two-minute drill ----------------
  {
    id: "describe-open", quarter: 5, kind: "open", seconds: 90,
    prompt: "Describe this chart in grammar-of-graphics terms: the aesthetic mappings, the geom, and one more layer.",
    chart: "charts/describe.svg",
    source: `Miami 2026 schedule and box scores, through Oct 17, 2026. ${LINK.schedule2026}`,
    context:
      "A horizontal bar chart titled 'Miami point differential by game, 2026'. The data are Miami's seven 2026 football games " +
      "through Oct 17, one row per game. Each bar is one game: the opponent (Pittsburgh, Holy Cross, Cincinnati, Connecticut, " +
      "Bowling Green, Massachusetts, Akron, in date order from top to bottom) is on the y-axis, and the bar length along the x-axis " +
      "is the point differential, Miami points minus opponent points (from -45 at Pittsburgh to +38 against Holy Cross). " +
      "Bars are filled by site, with a legend titled 'site': Miami red for home games and gray for away games. Bowling Green " +
      "was a home loss and Massachusetts an away win, so fill does not show the result. A vertical line marks zero. " +
      "The chart is split into two panels (facets) by conference game: 'Non-conference' (first four games) and 'MAC' (last three). " +
      "In ggplot2 terms: aes(x = margin, y = opponent, fill = site) + geom_col() + geom_vline(xintercept = 0) + facet_grid(conference ~ .) " +
      "+ scale_fill_manual().",
    ideas: [
      idea("Mappings: point differential, opponent, site",
        "What sets bar length, what sets the position on the other axis, and what sets the color?",
        "at least two of these aesthetic mappings: the point differential (Miami points minus opponent points) mapped to the bar length or x-axis, the opponent or game mapped to the y-axis, and the site (home or away) mapped to the fill color"),
      idea("Geom: bars",
        "What kind of mark draws each game?",
        "the geom (the geometric object or mark) is bars, for example geom_col or geom_bar"),
      idea("One more layer, named specifically",
        "Look at the panels, the colors and the line at zero.",
        "a specific additional layer that is actually in this chart, such as facets that split the games into non-conference and MAC panels, a fill scale that sets red for home and gray for away, or a vertical reference line at zero"),
    ],
    model: [
      { head: "Data", items: ["Miami's 2026 games through Oct 17, one row per game."] },
      { head: "Mappings (aes)", items: [
        "x = point differential (Miami points minus opponent points)",
        "y = opponent",
        "fill = site (home or away), not win or loss: Bowling Green was a home loss",
      ] },
      { head: "Geom", items: ["Bars (geom_col)"] },
      { head: "More layers", items: [
        "Facets: separate panels for non-conference and MAC games",
        "A reference line at zero (geom_vline)",
        "A fill scale: red for home, gray for away",
      ] },
    ],
    code: "ggplot(games, aes(x = margin, y = opponent, fill = site)) + geom_col() + geom_vline(xintercept = 0) + facet_grid(conference ~ .)",
    wrong: [wrong("the fill color shows whether Miami won or lost the game",
      "Check the legend: fill shows home or away. Bowling Green was a home loss.")],
    tests: [
      t("Data: Miami's 2026 games, one row per game. Aesthetics: x = point differential (Miami minus opponent), y = opponent, fill = site (home or away). Geom: geom_col bars. One more layer: facet_grid that splits non-conference and MAC games.", [1, 1, 1], "good"),
      t("ggplot(games, aes(x = margin, y = opponent, fill = site)) + geom_col() + geom_vline(xintercept = 0) + facet_grid(conference ~ .)", [1, 1, 1], "good"),
      t("Each bar is one game and its length is how many points Miami won or lost by; the opponent is on the y axis and the color is home vs away. The geom is bars. There is also a facet layer that separates the MAC games from the non-conference games.", [1, 1, 1], "good"),
      t("It is a bar chart, so the geom is geom_col.", [0, 1, 0], "partial"),
      t("The chart is split into two facets, one panel for non-conference games and one for MAC games.", [0, 0, 1], "partial"),
      t("x = opponent, y = margin, fill = result (red means Miami won), drawn with geom_col.", [null, 1, 0], "wrong", true),
      t("aes: margin on x, opponent on y, fill = site. geom = bars (geom_col). extra layer = facet by MAC vs nonconference", [1, 1, 1], "good"),
      t("This chart shows some data with aesthetics, a geom and some other layers on top.", [0, 0, 0], "vague"),
    ],
  },
];
