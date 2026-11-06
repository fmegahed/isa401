// The Exam 02 review's content units (Classes 15 to 22). content/exam02.mjs appends the replays.
// Every "Check the AI" step uses a real ChatGPT run (content/exam02_ai.json: prompt, verbatim answer,
// date), with its screen recording in exam02/rec/<id>.mp4. The ideas were written after reading each
// real answer. Charts: make_exam02_charts.R. Ids start with "x2-".

import fs from "node:fs";
const AI = JSON.parse(fs.readFileSync(new URL("./exam02_ai.json", import.meta.url), "utf8"));

const deck = (n, file, label) => ({ label: label || `Class ${n} slides`, url: `https://fmegahed.github.io/isa401/fall2026/class${n}/${file}.html` });
const lab = (n, path, label) => ({ label, url: `https://github.com/fmegahed/isa401/blob/main/lectures/${path}` });
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
const t = (text, ideas, isWrong = false, kind = "") => ({ text, ideas, wrong: isWrong, kind });
const chart = (file, alt, caption) => ({ src: `exam02/charts/${file}`, alt, caption });
const ai = (id) => {
  const r = AI[id];
  if (!r) throw new Error(`no recorded ChatGPT run for ${id}`);
  return { prompt: r.prompt, answer: r.answer, date: r.date, video: `exam02/rec/${id}.mp4`, seconds: r.seconds };
};
// what Jev is told the student saw: the chart in words, then ChatGPT's answer
const ctx = (id, chartText) => `${chartText} ChatGPT was asked: "${AI[id].prompt}" ChatGPT answered: "${AI[id].answer}"`;

const slides = {
  15: deck("15", "15_fundamentals_data_viz"), 16: deck("16", "16_grammar_of_graphics"),
  17: lab("17", "17_lab_tableau/17_tableau_lab.pdf", "Class 17 Tableau lab"), 18: lab("18", "18_lab_powerbi/18_powerbi_lab.pdf", "Class 18 Power BI lab"),
  19: lab("19", "19_lab_ai_maps/19_ai_maps_lab.pdf", "Class 19 AI maps lab"), 20: deck("20", "20_commonly_used_charts"),
  21: deck("21", "21_ts_spatial_and_spatiotemporal_charts"), 22: deck("22", "22_high_dimensional_charts"),
};
const CHECK = "Do you agree with ChatGPT? What did it miss?";

// "Build it" steps: the answers come from content/build_answers.json (make_exam02_builds.R), which the page never sees.
const BA = JSON.parse(fs.readFileSync(new URL("./build_answers.json", import.meta.url), "utf8"));
const num = (build, id, o) => {
  const a = (BA[build] || []).find((x) => x.id === id);
  if (!a) throw new Error(`no answer for ${build}.${id}`);
  const msgs = o.wrongMsgs || [];
  return { id, prompt: o.prompt, label: o.label, unit: o.unit || "", hint: o.hint, shown: o.shown, msg: o.msg, answer: a.answer, tol: a.tol,
           wrong: (a.wrong || []).map((w, i) => ({ value: w.value, tol: w.tol, msg: msgs[i] })) };
};
const shotTest = (file, expect, kind) => ({ file: `tests/build_shots/${file}.png`, expect, kind });
// chart checks Jev answers about the student's screenshot; each asks one thing a person could see at a glance
const SHOT = {
  bar: (what) => ({ label: "A bar chart", hint: "Which chart type compares a count or share across categories best?",
    ask: `Is \`chart\` a bar chart (bars whose lengths show the values)?`,
    yes: `The chart is a bar chart: horizontal or vertical bars, one for each ${what}.`,
    no: "The chart is another kind of chart, such as a pie chart, a line chart, a table or a scatterplot." }),
  sorted: { label: "Bars sorted by length", hint: "Could a reader find the largest and smallest at a glance?",
    ask: "Are the bars in `chart` sorted by length, from longest to shortest or from shortest to longest?",
    yes: "The bar lengths step steadily down (or up): each bar is at least as long as the next one in the order shown.",
    no: "The bar lengths go up and down in no order, for example alphabetical order of the labels, or the chart has no bars." },
  title: (example) => ({ label: "A title that says what it shows", hint: "Would someone who sees only this chart know what it shows?",
    ask: "Does `chart` have a title that says what the chart shows?",
    yes: `There is a title above or on the chart that names what is shown, such as ${example}.`,
    no: "The chart has no title, or only a default title such as Sheet 1." }),
};

