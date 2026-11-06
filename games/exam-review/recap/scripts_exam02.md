# Recap clips for the Exam 02 review: narration scripts

Nine clips, one per content unit (Classes 15 to 22), about 50 to 75 seconds each. Each script uses only what the
unit's "What to remember" says, which comes from the class decks. Fadel approved making these clips on Nov 5, 2026. Edit the text and content/recap_exam02.mjs together:
`node make_recap.mjs --exam exam02` stops if the narration differs from this file.

Spoken spellings: "A I" is read as AI, "Power B I" as Power BI, "three D" as 3D; the captions and board show the real
spellings.

---

## 1. Honest Charts (Class 15)

A chart is honest when the size you see matches the size in the data. Bars show values by their length, so a
bar chart must start at zero. Start the axis at eleven thousand, and a season with twelve thousand fans gets a
bar one unit tall, while fifteen thousand gets four units, though it is only a quarter more. Lines are
different. A line shows values by position and slope, so it may start above zero, as long as the axis is
labeled. The lie factor puts a number on it: the size of the effect shown, divided by the size of the effect
in the data. Near one is honest. Enrollment grows twenty percent, the drawing grows sixty percent, and the lie
factor is three. Two more habits. Remove ink that shows no data: three D, heavy grids, decoration. And be wary
of dual axes: the designer picks both scales, so any two lines can be made to move together.

**Board:** "Honest: what you see = what the data say"; "bars: length shows the value"; "so start at zero"; "lines:
position and slope"; "may start above zero"; "(label the axis)"; "Lie factor"; "effect shown"; "÷ effect in
the data"; "near 1 = honest"; "Two more habits"; "data-ink: remove ink"; "that shows no data"; "Dual axes";
"the designer picks"; "both scales"; "any two lines 'agree'".

**Animated charts:**

- two bars (12,000 and 15,000) on an axis from 11,000, "looks 4 times as big"; then the same bars from zero, "really 25% more"
- bars growing 100 to 120 "in the data" and 100 to 160 "as drawn"; then "lie factor = 60 / 20 = 3"
- a 3D bar chart on a heavy grid with a "WOW!" sticker; the 3D, the grid and the sticker go as each is named
- two lines on two axes; the scales (0 to 900, 40.1 to 40.3) appear; "each scale was picked to line up"

---

## 2. Data Types and Encodings (Classes 15 and 16)

Before you choose a chart, name each variable's type. Nominal variables are names with no order, like a major
or a dining hall. Ordinal variables have an order, like first, second and third place. Quantitative variables
are numbers you can subtract, like points per game. Then match each type to a channel. For numbers, people
read position on a common scale best, then length, then angle and area, then color intensity. Hue and shape
have no order, so they are for categories. The grammar of graphics names the parts of any chart: the data, the
aesthetics that map variables to x, y, color and size, the geom, the scales, the facets and the coordinates.
To read a chart, list each variable and the channel it uses. The axes give you two, and the legends give you
the rest.

**Board:** "Name the type first"; "nominal: names, no order"; "ordinal: ordered labels"; "quantitative: numbers"; "you
can subtract"; "Channels for numbers, best first"; "position > length"; "> angle, area > color"; "hue, shape:
categories"; "The grammar of graphics"; "data, aesthetics, geom,"; "scales, facets, coords"; "to read a chart,
list"; "each variable + channel"; "axes: two"; "legends: the rest".

**Animated charts:**

- three name tags that trade places (no order); a podium, 1st 2nd 3rd; a number line with 12 and 27, "27 - 12 = 15 points per game"
- the same two numbers shown by position, length, angle and area, and color intensity, one row each as named; then hue and shape for categories
- a chart built part by part as each is named: a data table, the mappings (hours to x, GPA to y, year to color, credits to size), the points, the scales and legend, two facets, the axes; then the axis titles are circled (two variables) and the legend (the rest)

---

## 3. Color (Classes 15, 16 and 21)

Pick a color scheme from the data, not from taste. Sequential schemes go from light to dark in one hue, for
ordered values from low to high, like counts, rates or minutes. Diverging schemes use two hues that meet at a
meaningful middle, like zero, an average or a target, for values above and below it. Qualitative schemes use
unrelated hues of similar lightness, for categories with no order, like majors or dining halls. Watch for
three common mistakes. A rainbow or qualitative scheme on ordered data: without the legend, nobody can tell
which color means more. A diverging scheme with no meaningful middle. And red next to green: about one man in
twelve cannot tell them apart. Use color sparingly, and let it carry a variable.

**Board:** "Color follows the data"; "sequential: light to dark,"; "low to high"; "diverging: two hues,"; "a meaningful
middle"; "(zero, average, target)"; "qualitative: separate hues,"; "for categories"; "Three mistakes"; "1.
rainbow on ordered data"; "2. diverging, no real middle"; "3. red next to green"; "(1 man in 12)"; "use color
sparingly,"; "for a variable".

**Animated charts:**

- swatches: light to dark blue (low, high); purple to white to orange (below, the middle, above); five separate hues (categories, no order)
- a rainbow legend for 1 to 5, "which color means more?"; a purple-white-orange scale for 0 to 60 minutes, "what is special about 30?"; red and green dots that turn to two near-identical olives, "as about 1 man in 12 sees them"

---

## 4. Commonly Used Charts (Class 20)

Choose the chart from the question you are answering. To compare categories, use bars. For change over time, a
line. For part of a whole, sorted bars of each part's share. Pies show values by angle and area, which people
compare poorly. In Pie on Trial, the same values were easier to rank as bars. Stacked bars have a catch. Only
the bottom segment and the total sit on the baseline. Every middle segment floats, so comparing it across
years means subtracting by eye. Instead, show two charts side by side, one for the total and one for the
categories, or use a paneled bar chart, with one panel per category. And a bar chart should not show averages.
A bar suggests that the data sit inside it, and it hides how spread out they are. Show the points instead,
with a line at each average, or on top of a box plot.

**Board:** "Start from the question"; "Pies: angle and area are hard to compare"; "Stacked bars"; "only the bottom
segment"; "and the total sit on"; "the baseline"; "middle segments float:"; "you subtract by eye"; "Instead of
stacking"; "No bars for averages"; "a bar suggests the data"; "sit inside it"; "and it hides the spread";
"show the points:"; "+ a line at the average"; "or on a box plot".

**Animated charts:**

- three rows, one per question: bars, a line, sorted bars of the shares
- an unsorted pie of 27, 25, 24, 24, "which slice is largest?"; then the same values as bars, "A, at a glance"
- three stacked bars (north, south, west); the middle (pink) segment is outlined, with dashed lines to where it starts
- the same data, two ways: 1. two charts side by side, a total chart and a by-category chart of side-by-side bars; 2. a paneled bar chart, one panel per category
- two equal bars for two groups with the same average; then the bars go and the points appear (one group tight, one spread out) with a line at each average; then the lines go and a box plot is drawn under each group's points

---

## 5. Time (Class 21)

For time, the first choice is a line or bars. A line suits many, evenly spaced time points, when the trend is
the story. Bars suit a few separate periods that you compare one by one. With only two time points, a line
draws a path between them that was never measured. Check the spacing of the time axis. When years are skipped
but drawn the same distance apart, every slope is bent. Compare the change per year. Seasonality is a pattern
that repeats every year, like semesters and breaks. To judge growth, compare the same month across years, not
neighboring months. Calendar plots lay daily values out like a calendar, so day-of-week patterns stand out.
Finally, animation or small multiples. Animation draws attention, but asks you to remember earlier frames.
Small multiples put every time point side by side.

**Board:** "Lines or bars?"; "line: many, evenly spaced"; "points, the trend"; "bars: a few periods,"; "compared one by
one"; "two points? the line"; "invents the path between"; "skipped years, same spacing:"; "every slope is
bent"; "compare the change per year"; "Seasonality"; "repeats every year:"; "semesters and breaks"; "growth:
the same month,"; "year over year"; "calendar plot: day-of-week"; "patterns stand out"; "animation: you must
remember"; "small multiples: side by side".

**Animated charts:**

- 24 monthly points joined by a line
- four bars, 2023 to 2026
- two points, 2020 and 2025, joined by a straight line; then dashed paths it might have taken, "the straight path was never measured"
- 2000, 2010, 2020, 2022, 2024 drawn evenly; the gaps (10 yrs, 10 yrs, 2, 2) appear; then the years move to their true spacing and the rates show (+1 a year, +3 a year)
- two years of monthly visits with the same dips; then September is circled in both years, "Sep to Sep: +12%"
- a month as a calendar grid, weekdays dark and weekends pale
- one panel whose bars change from 2024 to 2025 to 2026; then three small panels, one per year

---

## 6. Maps (Classes 19 and 21)

A map is only as good as the number in each region. A choropleth fills each region with a color. Use it for
rates or shares, such as cases per ten thousand residents. Fill it with raw counts, and the map mostly shows
where people live. In Ohio, Franklin, Cuyahoga and Hamilton counties hold about a third of the people, so they
lead almost any count. For totals, use proportional symbols: one circle per region, sized by the count. A
cartogram resizes the regions themselves by a variable such as population, so small, crowded places are not
hidden by large, empty ones. So before you read any map of counts, ask how many people live in each region.

**Board:** "What does each region show?"; "choropleth: each region"; "filled with a color"; "for rates or shares"; "(per
10,000 residents)"; "raw counts mostly show"; "where people live"; "3 counties: 1/3 of Ohioans"; "Totals:
proportional symbols"; "one circle per region,"; "sized by the count"; "cartogram: regions resized"; "by
population"; "first ask: how many"; "people live there?".