export default [

// ================================================================================================
// How a "Check the AI" answer is scored (Fadel, Nov 5: practice the format, and note that the AI may be correct).
{
  id: "format", title: "Answering a Check the AI Question", classes: "All classes",
  blurb: "What a 2-point answer needs: say what the chart really shows, and why it matters. ChatGPT is sometimes right.",
  tags: ["data_visualization"],
  links: { slides: [], code: [] },
  steps: [
    { type: "read", title: "How these questions work", html: `
<ul>
<li><b>You see three things:</b> a chart, the exact prompt we gave ChatGPT, and ChatGPT's answer word for word (with a screen recording as proof). Your job is to judge the answer <b>against the chart</b>, not against what you expect the data to say.</li>
<li><b>ChatGPT can be right, wrong, or right but incomplete.</b> If it is right, say so and point to what in the chart confirms it: "I agree, because &hellip;" can earn full credit. In this review, the garage heat map (Color) and the stacked bars (Commonly Used Charts) are cases where ChatGPT is right.</li>
<li><b>A 2-point answer has two parts.</b> One point for saying what the chart actually shows: what ChatGPT got right, got wrong, or left out. One point for why it matters: what a reader would wrongly conclude, or what you would check or fix.</li>
<li><b>"I agree" or "I disagree" alone earns 0.</b> So does repeating ChatGPT's answer in other words.</li>
<li><b>Keep it to 2 or 3 sentences.</b> Name the specific thing in the chart (an axis, a group of points, a line, a color, a legend), not a general rule.</li>
<li><b>Pasting the question into an AI is allowed,</b> but its answer is one more reading to check. The same chart can get different answers from one run to the next.</li>
</ul>
<p>Every "Check the AI" question in the units that follow uses this format, and the feedback while you type checks the same two parts.</p>` },
  ] },

// ================================================================================================
{
  id: "honest", title: "Honest Charts", classes: "Class 15",
  blurb: "Truncated axes, the lie factor, data-ink and dual axes: when a chart's drawing says more than its data.",
  tags: ["data_visualization"],
  links: { slides: [slides[15]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Bars must start at zero.</b> A bar shows its value by its length. If the axis starts at 11,000, a bar for 12,000 is drawn one unit long and a bar for 15,000 four units long, although 15,000 is only 25% more.</li>
<li><b>Lines may start above zero</b> when the change is the point, because a line shows values by position and slope, not by length. Label the axis so the reader sees where it starts.</li>
<li><b>Lie factor</b> = the size of the effect shown in the graphic &divide; the size of the effect in the data. Near 1 is honest. A lie factor of 4 means the chart makes the change look four times as big as it is.</li>
<li><b>Data-ink.</b> Ink that does not show data (3D, heavy grids, decoration) competes with the ink that does. Remove it.</li>
<li><b>Dual axes</b> let the designer choose two scales, so any two series can be made to look as if they move together.</li>
</ul>` },

    { type: "explain", id: "x2-honest-ai", title: "Attendance at Yager Stadium",
      prompt: `<b>${CHECK}</b> Look at how the chart is drawn, not only at the values. Answer in 2 or 3 sentences.`,
      charts: [chart("honest.png", "Bar chart of average home attendance at Miami RedHawks football games, 2021 to 2026, with a y-axis that starts at 11,000", "Real data: miamiredhawks.com box scores. 2026 has four home games so far.")],
      ai: ai("x2-honest-ai"),
      context: ctx("x2-honest-ai", "A bar chart of average home attendance at Miami RedHawks football games: each bar is the average of that season's home games, about 11,700 (2021), 15,100 (2022), 13,400 (2023), 12,200 (2024), 11,700 (2025) and 15,100 (2026, four games so far). The y-axis starts at 11,000, not at zero, so the 2022 bar looks about six times as tall as the 2025 bar although 2022 is only about 30% higher. Bars are also a poor way to show averages (Class 20): a bar suggests every game sits inside it and hides how much the games varied."),
      ideas: [
        idea("The y-axis starts at 11,000, not zero", "Where does the y-axis begin?", "the chart's y-axis (the value axis) does not start at zero, for example that it starts at 11,000"),
        idea("So the differences look far bigger than they are", "2022 looks about six times as tall as 2025. Is it six times as large?", "the bars exaggerate the differences between seasons, so a change of about 30% (or a few thousand fans) looks much bigger than it really is"),
        // added Nov 5 (Fadel): Class 20, Key Takeaway 1
        idea("Bar charts should not be used for averages", "Each bar is an average of several home games. What did Class 20 say about bars for averages?", "bar charts should not be used to show averages (here, the average attendance per season), for example that the averages would be better shown as points or with each game's attendance"),
      ],
      wrong: [wrong("attendance in some season was several times (for example five or six times) what it was in another season", "Read the numbers: about 15,100 and 11,700. Is that several times?")],
      tests: [
        t("ChatGPT misses that the y-axis starts at 11,000 instead of 0, so 2022 looks about six times taller than 2025 even though it is only about 30% more fans. Also, each bar is an average of several home games, and bar charts shouldn't be used for averages; dots with the individual games would show the spread.", [1, 1, 1], false, "full"),
        t("ChatGPT reads the numbers right but misses that the y axis starts at 11,000 instead of 0. Because bars start at 11,000, 2022 looks about 6 times taller than 2025 even though it is only about 30% more fans, so the 'sharp' rebound is exaggerated.", [1, 1, 0], false, "axis ideas only"),
        t("The values are fine, but the axis is truncated. Starting the bars at 11k makes small changes in attendance look huge.", [1, 1, 0], false, "axis ideas reworded"),
        t("These are average attendances, and a bar chart is the wrong way to show an average. I'd plot each season's average as a point with the individual games around it.", [0, 0, 1], false, "averages only"),
        t("The axis doesn't begin at zero.", [1, 0, 0], false, "partial"),
        t("I agree. Attendance dropped a lot from 2022 to 2025 and then went way back up in 2026, the chart shows that clearly.", [0, 0, 0], false, "agrees only"),
        t("I agree with ChatGPT. In 2022 about five times as many fans came as in 2025, which is a huge drop.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-honest-lie", title: "A lie factor in one number",
      prompt: "Sales grew by 10%, but on the chart the second bar is drawn 50% taller than the first. What is the chart's lie factor, and what does that number tell a reader?",
      ideas: [
        idea("The lie factor is 5 (50% divided by 10%)", "Divide the change shown by the change in the data.", "the lie factor is 5 (50% divided by 10%)"),
        idea("The chart makes the growth look five times as big as it is", "What does a lie factor above 1 do to the effect?", "the chart exaggerates the change, making it look about five times bigger than it really is"),
      ],
      wrong: [wrong("the lie factor is 0.2 or 40", "The lie factor is the change shown divided by the change in the data.")],
      tests: [
        t("Lie factor = 50/10 = 5. The graphic makes the sales growth look 5 times larger than it really was.", [1, 1], false, "full"),
        t("It's 5, so the bars overstate the increase by a factor of five.", [1, 1], false, "full reworded"),
        t("The lie factor is 5.", [1, 0], false, "partial"),
        t("The lie factor is 40 because 50 minus 10 is 40.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "encodings", title: "Data Types and Encodings", classes: "Classes 15 and 16",
  blurb: "Nominal, ordinal and quantitative variables, the channels that suit each, and the grammar of graphics as a vocabulary.",
  tags: ["data_visualization"],
  links: { slides: [slides[15], slides[16]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Data types.</b> Nominal: names with no order (bowl game yes or no, a major). Ordinal: ordered labels (1st, 2nd, 3rd in the conference). Quantitative (interval or ratio): numbers you can subtract (points per game, wins).</li>
<li><b>Channels, best first for numbers:</b> position on a common scale, then length, then angle and area, then color intensity. <b>Hue</b> (different colors) and <b>shape</b> are for categories, because they have no order.</li>
<li><b>The grammar of graphics</b> names the parts of any chart: the data, the <i>aesthetics</i> (which variable goes to x, y, color, size, shape), the <i>geom</i> (points, bars, lines), scales, facets and coordinates.</li>
<li><b>To read a chart,</b> list each variable and its channel. The axes give two; the legends give the rest. One mark per row: here, one point per season.</li>
</ul>` },

    { type: "explain", id: "x2-encodings-ai", title: "Five variables in one scatter plot",
      prompt: "<b>Check ChatGPT's list against the chart. Is it right?</b> Then pick one variable and say whether its channel suits its data type.",
      charts: [chart("encodings.png", "Scatter plot of Miami football seasons 2010 to 2025: points scored per game on x, points allowed per game on y, point size for wins, color for bowl game, shape for MAC champion", "Real data: the Miami football record book (the Game Day file).")],
      ai: ai("x2-encodings-ai"),
      context: ctx("x2-encodings-ai", "A scatter plot with one point per Miami football season, 2010 to 2025. Points scored per game is on the x-axis, points allowed per game on the y-axis, the number of wins is the point size, whether the team played a bowl game is the color (red yes, gray no), and whether it was MAC champion is the shape (triangle yes, circle no). Every pair in ChatGPT's list is correct."),
      ideas: [
        idea("ChatGPT's list checks out against the chart", "Check each pair against the axes and the three legends, and name one you checked.", "ChatGPT's list is right and names at least one specific variable-and-channel pair from the chart, such as points scored on the x-axis, wins shown by size, bowl game by color or MAC champion by shape"),
        idea("A variable's type matched to its channel", "Bowl game is yes or no. Wins is a number. Which channels suit which?", "a specific variable's data type fits or does not fit its channel, for example that bowl game or MAC champion is a yes/no category that suits color or shape, or that wins is a number shown by size, which is harder to compare precisely than position"),
      ],
      wrong: [wrong("ChatGPT's list contains a mistake, such as a variable paired with the wrong channel or a variable it left out", "Check each of the five pairs against the legends. They are all there.")],
      tests: [
        t("ChatGPT got all of them right: x is points scored, y is points allowed, color is bowl game, shape is MAC champion and size is wins. Bowl game is a yes/no category so color works well for it.", [1, 1], false, "full"),
        t("The list matches the chart. Wins is a number but it's shown with size, which is hard to compare exactly, position would be better.", [1, 1], false, "full reworded"),
        t("Yes, ChatGPT is correct. Color is bowl game and shape is MAC champion, just like the legends say.", [1, 0], false, "partial"),
        t("Yes, ChatGPT is correct about every encoding.", [0, 0], false, "agrees without checking"),
        t("ChatGPT is wrong because it says color shows the bowl game, but the color shows the number of wins.", [0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-encodings-hue", title: "Hue for names, not numbers",
      prompt: "Why is color hue (red, blue, green) a good channel for a team's conference but a poor channel for its points per game?",
      ideas: [
        idea("Hue has no order, so it fits categories like conference", "Is blue more than red?", "hue has no natural order (or tells categories apart), so it suits a nominal variable such as conference"),
        idea("Readers cannot see how much more one hue is; use position or length (or light to dark)", "How would a reader see that 31 points is more than 24 from two hues?", "for a number such as points, hue cannot show how much bigger one value is, so position, length or a light-to-dark scale works better"),
      ],
      tests: [
        t("Conference is a category with no order, and different hues are great for telling categories apart. Points is a number, and you can't tell from red vs green which is bigger or by how much, so position on an axis is better.", [1, 1], false, "full"),
        t("Hues don't have an order, so they work for nominal data but not for quantities, where you'd want length or a sequential light-to-dark color.", [1, 1], false, "full reworded"),
        t("Because conference is nominal and hue is good for categories.", [1, 0], false, "partial"),
      ] },
  ],
},

// ================================================================================================
{
  id: "color", title: "Color", classes: "Classes 15, 16 and 21",
  blurb: "Sequential, diverging and qualitative schemes, and how to tell when a chart picked the wrong one.",
  tags: ["data_visualization"],
  links: { slides: [slides[15], slides[16], slides[21]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Sequential:</b> light to dark in one hue, for ordered values from low to high (counts, rates, minutes).</li>
<li><b>Diverging:</b> two hues that meet at a meaningful middle (zero, an average, a target), for values above and below it (change from last year, profit and loss).</li>
<li><b>Qualitative:</b> unrelated hues of similar lightness, for categories with no order (majors, dining halls).</li>
<li><b>Common mistakes:</b> rainbow or qualitative colors on ordered data (the reader cannot tell which color means more without the legend), a diverging scheme with no meaningful middle, and red next to green (about 1 man in 12 cannot tell them apart).</li>
</ul>` },

    { type: "explain", id: "x2-color-ai", title: "A garage heat map",
      prompt: "<b>ChatGPT says this is a qualitative scheme on ordered data. Is it right?</b> Point to something in the chart that shows the problem.",
      charts: [chart("color.png", "Heat map of cars parked in a campus garage by weekday and hour, with six bins from 0 to 100 up to over 500, each bin in an unrelated color: red, blue, green, purple, orange, brown", "Simulated data.")],
      ai: ai("x2-color-ai"),
      context: ctx("x2-color-ai", "A heat map of the average number of cars parked in a campus garage for each weekday and hour from 6am to 11pm. The counts are binned into six ordered groups (0 to 100, 100 to 200, up to over 500), and each group gets an unrelated color: red for 0 to 100, blue, green, purple, orange, and brown for over 500. Red, which looks alarming, marks the emptiest hours (nights and weekends)."),
      ideas: [
        idea("ChatGPT is right: unordered colors for ordered data", "Do the six colors go from light to dark?", "ChatGPT is right that the chart uses qualitative (unrelated, unordered) colors for data that has an order"),
        idea("You cannot tell which hours are busiest without the legend (red means emptiest)", "Which color means the fewest cars?", "the colors do not show which hours are fuller without checking the legend, for example that red marks the emptiest hours or that brown and orange cannot be ranked by eye"),
      ],
      wrong: [wrong("a diverging color scheme would be the right choice for this chart", "Diverging needs a meaningful middle. Is there one for a count of parked cars?")],
      tests: [
        t("Yes, ChatGPT is right. The bins are ordered (0-100 up to 500+) but the colors are random hues. Red is used for the emptiest hours, so you can't see where the garage is fullest without looking at the legend. A light to dark scale would fix it.", [1, 1], false, "full"),
        t("I agree, it's a qualitative palette on numbers that have an order. Looking at the chart I can't tell if orange is more than purple.", [1, 1], false, "full reworded"),
        t("ChatGPT is correct, qualitative colors shouldn't be used for ordered data.", [1, 0], false, "partial"),
        t("ChatGPT is right, the colors are qualitative but the data have an order. The best fix is a diverging blue to red scale.", [1, 0], true, "wrong fix"),
      ] },

    { type: "explain", id: "x2-color-diverging", title: "When to diverge",
      prompt: "When is a diverging color scheme the right choice? Give an example of campus data where you would use one.",
      ideas: [
        idea("The data have a meaningful middle (zero, an average, a target)", "What does the light middle color stand for?", "a diverging scheme needs a meaningful middle or reference point, such as zero, an average or a target"),
        idea("Values go in two directions from it (above and below)", "Why two hues instead of one?", "the values go in two directions from that middle, above and below it (for example gains and losses)"),
      ],
      tests: [
        t("Use diverging colors when there is a meaningful midpoint like zero and the values go above and below it, for example the change in enrollment by major since last year, growth in one color and decline in the other.", [1, 1], false, "full"),
        t("When the data has a natural center such as a budget target, and some values are over it and some under. Example: dining halls over vs under their swipe target.", [1, 1], false, "full reworded"),
        t("When there is a midpoint like zero.", [1, 0], false, "partial"),
      ] },
  ],
},

// ================================================================================================
{
  id: "common", title: "Commonly Used Charts", classes: "Class 20",
  blurb: "Pies, donuts, stacked bars and waterfalls: what each one makes easy, and what it hides.",
  tags: ["data_visualization"],
  links: { slides: [slides[20]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Pies and donuts</b> show values by angle and area, which people compare poorly. With close values, bars on a common baseline win (Pie on Trial).</li>
<li><b>Stacked bars:</b> only the bottom segment and the total sit on the baseline. Middle segments float, so comparing one of them across years means subtracting its bottom edge from its top edge by eye. Instead, show two charts side by side (one for the total, one for the categories as side-by-side bars), or a paneled bar chart with one panel per category.</li>
<li><b>No bars for averages:</b> a bar suggests that the data sit inside it, and it hides how spread out they are. Show the points instead, with a line at each average, or on top of a box plot.</li>
<li><b>Waterfall:</b> shows how a starting value becomes an ending value through gains and losses.</li>
<li><b>Choose the chart from the question:</b> compare categories (bars), part of a whole (sorted bars of each part's share), change over time (line).</li>
</ul>` },

    { type: "explain", id: "x2-common-ai", title: "Which major grew the most?",
      prompt: "<b>ChatGPT says Business Analytics grew the most. Do you agree?</b> Explain why this is harder to read from a stacked bar chart than, say, Accountancy's change.",
      charts: [chart("common.png", "Stacked bar chart of Farmer School first-year students by intended major, 2022 to 2026, with Accountancy at the bottom, then Business Analytics, Economics, Finance and Marketing", "Simulated data.")],
      ai: ai("x2-common-ai"),
      context: ctx("x2-common-ai", "A stacked bar chart of Farmer School first-year students by intended major, 2022 to 2026. From the bottom: Accountancy (210 to 238), Business Analytics (95 to 176), Economics (about 120, flat), Finance (260 to 297) and Marketing (about 190, flat). Business Analytics, the second segment from the bottom, grew the most (about 80 students). ChatGPT's answer is correct."),
      ideas: [
        idea("ChatGPT is right: Business Analytics grew the most", "Measure each segment's own length in 2022 and 2026.", "ChatGPT is right that Business Analytics grew the most"),
        idea("Middle segments float, so you must subtract; Accountancy sits on the baseline", "Where does the Business Analytics segment start in each bar?", "the middle segments of a stacked bar, such as Business Analytics, do not start at the axis, so they are hard to read or compare"),
      ],
      wrong: [wrong("Finance or Marketing grew the most", "Measure each segment's own length, not how high its top edge reaches.")],
      tests: [
        t("Yes, Business Analytics went from about 95 to about 175. It's hard to see because its segment sits on top of Accountancy, so it starts at a different height each year and you have to subtract. Accountancy starts at zero so you can read it straight off the axis.", [1, 1], false, "full"),
        t("I agree with ChatGPT. Stacked bars make the middle pieces float, which makes them hard to compare across years.", [1, 1], false, "full reworded"),
        t("ChatGPT is correct, BA grew by about 80.", [1, 0], false, "partial"),
        t("No, Marketing grew the most because the top of the bar goes up the most every year.", [0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-common-pie", title: "Pie on Trial, explained",
      prompt: "Pie on Trial showed the same three datasets as pies and then as bars. Why is it easier to find the largest value from bars than from pie slices?",
      ideas: [
        idea("Bars use length on a common baseline", "What do you compare when you look at two bars?", "bars show values by length or position along a common baseline or axis"),
        idea("People judge length better than angle or area", "Pies use angles and areas. Which do we judge more accurately?", "people judge length or position more accurately than angle or area, which pie charts use"),
      ],
      tests: [
        t("Bars all start from the same baseline so you just compare lengths, and we're much better at judging length than the angles or areas of pie slices.", [1, 1], false, "full"),
        t("With bars you compare positions on a shared axis; pies make you compare angles, which humans are bad at.", [1, 1], false, "full reworded"),
        t("Because the bars line up on the same axis.", [1, 0], false, "partial"),
      ] },
  ],
},

// ================================================================================================
{
  id: "time", title: "Time", classes: "Class 21",
  blurb: "Lines and bars over time, the spacing of the time axis, seasonality, calendar plots, and animation versus small multiples.",
  tags: ["data_visualization"],
  links: { slides: [slides[21]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Lines for continuous time,</b> where the trend is the story. Bars for a few separate periods you compare one by one. With only two time points, a line draws a path between them that was never measured.</li>
<li><b>Check the spacing of the time axis.</b> If years are skipped but drawn the same distance apart, every slope is bent. Compare the change per year, or put time on a real time axis.</li>
<li><b>Seasonality</b> is a pattern that repeats every year (semesters, breaks, holidays). To judge growth, compare the same month across years, not neighboring months.</li>
<li><b>Calendar plots</b> lay daily values out like a calendar, so day-of-week and month patterns stand out.</li>
<li><b>Animation or small multiples.</b> Animation (Rosling's Gapminder) draws attention but asks the viewer to remember earlier frames. Small multiples put every time point side by side for comparison.</li>
</ul>` },

    { type: "explain", id: "x2-time-ai", title: "King Library, month by month",
      prompt: `<b>${CHECK}</b> Then say how you would check its claim that visits are increasing.`,
      charts: [chart("time.png", "Line chart of monthly visits to King Library from January 2022 to October 2026, with deep dips every summer, smaller dips every December, and peaks during the semesters", "Simulated data.")],
      ai: ai("x2-time-ai"),
      context: ctx("x2-time-ai", "A line chart of monthly visits to King Library, January 2022 to October 2026. Visits peak during the semesters (about 60,000 to 85,000), drop sharply every June and July (about 11,000), and also dip every December (winter break, about 30,000 to 40,000). Each month is a little higher than the same month a year earlier."),
      ideas: [
        idea("It misses the December dip (winter break)", "Look between the fall and spring peaks.", "visits also dip every December or over winter break, not only in the summer"),
        idea("Check growth by comparing the same month across years", "Which two points would you compare to see growth without the seasons getting in the way?", "to check the growth claim you compare the same month across years (for example each October) rather than neighboring months"),
      ],
      wrong: [wrong("library visits are declining over the period", "The drops come back every year. Compare the same month across years.")],
      tests: [
        t("Mostly agree, but ChatGPT only mentions summer. There's also a dip every December during winter break. To check that visits are growing I would compare the same month each year, like October 2022 vs October 2026.", [1, 1], false, "full"),
        t("It left out the winter break drop each December. Compare like months year over year (April to April) to see the trend.", [1, 1], false, "full reworded"),
        t("It missed the December dips.", [1, 0], false, "partial"),
        t("I disagree, visits go down a lot every summer so the library is losing visitors.", [0, 0], true, "wrong"),
      ] },

    // The next two charts are copied exactly as they were shown to ChatGPT in the recordings (simulated data).
    { type: "explain", id: "x2-time-twopoint", title: "First-year students, two falls apart",
      prompt: `<b>${CHECK}</b> Look at what was actually measured. Answer in 2 or 3 sentences.`,
      charts: [chart("time_twopoint.png", "Line chart of first-year students at Miami's Oxford campus with two points, Fall 2024 at 4,052 and Fall 2026 at 4,407, joined by a straight line; Fall 2025 is on the x-axis but has no point", "Simulated data.")],
      ai: ai("x2-time-twopoint"),
      context: ctx("x2-time-twopoint", "A line chart titled First-Year Students at Miami's Oxford Campus with only two measured points, Fall 2024 (4,052) and Fall 2026 (4,407), joined by a straight line. Fall 2025 is labeled on the x-axis but has no data point. With only two measurements, the line suggests a path through Fall 2025 that was never measured; two bars would compare the two values honestly."),
      ideas: [
        idea("There are only two measurements, not three", "Count the points that have a value.", "the chart has only two data points (Fall 2024 and Fall 2026)"),
        idea("So the line shows a Fall 2025 that was never measured; bars fit better", "What does the line claim about Fall 2025?", "a line is a poor choice here because it suggests a value or a path for Fall 2025 that was never measured"),
      ],
      wrong: [wrong("Fall 2025 has a measured value of its own", "Is there a point above Fall 2025?")],
      tests: [
        t("No. There are only two data points, Fall 2024 and Fall 2026, not three like ChatGPT says. A line connecting them makes it look like we know what happened in Fall 2025, but we don't, so two bars would be better.", [1, 1], false, "full"),
        t("ChatGPT miscounted, it's just 2 observations. Drawing a line implies a 2025 number that was never collected, so use bars.", [1, 1], false, "full reworded"),
        t("It says three observations but I only see two points.", [1, 0], false, "partial"),
        t("I agree, a line chart is good for showing change over time and enrollment went up.", [0, 0], false, "agrees only"),
        t("I agree. There are three years of data and the line shows enrollment rising each year, to about 4,230 in Fall 2025.", [0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-time-uneven", title: "Applications over 26 years",
      prompt: `<b>${CHECK}</b> Look at how the chart is drawn, not only at the values. Answer in 2 or 3 sentences.`,
      charts: [chart("time_uneven.png", "Line chart of first-year applications to Miami University with points for 2000, 2010, 2015, 2020 and every year from 2022 to 2026, all drawn the same distance apart: the line climbs steeply on the left and flattens on the right", "Simulated data.")],
      ai: ai("x2-time-uneven"),
      context: ctx("x2-time-uneven", "A line chart of first-year applications to Miami University with points for 2000 (17,645), 2010 (22,316), 2015 (24,653), 2020 (27,128) and every year from 2022 to 2026 (27,886, 28,233, 28,736, 29,314 and 29,654). Every year is drawn the same distance apart, although the gaps are 10, 5, 5, 2 and then 1 year. The early steps look steep only because they cover more years: per year, applications grew by about the same amount throughout (about 467 a year from 2000 to 2010 and about 440 a year from 2022 to 2026)."),
      ideas: [
        idea("The years are unevenly spaced but drawn the same distance apart", "How many years does each step cover?", "the years on the x-axis are not evenly spaced (some steps cover 10 or 5 years, others 1 year) even though they are drawn the same distance apart"),
        idea("Per year, growth was about the same throughout", "Divide each step's change by the number of years it covers.", "per year, applications grew at about the same rate throughout, so growth did not really slow after 2020"),
      ],
      wrong: [wrong("growth slowed down after 2020", "Compare the growth per year, not per step.")],
      tests: [
        t("No. The x-axis jumps 10 years, then 5, then 1, but every step is the same width, so the early part looks steeper. Per year it's about 450 more applications every year both before and after 2020, so growth didn't slow down.", [1, 1], false, "full"),
        t("The time gaps are uneven (2000 to 2010 is a decade, 2022 to 2023 is one year). Adjusted per year, the growth rate is steady.", [1, 1], false, "full reworded"),
        t("The years on the axis are not equally spaced.", [1, 0], false, "partial"),
        t("I agree, applications went up from about 17,600 to 29,700.", [0, 0], false, "agrees only"),
        t("I agree with ChatGPT that growth was strongest before 2020 and slowed down after.", [0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-time-anim", title: "Animation or small multiples?",
      prompt: "You want to show how the Gapminder countries moved from 1952 to 2007. When is an animation the better choice, and when are small multiples better?",
      ideas: [
        idea("Small multiples show every time point at once, so readers can compare without memory", "In an animation, where is 1952 when you are looking at 2007?", "small multiples show all the time points at once, side by side"),
        idea("Animation suits a presentation and shows motion, but is hard to compare carefully", "When did Rosling use the animation?", "animation is the better choice for a presentation or for engaging an audience"),
      ],
      tests: [
        t("Animation is great for a live talk because the motion grabs people, but it's hard to compare years since you have to remember what you saw. Small multiples put every year next to each other so you can compare at your own pace, better for a report.", [1, 1], false, "full"),
        t("Small multiples let you see all years at once. Animation is better when presenting to an audience.", [1, 1], false, "full reworded"),
        t("Small multiples are better because you can see all the years at the same time.", [1, 0], false, "partial"),
      ] },
  ],
},

// ================================================================================================
{
  id: "maps", title: "Maps", classes: "Classes 19 and 21",
  blurb: "Choropleths, proportional symbols and cartograms, and why a map of counts is often a map of population.",
  tags: ["data_visualization"],
  links: { slides: [slides[19], slides[21]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Choropleth:</b> each region filled with a color. Use it for rates or shares (per resident, per 10,000), not raw counts, or the map mostly shows where people live.</li>
<li><b>Proportional symbols:</b> a circle per region, sized by a count. This suits totals.</li>
<li><b>Cartogram:</b> regions resized by a variable such as population, so small, crowded places are not hidden by large empty ones.</li>
<li><b>Before reading a map of counts,</b> ask how many people live in each region. Franklin, Cuyahoga and Hamilton hold about a third of Ohio's people, so they lead almost any count.</li>
</ul>` },

    { type: "explain", id: "x2-maps-ai", title: "Where is Miami most popular?",
      prompt: `<b>${CHECK}</b> Say what this map really shows, and what you would need to answer the question.`,
      charts: [chart("maps.png", "Choropleth map of Ohio counties shaded by the number of Miami University alumni living there; Franklin County is darkest, then Hamilton and Cuyahoga, then Butler", "Simulated counts.")],
      ai: ai("x2-maps-ai"),
      context: ctx("x2-maps-ai", "A choropleth map of Ohio's 88 counties, shaded by the number of Miami alumni living in each county (simulated counts). Franklin County (Columbus, about 1.3 million people) is darkest, then Hamilton and Cuyahoga, the other largest counties, then Butler. The counts mostly follow population. Per resident, Butler County has the highest share of alumni."),
      ideas: [
        idea("The map shows counts, which mostly follow population", "Which counties are darkest, and how many people live there?", "the darkest counties are dark mainly because many people live there (the counts follow population)"),
        idea("Popularity needs a rate: alumni per resident", "What would you divide by?", "to judge where Miami is most popular you need a rate, such as alumni per resident or per 10,000 people, not a raw count"),
      ],
      wrong: [wrong("Franklin County is where Miami is most popular because it has the most alumni", "Most alumni is not the same as most popular. How many people live in Franklin County?")],
      tests: [
        t("I disagree. The map just shows how many alumni live in each county, and the big dark counties (Franklin, Hamilton, Cuyahoga) are the ones with the most people. To know where Miami is most popular you'd divide by population and map alumni per 10,000 residents.", [1, 1], false, "full"),
        t("Counts track population, so this is basically a population map. You need a per capita rate to talk about popularity.", [1, 1], false, "full reworded"),
        t("The dark counties are just the ones with lots of people.", [1, 0], false, "partial"),
        t("ChatGPT missed that Franklin is the darkest county, so Miami is actually most popular around Columbus.", [0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-maps-symbols", title: "Choose the map",
      prompt: "You want to map the number of Miami students from each Ohio county. Would you use a choropleth or proportional symbols, and why?",
      ideas: [
        idea("Proportional symbols suit counts", "Which map type is made for totals?", "proportional symbols (sized circles) suit counts or totals such as the number of students"),
        idea("A choropleth of counts mostly shows population; choropleths are for rates", "What would the darkest counties be on a choropleth of counts?", "shading counties by raw counts would mostly show where people live (population)"),
      ],
      tests: [
        t("Proportional symbols, because the number of students is a count. A choropleth of counts would just make the most populated counties look the most important; choropleths are better for rates like students per 10,000 residents.", [1, 1], false, "full"),
        t("Use circles sized by the count. Shading by raw numbers mostly shows where people live.", [1, 1], false, "full reworded"),
        t("Proportional symbols since it is a count.", [1, 0], false, "partial"),
      ] },
  ],
},

// ================================================================================================
{
  id: "many", title: "Many Variables", classes: "Class 22",
  blurb: "Small multiples, parallel coordinates, radar charts, heat maps and treemaps.",
  tags: ["data_visualization"],
  links: { slides: [slides[22]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Small multiples:</b> the same small chart once per group. Check whether the panels share an axis. With separate axes (<code>scales = "free_y"</code>), every panel fills its box and big and small groups look alike.</li>
<li><b>Parallel coordinates:</b> one vertical axis per variable, one line per observation. Lines that cross between two axes show a negative relationship; lines that run parallel show a positive one.</li>
<li><b>Radar:</b> parallel coordinates wrapped into a circle. The shape depends on the order of the axes.</li>
<li><b>Heat map:</b> a grid of rows and columns with each cell colored by its value.</li>
<li><b>Treemap:</b> nested rectangles sized by value, for parts of a whole with a hierarchy.</li>
</ul>` },

    { type: "explain", id: "x2-many-ai", title: "Four dining halls",
      prompt: "<b>ChatGPT ranked the halls correctly. What did it miss about how this chart is drawn, and why does that matter?</b>",
      charts: [chart("many.png", "Four small line charts of daily meal swipes at Bell Tower Place, Garden Commons, Maplestreet Station and Western Dining Commons, each with its own y-axis range", "Simulated data.")],
      ai: ai("x2-many-ai"),
      context: ctx("x2-many-ai", "Four small line charts (small multiples) of daily meal swipes, September and October 2026, one per dining hall. Each panel has its own y-axis: Bell Tower Place about 250 to 450, Maplestreet Station about 1,000 to 1,600, Garden Commons about 1,600 to 2,800, Western Dining Commons about 3,000 to 4,700. Because the axes differ, the four panels look alike, although Western serves about ten times as many swipes as Bell Tower. All four dip on weekends."),
      ideas: [
        idea("Each panel has its own y-axis", "Read the numbers on each panel's y-axis.", "the four panels do not share a y-axis (each panel has its own scale)"),
        idea("So the halls look alike although Western is about ten times Bell Tower", "How many swipes does Bell Tower have compared with Western?", "because of the separate axes the halls look similar in size even though Western serves many times more swipes than Bell Tower (about ten times)"),
      ],
      wrong: [wrong("the four dining halls are about equally busy", "Read the numbers on each panel's y-axis.")],
      tests: [
        t("ChatGPT doesn't mention that every panel has a different y axis. That makes all four halls look about the same size, but Western is around 4,000 swipes a day and Bell Tower around 400, ten times less. They should share an axis.", [1, 1], false, "full"),
        t("The scales are free, so the panels can't be compared by height: Bell Tower looks as busy as Western but is a tenth of it.", [1, 1], false, "full reworded"),
        t("The y-axes are different in each panel.", [1, 0], false, "partial"),
        t("It missed that all four halls are about equally busy, the lines are all the same height.", [0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-many-parcoord", title: "Reading parallel coordinates",
      prompt: "In a parallel coordinates chart, what does one line stand for, and what does it mean when most lines cross each other between two neighboring axes?",
      ideas: [
        idea("One line is one observation (one row)", "Follow one line from axis to axis. What is it?", "one line is one observation, one row of the data (for example one car or one country)"),
        idea("Crossing lines mean a negative relationship", "If a line is high on one axis and low on the next, what does that say?", "lines crossing between two axes show a negative relationship between those two variables (high on one, low on the other)"),
      ],
      tests: [
        t("Each line is one observation, like one country. If most lines cross between two axes, the two variables are negatively related: high values on one go with low values on the other.", [1, 1], false, "full"),
        t("A line = one row of the data. Lots of crossing = inverse relationship between those variables.", [1, 1], false, "full reworded"),
        t("Each line is a single observation in the data.", [1, 0], false, "partial"),
      ] },
  ],
},

// ================================================================================================
{
  id: "dataright", title: "Is the Data Right?", classes: "Classes 18, 21 and 22",
  blurb: "Five charts that read cleanly and still mislead, because of how the data were recorded or counted.",
  tags: ["data_visualization", "data_analysis"],
  links: { slides: [slides[21], slides[22]], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>An AI describes the chart it is shown.</b> It rarely asks whether the data could be right. That part is yours.</li>
<li><b>Question 1: does the pattern follow the business, or the reporting schedule?</b> Ohio's COVID line (Class 21) went up and down every week because counties reported on fixed days, not because the virus did. The Class 22 check-in had the same comb.</li>
<li><b>Question 2: what is one row, and could something be counted twice?</b> In a course file with one row per section, Tableau's SUM added a campus's enrollment once for every section listed. In the crash file (Class 13), one row is one person involved, not one crash.</li>
<li><b>Compare with what you know.</b> A familiar dataset that suddenly shows the opposite of what you saw in class is a reason to check the data, not a new finding.</li>
<li><b>The data in this unit</b> are simulated or altered for practice, except the crash file, which is the real one from class.</li>
</ul>` },

    { type: "explain", id: "x2-data-weekend", title: "Maintenance requests",
      prompt: `<b>${CHECK}</b> What would you ask before using these numbers?`,
      charts: [chart("dataright_weekend.png", "Bar chart of maintenance requests per day in Miami residence halls from August 24 to November 1, 2026: about 25 to 45 on Tuesdays to Fridays, about 100 to 116 every Monday, and zero on every Saturday and Sunday", "Simulated data.")],
      ai: ai("x2-data-weekend"),
      context: ctx("x2-data-weekend", "A daily bar chart of maintenance requests from students living in Miami residence halls, August 24 to November 1, 2026. Tuesday to Friday have about 25 to 45 requests, every Monday has about 100 to 116, and every Saturday and Sunday has exactly zero. Students live in the halls seven days a week, so zero requests on every weekend day is not believable: the requests are dated when staff process them, so the weekend's requests appear on Monday."),
      ideas: [
        idea("Every Saturday and Sunday shows zero requests", "Look at the days between the Friday bar and the Monday spike.", "the chart shows zero requests on Saturdays and Sundays (the weekends are empty)"),
        idea("The pattern follows when requests are recorded, not when students submit them", "Students live there all weekend. Why would the weekend's requests land on Monday?", "the zeros and the Monday spikes come from when the requests are recorded or processed (the office's or the reporting schedule), not from when students actually submit them"),
      ],
      wrong: [wrong("students actually submit no maintenance requests on weekends", "Students live in the halls on weekends too. Do zero requests make sense?")],
      tests: [
        t("ChatGPT missed that every weekend has zero requests. Students live there on weekends, so that can't be real. The requests are probably logged when staff come back on Monday, which is why Mondays spike. I'd ask whether the date is when the request was submitted or when it was processed.", [1, 1], false, "full"),
        t("The Saturdays and Sundays are blank, and Monday is about three days' worth. That's the reporting schedule (staff log on weekdays), like the Ohio COVID comb.", [1, 1], false, "full reworded"),
        t("It didn't notice the weekends are at 0.", [1, 0], false, "partial"),
        t("I agree with ChatGPT. Students don't submit requests on weekends because they are out having fun, and then on Monday they report everything.", [0, 0], true, "wrong"),
      ] },

    // Copied exactly as it was shown to ChatGPT in the recording (simulated data).
    { type: "explain", id: "x2-data-flatlines", title: "A running log",
      prompt: `<b>${CHECK}</b> What would you ask before using these numbers?`,
      charts: [chart("dataright_flatlines.png", "Line chart of weekly miles run by 30 Miami students over a 12-week program, one line per student: most lines wiggle upward, and several lines go perfectly flat for the last several weeks", "Simulated data.")],
      ai: ai("x2-data-flatlines"),
      context: ctx("x2-data-flatlines", "A line chart of weekly miles run by 30 Miami students in a 12-week running program, one line per student. Most lines wiggle upward from about 5 to 15 miles in week 1 to about 15 to 25 miles by week 12. But 9 of the 30 lines go perfectly flat from some week between weeks 4 and 9 until week 12, at exactly the same value every week. Real weekly running varies, so the flat stretches mean those students stopped logging and the app repeated their last value."),
      ideas: [
        idea("Several lines go perfectly flat (the same miles every week)", "Look for lines that stop moving.", "some students' lines are perfectly flat for several weeks, with exactly the same miles every week"),
        idea("Those weeks are repeated values, not real running", "Does anyone run exactly the same distance six weeks in a row?", "the flat stretches are not real running but repeated values, for example because students stopped logging and the app carried their last value forward"),
      ],
      wrong: [wrong("the students with flat lines really ran the same distance every week", "Real weekly running varies. What would produce exactly the same number every week?")],
      tests: [
        t("ChatGPT misses the perfectly flat lines. About 9 students show the exact same miles every week until week 12, which nobody actually runs. They probably stopped logging and the app kept repeating their last number, so I'd ask how missing weeks are handled.", [1, 1], false, "full"),
        t("Some lines are dead flat from about week 5 on. That's missing data filled in with the last value, not real running.", [1, 1], false, "full reworded"),
        t("A few lines are completely flat at the end.", [1, 0], false, "partial"),
        t("I agree, most students ran more over time with some ups and downs.", [0, 0], false, "agrees only"),
        t("I agree. A few students found a comfortable distance and kept running exactly that much every week, which shows the program worked.", [1, 0], true, "noticed, wrong reason"),
      ] },

    { type: "explain", id: "x2-data-campus", title: "Students by campus",
      prompt: "<b>ChatGPT says the totals are inflated. Is it right?</b> Use the rows under the chart to explain what went wrong, and how you would get the right number.",
      charts: [chart("dataright_campus.png", "Bar chart of students enrolled by Miami campus in Fall 2026 showing Oxford 59,740,200, Hamilton 1,762,800 and Middletown 947,100, above a table of the first five rows of the course sections file, each repeating Oxford's campus enrollment of 19,240", "Simulated data.")],
      ai: ai("x2-data-campus"),
      context: ctx("x2-data-campus", "A bar chart of students enrolled by Miami campus in Fall 2026: Oxford 59,740,200, Hamilton 1,762,800, Middletown 947,100. Under it, the first rows of course_sections_fall2026.csv: one row per course section, with columns section_id, campus, course and campus_enrollment, and every Oxford row repeats 19,240. The chart summed campus_enrollment over about 3,100 Oxford sections, so each total is the enrollment times the number of sections."),
      ideas: [
        idea("Each row is a course section that repeats the campus total", "What is one row, and what is in campus_enrollment on every Oxford row?", "each row is a course section and the campus enrollment (19,240 for Oxford) is repeated on every row"),
        idea("Summing adds it once per section, so the totals are far too large", "How many times was 19,240 added up?", "adding up (summing) that column counts the enrollment once per section, so the totals are far too large (Oxford does not have about 60 million students)"),
        idea("Take the value once per campus (MAX or AVG, not SUM)", "Which aggregation counts Oxford's 19,240 only once?", "the fix is to take the enrollment once per campus, for example with MAX, MIN or AVG instead of SUM, or from a table with one row per campus"),
      ],
      wrong: [wrong("ChatGPT is wrong to say the totals are inflated", "Could Oxford have almost 60 million students?")],
      tests: [
        t("ChatGPT is right. Each row is a course section, and every Oxford row repeats 19,240. Summing the column adds 19,240 once for every section, so Oxford shows 59.7 million. Use MAX or AVG of campus_enrollment per campus instead of SUM, like Butler's population in Press Time.", [1, 1, 1], false, "full"),
        t("Yes. The file has one row per section with the same enrollment repeated, so SUM multiplies it by the number of sections. Take the value once per campus (max).", [1, 1, 1], false, "full reworded"),
        t("It's right, 59 million students is impossible because the enrollment got added up for every section.", [0, 1, 0], false, "partial"),
        t("I think ChatGPT is wrong, the chart just shows Oxford is much bigger than the other campuses.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-data-crashes", title: "Crashes by day of the week",
      prompt: `<b>${CHECK}</b> Use the rows under the chart.`,
      charts: [chart("dataright_crashes.png", "Bar chart of traffic crashes in Cincinnati in 2025 by day of the week, Friday highest at 4,921, above five rows of the crash file in which the same instanceid appears on three rows and another on two rows", "Real data: City of Cincinnati Traffic Crash Reports, the file from Class 13.")],
      ai: ai("x2-data-crashes"),
      context: ctx("x2-data-crashes", "A bar chart titled Traffic crashes in Cincinnati by day of the week, 2025, with the y-axis labeled Number of crashes: Mon 4,136, Tue 4,539, Wed 4,833, Thu 4,682, Fri 4,921, Sat 3,831, Sun 3,183. The bars count rows of cincy_2025_crashes.csv. The rows shown under it repeat the same instanceid on three rows (a driver, an occupant, another driver) and another on two rows: one row is one person involved, not one crash. The file has 30,125 rows but 14,969 crashes; Friday had 2,409 crashes."),
      ideas: [
        idea("Each row is a person involved, not a crash (the IDs repeat)", "Look at the instanceid column.", "each row is one person involved in a crash rather than one crash, for example because the same crash ID repeats"),
        idea("So the bars overstate crashes: Friday had far fewer than 4,921", "Most crashes involve two people. About how many crashes is 4,921 rows?", "4,921 overstates the number of crashes on Friday (the real number of crashes is lower)"),
        idea("Count distinct crash IDs instead of rows", "How would you count each crash once?", "the right count comes from counting distinct (unique) crash IDs rather than rows"),
      ],
      wrong: [wrong("there were about 4,921 crashes on Fridays", "ChatGPT itself said rows. Is one row one crash?")],
      tests: [
        t("ChatGPT gives the number of rows, not crashes. The same instanceid appears on several rows because each row is a person in the crash. So Friday had a lot fewer than 4,921 crashes, about half. You'd count distinct instanceids per day.", [1, 1, 1], false, "full"),
        t("Rows are people (driver, occupant), not crashes, so 4,921 overcounts. Use COUNTD of the crash ID.", [1, 1, 1], false, "full reworded"),
        t("The crash IDs repeat, so one crash shows up multiple times.", [1, 0, 0], false, "partial"),
        t("I agree, Friday had about 4,921 crashes and Sunday the fewest.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "x2-data-penguins", title: "Penguins you have met before",
      prompt: "<b>ChatGPT describes this plot accurately. Should you believe what it shows?</b> Compare it with what you saw about these penguins in Classes 15 and 16.",
      charts: [chart("dataright_penguins.png", "Scatter plot titled Palmer penguins: flipper length and body mass, colored by species, showing body mass falling as flipper length rises, with Gentoo penguins the lightest", "")],
      ai: ai("x2-data-penguins"),
      context: ctx("x2-data-penguins", "A scatter plot labeled as the R penguins dataset, flipper length (mm) on x and body mass (g) on y, colored by species. It shows a strong negative relationship, with Gentoo penguins (longest flippers) the lightest. In the real penguins data, the relationship is strongly positive and Gentoo penguins are the heaviest. The data in this chart were altered (body mass reversed) for this example."),
      ideas: [
        idea("In the real data, longer flippers go with heavier penguins", "In class, which species was heaviest?", "in the real penguins data the relationship is positive (longer flippers go with heavier penguins), or that Gentoo penguins are actually the heaviest"),
        idea("So this data must be altered or wrong: check it first", "If a familiar dataset shows the opposite of what you know, what should you suspect?", "the data behind this chart look altered or wrong because they contradict the real dataset, so they should be checked before trusting the chart"),
      ],
      wrong: [wrong("penguins with longer flippers really are lighter", "Think back to the penguins in Classes 15 and 16. Which species was the heaviest?")],
      tests: [
        t("ChatGPT read the chart right, but the chart is wrong. In the real penguins data bigger flippers mean heavier penguins and Gentoos are the heaviest. So these numbers were changed or messed up, and I'd check the data before trusting it.", [1, 1], false, "full"),
        t("This contradicts the real dataset, where flipper length and body mass are positively related. Something is off with the data here.", [1, 1], false, "full reworded"),
        t("In class the Gentoo penguins were the heaviest ones.", [1, 0], false, "partial"),
        t("Yes, it makes sense that penguins with long flippers are lighter, they need to be light to swim fast.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "build", title: "Build It", classes: "Classes 17 and 18",
  blurb: "Answer questions from a CSV in Tableau or Power BI, then improve and rebuild two charts that ChatGPT made from the same file.",
  tags: ["data_visualization", "tableau", "power_bi"],
  links: { slides: [slides[17], slides[18]], code: [] },
  steps: [
    { type: "read", title: "What the exam asks", html: `
<p>The last two exam questions are built in Tableau or Power BI. You get a CSV, answer questions with a chart, and improve two charts that ChatGPT made from the same file. Practice both here with a file of Rec Center visits (simulated, 2,400 rows: one row per visit).</p>
<p><a href="exam02/data/rec_center_visits_fall2026.csv" download>Download rec_center_visits_fall2026.csv</a> (columns: visit_id, date, facility, visitor_type, minutes).</p>
<p><b>Design checklist (Classes 15 and 16):</b> a title that says what the chart shows, labeled axes with units, bars that start at zero and are sorted, color only when it carries a variable, and no chart junk.</p>
<p><b>Then a sanity check (Class 19):</b> could each number be true? In Map Gallery, maps that added up the weekly running totals gave Butler County about 7.6 million cases, in a county of fewer than 400,000 people.</p>` },

    { type: "task", title: "Answer from the CSV",
      html: `<ol>
<li><b>How many visits did each facility have?</b> Make a bar chart, sorted from most to fewest visits.</li>
<li><b>How does visit length differ by visitor type?</b> Make a chart that shows the spread of minutes for each visitor type, not only an average (Tableau: Show Me, box-and-whisker plot). If your tool cannot draw a box plot, show the median minutes for each visitor type.</li>
</ol>`,
      check: `<p><b>Visits by facility:</b> Main gym 734, Fitness studios 567, Courts 556, Pool 343, Climbing wall 200 (2,400 in all).</p>
<p><b>Median minutes:</b> Undergraduate 63, Graduate 52, Faculty or staff 41. Undergraduates also have the longest visits (the long tail of points above about 130 minutes).</p>
<p>If your counts are off, check that you counted rows (visit_id), not summed the minutes.</p>` },

    { type: "explain", id: "x2-build-ai", title: "Improve ChatGPT's two charts",
      prompt: "<b>ChatGPT made these two charts from the same file. Name one improvement for each chart, and say why it helps.</b>",
      charts: [
        chart("build_ai1.png", "ChatGPT's horizontal bar chart titled Visits by facility, sorted, with Main gym highlighted in dark teal and the other bars light gray-blue, values labeled", "ChatGPT's chart 1."),
        chart("build_ai2.png", "ChatGPT's box plot titled Visit length by visitor type, with undergraduate, graduate and faculty or staff boxes in three shades, and median labels that overlap the boxes", "ChatGPT's chart 2."),
      ],
      ai: { ...ai("x2-build-ai"), attached: "with the file rec_center_visits_fall2026.csv attached. The two charts above are the ones it made" },
      context: ctx("x2-build-ai", "Two charts ChatGPT made from the Rec Center visits file. Chart 1: a sorted horizontal bar chart of visits by facility (Main gym 734, Fitness studios 567, Courts 556, Pool 343, Climbing wall 200), with Main gym in a dark highlight color and the others light, with no note saying why Main gym is highlighted; the title is generic ('Visits by facility'). Chart 2: a box plot of visit minutes by visitor type (undergraduate, graduate, faculty or staff), each box in a different shade although the shades only repeat the y-axis labels; the median labels ('63 min median') overlap the boxes and whiskers and are hard to read; the chart does not show how many visits each group has (undergraduates are most of the visits)."),
      ideas: [
        idea("A specific improvement to chart 1 (visits by facility)", "Why is Main gym a different color? What does the title tell you?", "a specific, sensible improvement to the first chart (the bar chart of visits by facility), for example explaining or removing the highlight color on Main gym, or a title that states the finding"),
        idea("A specific improvement to chart 2 (the box plot)", "Can you read the median labels? How many visits does each box stand for?", "a specific, sensible improvement to the second chart (the box plot of visit length), for example moving the median labels so they do not overlap the boxes, showing how many visits each group has, or dropping colors that only repeat the labels"),
      ],
      wrong: [wrong("the first chart should be turned into a pie chart", "Five close values are easier to compare as bars on a common axis than as pie slices.")],
      tests: [
        t("Chart 1: Main gym is highlighted for no stated reason, so either use one color or say in the title why it matters ('Main gym gets the most visits'). Chart 2: the median labels sit on top of the boxes and are hard to read, move them beside the boxes, and add the number of visits for each group.", [1, 1], false, "full"),
        t("For the bar chart I would give it a title that states the takeaway. For the box plot, the three colors don't add anything since the labels already say the group, so use one color.", [1, 1], false, "full reworded"),
        t("The box plot's median text overlaps the boxes, so I'd move it.", [0, 1], false, "partial"),
        t("Make the first chart a pie chart so you can see the share of each facility.", [0, 0], true, "wrong"),
      ] },

    { type: "task", title: "Rebuild them",
      html: `<p>Rebuild both of ChatGPT's charts in Tableau or Power BI with your improvements, from the same CSV.</p>`,
      check: `<p><b>A good rebuild of chart 1:</b> sorted bars, one color (or a highlight explained in the title, such as "Main gym gets almost a third of all visits"), value labels or a light axis, and the time period in the subtitle.</p>
<p><b>A good rebuild of chart 2:</b> one box per visitor type in a single color, medians readable (labels beside the boxes or in the axis labels), and the number of visits per group, for example "Undergraduate (n = 1,870)". Undergraduates make up most of the visits, so their box rests on far more data than the faculty or staff box.</p>` },

    { type: "read", title: "Four more builds, checked for you", html: `
<p>Each build below uses a different real data file. Build the chart in Tableau or Power BI, type the numbers it asks for, and paste a screenshot of <b>just your chart</b>. The numbers are checked exactly; the chart is read by an AI model (Jev) that answers a few yes-or-no questions about it, such as "is it sorted?". The chart check is experimental, so if it gets your chart wrong, use "Report a problem".</p>
<p>Each file hides one thing to get right before the numbers come out right. Look at the rows before you build.</p>` },

    { type: "build", id: "x2-build-nba", title: "NBA players by position",
      html: `<p><b>Data:</b> <a href="exam02/data/nba_per_game_2025_26.csv" download>nba_per_game_2025_26.csv</a> (NBA per-game statistics for the 2025-26 season, used earlier in the course; columns Player, Pos, Age, G, FG, FG%, eFG%, PTS).</p>
<ol><li><b>Build:</b> a bar chart of how many players play each position (<code>Pos</code>), sorted, with a title.</li>
<li><b>Answer:</b> how many centers (<code>C</code>) played in the NBA in 2025-26?</li></ol>`,
      numbers: [num("x2-build-nba", "centers", { prompt: "Number of centers (C)", label: "Centers: 107 players", shown: "107 centers", hint: "Look at James Harden's rows. How many players is that?",
        msg: "Count each player once. Look at a player who was traded during the season.",
        wrongMsgs: ["141 counts rows, not players. A player traded during the season has a row for each team and one for the whole season, so count distinct players (COUNTD in Tableau, Distinct count in Power BI)."] })],
      shots: [SHOT.bar("position"), SHOT.sorted, SHOT.title("players by position")],
      example: { src: "exam02/charts/build_nba_example.png", alt: "Sorted horizontal bar chart titled NBA Players by Position, 2025-26: SG 154, SF 113, C 107, PF 103, PG 98" },
      shotTests: [shotTest("nba_good", [1, 1, 1, 1], "good"), shotTest("nba_unsorted_no_title", [1, 1, 0, 0], "unsorted, no title"),
                  shotTest("nba_pie", [1, 0, 0, 1], "pie chart"), shotTest("not_a_chart", [0, 0, 0, 0], "not a chart")] },

    { type: "build", id: "x2-build-airbnb", title: "Airbnb listings in Columbus",
      html: `<p><b>Data:</b> <a href="exam02/data/columbus_airbnb_2026.csv" download>columbus_airbnb_2026.csv</a> (Inside Airbnb, Columbus listings, July 2026; columns id, neighbourhood, latitude, longitude, room_type, accommodates, bedrooms, price per night in dollars).</p>
<ol><li><b>Build:</b> a map of the listings, one dot per listing, colored by room type, with a legend and a title. (Tableau: Longitude to Columns, Latitude to Rows, id to Detail, room_type to Color.)</li>
<li><b>Answer:</b> the median price per night of an entire home or apartment, and the number of private room listings.</li></ol>`,
      numbers: [
        num("x2-build-airbnb", "median_entire", { prompt: "Median price per night, entire home or apartment", label: "Median entire home: $208", unit: "$", shown: "$208 a night", hint: "Median, not average. Which one does a $9,000 listing move?",
          msg: "Filter to Entire home/apt and take the median price.",
          wrongMsgs: ["That is the average. A few listings cost thousands of dollars a night and pull the average up; the question asks for the median."] }),
        num("x2-build-airbnb", "private_rooms", { prompt: "Number of private room listings", label: "Private rooms: 429", shown: "429 private room listings", hint: "One row is one listing.",
          msg: "Count the listings whose room_type is Private room." }),
      ],
      shots: [
        { label: "One dot per listing, placed by location", hint: "Is each listing its own dot on the map?",
          ask: "Does `chart` show many small points placed by location, as on a map (by latitude and longitude, or on a map background)?",
          yes: "The chart shows many dots spread over an area by their location, like a map of listings.",
          no: "The chart does not place individual points by location: for example it is a bar chart, a pie chart, a table, or a map of shaded areas with no individual points." },
        { label: "Colored by room type, with a legend", hint: "Can a reader tell the room types apart?",
          ask: "Are the points in `chart` colored by room type, with a legend that names the room types?",
          yes: "The points have different colors for different room types (such as Entire home/apt and Private room), and a legend explains the colors.",
          no: "All the points are one color, or there is no legend that names the room types, or there are no points." },
        SHOT.title("Airbnb listings in Columbus by room type"),
      ],
      example: { src: "exam02/charts/build_airbnb_example.png", alt: "Map of Columbus Airbnb listings as dots by latitude and longitude, colored by room type with a legend" },
      shotTests: [shotTest("airbnb_good", [1, 1, 1, 1], "good"), shotTest("airbnb_map_one_color", [1, 1, 0, 1], "one color"),
                  shotTest("airbnb_bar_not_map", [1, 0, 0, 1], "a bar chart, not a map")] },

    { type: "build", id: "x2-build-salaries", title: "Pay in analytics jobs",
      html: `<p><b>Data:</b> <a href="exam02/data/analytics_salaries_2025.csv" download>analytics_salaries_2025.csv</a> (U.S. Bureau of Labor Statistics, May 2025; eight analytics occupations with the 25th percentile, median and 75th percentile of annual pay).</p>
<ol><li><b>Build:</b> one chart that shows, for each occupation, the range from the 25th to the 75th percentile with the median marked inside it, sorted by median pay, with pay shown in dollars. (Tableau: a Gantt bar starting at p25 with size p75 minus p25, plus the median as a dot on a dual axis.)</li>
<li><b>Answer:</b> which occupation has the widest middle 50% of pay, and how wide is it in dollars (75th percentile minus 25th percentile)?</li></ol>`,
      numbers: [num("x2-build-salaries", "widest_spread", { prompt: "Width of the widest middle 50% of pay (75th minus 25th percentile)", label: "Widest: Data Scientists, $73,220", unit: "$", shown: "$73,220 (Data Scientists)", hint: "Compute p75 minus p25 for each row, then find the largest.",
        msg: "For each occupation, subtract its own 25th percentile from its own 75th percentile; then take the largest.",
        wrongMsgs: ["That subtracts across two occupations (the highest 75th percentile minus the lowest 25th percentile). Do the subtraction within each occupation first."] })],
      shots: [
        { label: "A range for each occupation", hint: "Does each occupation show a spread, not one number?",
          ask: "Does `chart` show, for each occupation, a range from a low pay value to a high pay value (a bar or line that spans from one value to another)?",
          yes: "Each occupation has a bar or line segment that starts at one value and ends at another, showing a spread of pay, such as a floating bar or a dumbbell.",
          no: "Each occupation has only a single value, such as one bar that starts at zero or one dot, so no range is shown." },
        { label: "The median marked inside each range", hint: "Where does the middle of each range sit?",
          ask: "Does `chart` mark a middle value, such as the median, inside each occupation's range with a separate dot, tick or line?",
          yes: "Inside each range there is a separate mark, such as a dot, tick or line, for a middle value.",
          no: "There is no separate middle mark inside the ranges, or there are no ranges." },
        // (a "sorted by median" check was dropped: two pairs of medians are nearly tied, so a sorted chart does not look
        // clearly sorted, and Jev was unsure at about 0.5; the NBA and flights builds check sorting)
        { label: "Pay shown in dollars", hint: "Would a reader know the numbers are dollars a year?",
          ask: "Does `chart` show the pay values formatted as dollars (with a $ sign or the word dollars on the axis or labels)?",
          yes: "The axis labels, value labels or axis title show the pay as dollars, for example $100,000 or Annual pay (dollars).",
          no: "The numbers have no $ sign and nothing says they are dollars, or there are no pay values shown." },
      ],
      example: { src: "exam02/charts/build_salaries_example.png", alt: "Chart of eight analytics occupations, each with a pink bar from the 25th to the 75th percentile of pay and a red dot at the median, sorted by median" },
      shotTests: [shotTest("salaries_good", [1, 1, 1, 1], "good"), shotTest("salaries_median_bars_only", [1, 0, 0, 1], "median bars only (in dollars)")] },

    { type: "build", id: "x2-build-flights", title: "Late flights from Ohio",
      html: `<p><b>Data:</b> <a href="exam02/data/ohio_flights_august_2026.csv" download>ohio_flights_august_2026.csv</a> (U.S. Bureau of Transportation Statistics on-time data, August 2026: every flight that left an Ohio airport; columns date, airline, origin, destination, dep_delay_min, arr_delay_min).</p>
<ol><li><b>Build:</b> a bar chart of the share of each airline's flights that arrived 15 or more minutes late, sorted, shown in percent, with a title.</li>
<li><b>Answer:</b> how many flights have no arrival delay recorded, and what percent of American Airlines flights arrived 15 or more minutes late (one decimal)?</li></ol>`,
      numbers: [
        num("x2-build-flights", "no_arrival", { prompt: "Number of flights with no arrival delay recorded", label: "No arrival recorded: 467 flights", shown: "467 flights", hint: "Look for blanks in arr_delay_min. What happened to those flights?",
          msg: "Count the rows where arr_delay_min is empty." }),
        num("x2-build-flights", "american_late", { prompt: "Percent of American Airlines flights arriving 15 or more minutes late", label: "American: 22.7% late", unit: "%", shown: "22.7%", hint: "Late means 15 minutes or more. Which flights belong in the denominator?",
          msg: "Late means arr_delay_min of 15 or more. Divide by American's flights that have an arrival delay recorded.",
          wrongMsgs: ["That counts cancelled and diverted flights as on time. They never arrived, so leave them out of the share."] }),
      ],
      shots: [SHOT.bar("airline"), SHOT.sorted,
        { label: "Shown in percent", hint: "Is the axis a share or a count?",
          ask: "Does `chart` show percentages (a percent axis or percent labels) rather than numbers of flights?",
          yes: "The axis or the labels show percentages, such as 20%, or shares such as 0.2.",
          no: "The axis or the labels show numbers of flights or another number that is not a percentage." }],
      example: { src: "exam02/charts/build_flights_example.png", alt: "Sorted horizontal bar chart of the share of flights from Ohio arriving 15 or more minutes late by airline, August 2026, from Alaska (about 33%) down to JetBlue (about 17%)" },
      shotTests: [shotTest("flights_good", [1, 1, 1, 1], "good"), shotTest("flights_counts_unsorted", [1, 1, 0, 0], "counts, unsorted")] },
  ],
},

];