**Animated charts:**

- a grid of 20 counties (not a real map) shaded by a rate; then by raw counts, and three tiles go dark: Franklin, Cuyahoga, Hamilton
- the same grid with one circle per county sized by the count; then the tiles resize by population (a cartogram)

---

## 7. Many Variables (Class 22)

High-dimensional data have more variables than an x and a y can carry. Small multiples repeat the same small
chart once for each group. Check whether the panels share an axis. With separate axes, every panel fills its
box, and big and small groups look alike. Parallel coordinates give each variable its own vertical axis, and
each observation one line. Lines that cross between two axes show a negative relationship. Lines that run
parallel show a positive one. A radar chart is parallel coordinates wrapped into a circle, and its shape
depends on the order of the axes. A heat map is a grid of cells, each colored by its value. A treemap nests
rectangles sized by value, for parts of a whole with a hierarchy. And Chernoff faces turn variables into the
features of a face: memorable, but hard to read precisely.

**Board:** "Many variables"; "small multiples: one"; "small chart per group"; "check the axes: free axes"; "make groups
look alike"; "parallel coordinates:"; "one axis per variable"; "one line per observation"; "crossing:
negative"; "parallel: positive"; "More charts for many variables"; "radar: its shape depends"; "on the axis
order"; "heat map: a grid of cells"; "colored by value"; "treemap: nested rectangles"; "parts of a whole";
"Chernoff faces: memorable,"; "hard to read precisely".

**Animated charts:**

- four dining-hall panels on one shared axis (Western far above Bell Tower); then each panel gets its own axis and they look alike
- three axes (price, units sold, revenue) and six lines; the price to units sold band is marked "crossing: negative", the units sold to revenue band "parallel: positive"
- a radar whose shape changes when its axes are reordered; a heat map; a treemap; two Chernoff faces

---

## 8. Is the Data Right? (Classes 18, 21 and 22)

An A I describes the chart it is shown. It rarely asks whether the data could be right. That part is yours.
Ask two questions. First, does the pattern follow the business, or the reporting schedule? Ohio's COVID line
rose and fell every week because counties reported on fixed days, not because the virus did. Second, what is
one row, and could something be counted twice? In a course file, Tableau's sum added a campus's enrollment
once for every section listed. In the crash file, one row is one person, not one crash. When a pattern looks
too sudden, too regular or too big, ask how the data were collected before you trust the story.

**Board:** "Is the data right?"; "the AI describes the chart;"; "the check is yours"; "1. the business, or the";
"reporting schedule?"; "Ohio COVID: a weekly comb"; "from reporting days"; "2. What is one row?"; "counted
twice?"; "course file: SUM added the"; "enrollment once per row"; "crash file: a row = a person"; "not a
crash"; "too sudden, regular or big?"; "ask how it was collected".

**Animated charts:**

- six weeks of daily cases with a spike every week; then the spikes are marked, "a spike every Tuesday: the reporting day"
- a crash table with 7 rows, "7 rows = 7 people"; then the rows group into 3 crashes

---

## 9. Build It (Classes 17 and 18)

In Tableau or Power B I, start by asking what one row of the file is. Tableau sums a measure by default. That
is right for sales, and wrong for a value that repeats on every row, like a campus's enrollment listed on
every course section: take it once, with the maximum or the average. To count records, count rows, or count
distinct IDs when a record can appear more than once. Then make the chart answer the question, and finish it
with the design checklist. A title that says what the chart shows. Labeled axes with units. Bars that start at
zero and are sorted. Color only when it carries a variable. And no chart junk. Last, give every number a
sanity check: could it be true? In Map Gallery, maps that added up the running totals gave Butler County more
than seven million cases, in a county of fewer than four hundred thousand people. Save a packaged Tableau
workbook, or a Power B I file, so the data travel with it.

**Board:** "Before you drag anything"; "what is one row of the file?"; "Tableau sums by default"; "repeated value?";
"take it once: MAX or AVG"; "count rows, or count"; "distinct IDs"; "The design checklist"; "answer the
question"; "a title: what it shows"; "labeled axes, with units"; "bars from zero, sorted"; "color only for a
variable"; "no chart junk"; "Sanity check"; "could this number be true?"; "Map Gallery: running totals";
"added up: 7 million+ cases"; "in a county of < 400,000"; ".twbx or .pbix, so the"; "data travel with it".

**Animated charts:**

- four course sections, each listing Oxford's enrollment, 19,240; the column is circled, "SUM: 76,960 (4 x 19,240)"; then "MAX or AVG: 19,240 (once)"
- a messy bar chart of Rec Center visits (rainbow colors, heavy grid, shadows, axis from 150) fixed one item at a time: a title, axis labels, bars from zero and sorted, one color, then the grid and shadows go
- Butler County in Map Gallery: a bar of 7.6 million cases (the running totals added up) next to a bar of its 383,134 people, "more cases than people?"

---
