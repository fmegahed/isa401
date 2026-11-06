// The nine Exam 02 recap clips (Classes 15 to 22): what is said and what is drawn while it is said.
// Same format as content/recap.mjs (see its header); built by `node make_recap.mjs --exam exam02`, and the narration
// must equal recap/scripts_exam02.md word for word (Fadel approved making these on Nov 5, 2026).
// Each clip uses only what the unit's "What to remember" says, which comes from the class decks.

export default [
{ id: "honest", segs: [
  { say: "A chart is honest when the size you see matches the size in the data.", board: [{ hand: "Honest: what you see = what the data say", big: true, color: "red" }] },
  { say: "Bars show values by their length, so a bar chart must start at zero.", board: [
    { hand: "bars: length shows the value", at: "Bars show" }, { hand: "so start at zero", indent: 1, color: "red", at: "must start at zero" }] },
  { say: "Start the axis at eleven thousand, and a season with twelve thousand fans gets a bar one unit tall, while fifteen thousand gets four units, though it is only a quarter more.", board: [
    { sketch: "truncBars", at: "Start the axis", phases: ["though it is only"] }] },
  { say: "Lines are different. A line shows values by position and slope, so it may start above zero, as long as the axis is labeled.", board: [
    { gap: true }, { hand: "lines: position and slope", at: "A line shows" },
    { hand: "may start above zero", indent: 1, at: "may start above" }, { hand: "(label the axis)", indent: 1, at: "as long as" }] },
  { say: "The lie factor puts a number on it: the size of the effect shown, divided by the size of the effect in the data.", board: [
    { page: true }, { hand: "Lie factor", big: true, color: "red" },
    { hand: "effect shown", at: "the size of the effect shown" }, { hand: "÷ effect in the data", at: "divided by" }] },
  { say: "Near one is honest. Enrollment grows twenty percent, the drawing grows sixty percent, and the lie factor is three.", board: [
    { gap: true }, { hand: "near 1 = honest", color: "blue", at: "Near one" },
    { sketch: "lieFactor", at: "Enrollment grows", phases: ["the lie factor is three"] }] },
  { say: "Two more habits. Remove ink that shows no data: three D, heavy grids, decoration.", board: [
    { page: true }, { hand: "Two more habits", big: true, color: "red" },
    { hand: "data-ink: remove ink", at: "Remove ink" }, { hand: "that shows no data", indent: 1, at: "that shows no data" },
    { sketch: "dataInk", at: "Two more habits", phases: ["three D", "heavy grids", "decoration"] }] },
  { say: "And be wary of dual axes: the designer picks both scales, so any two lines can be made to move together.", board: [
    { page: true }, { hand: "Dual axes", big: true, color: "red" },
    { hand: "the designer picks", at: "the designer picks" }, { hand: "both scales", indent: 1, at: "both scales" },
    { hand: "any two lines 'agree'", color: "blue", at: "so any two lines" },
    { sketch: "dualAxes", at: "dual axes", phases: ["picks both scales", "so any two lines"] }] },
] },

{ id: "encodings", segs: [
  { say: "Before you choose a chart, name each variable's type.", board: [{ hand: "Name the type first", big: true, color: "red" }] },
  { say: "Nominal variables are names with no order, like a major or a dining hall.", board: [
    { hand: "nominal: names, no order", at: "Nominal" },
    { sketch: "varTypes", at: "Nominal", phases: ["Ordinal", "Quantitative"] }] },
  { say: "Ordinal variables have an order, like first, second and third place.", board: [{ hand: "ordinal: ordered labels", at: "Ordinal" }] },
  { say: "Quantitative variables are numbers you can subtract, like points per game.", board: [
    { hand: "quantitative: numbers", at: "Quantitative" }, { hand: "you can subtract", indent: 1, at: "you can subtract" }] },
  { say: "Then match each type to a channel. For numbers, people read position on a common scale best, then length, then angle and area, then color intensity.", board: [
    { page: true }, { hand: "Channels for numbers, best first", big: true, color: "red" },
    { hand: "position > length", at: "position on a common scale" }, { hand: "> angle, area > color", indent: 1, at: "then angle and area" },
    { sketch: "channels", at: "position on a common scale", phases: ["then length", "then angle and area", "then color intensity", "Hue and shape"] }] },
  { say: "Hue and shape have no order, so they are for categories.", board: [{ gap: true }, { hand: "hue, shape: categories", color: "blue", at: "Hue and shape" }] },
  { say: "The grammar of graphics names the parts of any chart: the data, the aesthetics that map variables to x, y, color and size, the geom, the scales, the facets and the coordinates.", board: [
    { page: true }, { hand: "The grammar of graphics", big: true, color: "red" },
    { hand: "data, aesthetics, geom,", at: "the data" }, { hand: "scales, facets, coords", at: "the scales" },
    { sketch: "grammar", at: "the data", phases: ["the aesthetics", "the geom", "the scales", "the facets", "the coordinates", "The axes give you two", "the legends give"] }] },
  { say: "To read a chart, list each variable and the channel it uses. The axes give you two, and the legends give you the rest.", board: [
    { gap: true }, { hand: "to read a chart, list", at: "To read a chart" }, { hand: "each variable + channel", indent: 1, at: "list each variable" },
    { hand: "axes: two", at: "The axes give you two" }, { hand: "legends: the rest", at: "the legends give" }] },
] },

{ id: "color", segs: [
  { say: "Pick a color scheme from the data, not from taste.", board: [{ hand: "Color follows the data", big: true, color: "red" }] },
  { say: "Sequential schemes go from light to dark in one hue, for ordered values from low to high, like counts, rates or minutes.", board: [
    { hand: "sequential: light to dark,", at: "Sequential" }, { hand: "low to high", indent: 1, at: "from low to high" },
    { sketch: "schemes", at: "Sequential", phases: ["Diverging", "Qualitative"] }] },
  { say: "Diverging schemes use two hues that meet at a meaningful middle, like zero, an average or a target, for values above and below it.", board: [
    { hand: "diverging: two hues,", at: "Diverging" }, { hand: "a meaningful middle", indent: 1, at: "a meaningful middle" },
    { hand: "(zero, average, target)", indent: 1, at: "like zero" }] },
  { say: "Qualitative schemes use unrelated hues of similar lightness, for categories with no order, like majors or dining halls.", board: [
    { hand: "qualitative: separate hues,", at: "Qualitative" }, { hand: "for categories", indent: 1, at: "for categories" }] },
  { say: "Watch for three common mistakes.", board: [{ page: true }, { hand: "Three mistakes", big: true, color: "red" }] },
  { say: "A rainbow or qualitative scheme on ordered data: without the legend, nobody can tell which color means more.", board: [
    { hand: "1. rainbow on ordered data", at: "A rainbow" },
    { sketch: "colorMistakes", at: "A rainbow", phases: ["A diverging", "red next to green", "cannot tell them apart"] }] },
  { say: "A diverging scheme with no meaningful middle.", board: [{ hand: "2. diverging, no real middle", at: "A diverging" }] },
  { say: "And red next to green: about one man in twelve cannot tell them apart.", board: [
    { hand: "3. red next to green", at: "red next to green" }, { hand: "(1 man in 12)", indent: 1, at: "one man in twelve" }] },
  { say: "Use color sparingly, and let it carry a variable.", board: [
    { gap: true }, { hand: "use color sparingly,", color: "blue", at: "Use color" }, { hand: "for a variable", indent: 1, color: "blue", at: "let it carry" }] },
] },

{ id: "common", segs: [
  { say: "Choose the chart from the question you are answering.", board: [{ hand: "Start from the question", big: true, color: "red" }] },
  { say: "To compare categories, use bars. For change over time, a line. For part of a whole, sorted bars of each part's share.", board: [
    { sketch: "chooseChart", box: "wide", at: "To compare", phases: ["For change", "For part"] }] },
  { say: "Pies show values by angle and area, which people compare poorly. In Pie on Trial, the same values were easier to rank as bars.", board: [
    { page: true }, { hand: "Pies: angle and area are hard to compare", big: true, color: "red", at: "Pies show" },
    { sketch: "pieVsBars", box: "wide", at: "Pies show", phases: ["In Pie on Trial"] }] },
  { say: "Stacked bars have a catch. Only the bottom segment and the total sit on the baseline.", board: [
    { page: true }, { hand: "Stacked bars", big: true, color: "red" },
    { hand: "only the bottom segment", at: "Only the bottom" }, { hand: "and the total sit on", indent: 1, at: "and the total" },
    { hand: "the baseline", indent: 1, at: "the baseline" },
    { sketch: "stacked", at: "Stacked bars", phases: ["Every middle"] }] },
  { say: "Every middle segment floats, so comparing it across years means subtracting by eye.", board: [
    { gap: true }, { hand: "middle segments float:", at: "Every middle" }, { hand: "you subtract by eye", indent: 1, at: "subtracting by eye" }] },
  { say: "Instead, show two charts side by side, one for the total and one for the categories, or use a paneled bar chart, with one panel per category.", board: [
    { page: true }, { hand: "Instead of stacking", big: true, color: "red" },
    { sketch: "unstacked", box: "wide", at: "Instead, show two charts", phases: ["one for the total", "one for the categories", "or use a paneled"] }] },
  { say: "And a bar chart should not show averages. A bar suggests that the data sit inside it, and it hides how spread out they are. Show the points instead, with a line at each average, or on top of a box plot.", board: [
    { page: true }, { hand: "No bars for averages", big: true, color: "red" },
    { hand: "a bar suggests the data", at: "A bar suggests" }, { hand: "sit inside it", indent: 1, at: "sit inside it" },
    { hand: "and it hides the spread", at: "hides how spread" },
    { gap: true }, { hand: "show the points:", color: "blue", at: "Show the points" },
    { hand: "+ a line at the average", indent: 1, color: "blue", at: "with a line" },
    { hand: "or on a box plot", indent: 1, color: "blue", at: "or on top of a box plot" },
    { sketch: "meanBar", at: "should not show averages", phases: ["Show the points", "or on top of a box plot"] }] },
] },

{ id: "time", segs: [
  { say: "For time, the first choice is a line or bars.", board: [{ hand: "Lines or bars?", big: true, color: "red" }] },
  { say: "A line suits many, evenly spaced time points, when the trend is the story. Bars suit a few separate periods that you compare one by one.", board: [
    { hand: "line: many, evenly spaced", at: "A line suits" }, { hand: "points, the trend", indent: 1, at: "when the trend" },
    { hand: "bars: a few periods,", at: "Bars suit" }, { hand: "compared one by one", indent: 1, at: "compare one by one" },
    { sketch: "lineMany", at: "A line suits", until: "Bars suit" },
    { sketch: "barsFew", at: "Bars suit", until: "With only two" }] },
  { say: "With only two time points, a line draws a path between them that was never measured.", board: [
    { hand: "two points? the line", color: "blue", at: "With only two" }, { hand: "invents the path between", indent: 1, color: "blue", at: "a path between" },
    { sketch: "twoPoints", at: "With only two", phases: ["never measured"], until: "Check the spacing" }] },
  { say: "Check the spacing of the time axis. When years are skipped but drawn the same distance apart, every slope is bent. Compare the change per year.", board: [
    { gap: true }, { hand: "skipped years, same spacing:", at: "When years" }, { hand: "every slope is bent", indent: 1, at: "every slope is bent" },
    { hand: "compare the change per year", at: "Compare the change" },
    { sketch: "unevenYears", at: "of the time axis", phases: ["every slope is bent", "Compare the change"] }] },
  { say: "Seasonality is a pattern that repeats every year, like semesters and breaks. To judge growth, compare the same month across years, not neighboring months.", board: [
    { page: true }, { hand: "Seasonality", big: true, color: "red" },
    { hand: "repeats every year:", at: "a pattern" }, { hand: "semesters and breaks", indent: 1, at: "like semesters" },
    { hand: "growth: the same month,", at: "To judge growth" }, { hand: "year over year", indent: 1, at: "across years" },
    { sketch: "seasonal", at: "Seasonality is", phases: ["To judge growth"], until: "Calendar plots" }] },
  { say: "Calendar plots lay daily values out like a calendar, so day-of-week patterns stand out.", board: [
    { gap: true }, { hand: "calendar plot: day-of-week", at: "Calendar plots" }, { hand: "patterns stand out", indent: 1, at: "patterns stand out" },
    { sketch: "calendar", at: "Calendar plots", until: "Finally" }] },
  { say: "Finally, animation or small multiples. Animation draws attention, but asks you to remember earlier frames. Small multiples put every time point side by side.", board: [
    { gap: true }, { hand: "animation: you must remember", at: "Animation draws" }, { hand: "small multiples: side by side", at: "Small multiples put" },
    { sketch: "animVsSmall", at: "Finally", phases: ["Small multiples put"] }] },
] },

{ id: "maps", segs: [
  { say: "A map is only as good as the number in each region.", board: [{ hand: "What does each region show?", big: true, color: "red" }] },
  { say: "A choropleth fills each region with a color. Use it for rates or shares, such as cases per ten thousand residents.", board: [
    { hand: "choropleth: each region", at: "A choropleth" }, { hand: "filled with a color", indent: 1, at: "fills each region" },
    { hand: "for rates or shares", at: "Use it for" }, { hand: "(per 10,000 residents)", indent: 1, at: "per ten thousand" },
    { sketch: "countVsRate", at: "A choropleth", phases: ["Fill it with raw counts", "Franklin"] }] },
  { say: "Fill it with raw counts, and the map mostly shows where people live.", board: [
    { hand: "raw counts mostly show", color: "blue", at: "Fill it" }, { hand: "where people live", indent: 1, color: "blue", at: "where people live" }] },
  { say: "In Ohio, Franklin, Cuyahoga and Hamilton counties hold about a third of the people, so they lead almost any count.", board: [
    { hand: "3 counties: 1/3 of Ohioans", at: "Franklin" }] },
  { say: "For totals, use proportional symbols: one circle per region, sized by the count.", board: [
    { page: true }, { hand: "Totals: proportional symbols", big: true, color: "red" },
    { hand: "one circle per region,", at: "one circle" }, { hand: "sized by the count", indent: 1, at: "sized by the count" },
    { sketch: "symbols", at: "For totals", phases: ["A cartogram"] }] },
  { say: "A cartogram resizes the regions themselves by a variable such as population, so small, crowded places are not hidden by large, empty ones.", board: [
    { gap: true }, { hand: "cartogram: regions resized", at: "A cartogram" }, { hand: "by population", indent: 1, at: "such as population" }] },
  { say: "So before you read any map of counts, ask how many people live in each region.", board: [
    { gap: true }, { hand: "first ask: how many", color: "red", at: "ask how many" }, { hand: "people live there?", indent: 1, color: "red", at: "people live" }] },
] },

{ id: "many", segs: [
  { say: "High-dimensional data have more variables than an x and a y can carry.", board: [{ hand: "Many variables", big: true, color: "red" }] },
  { say: "Small multiples repeat the same small chart once for each group.", board: [
    { hand: "small multiples: one", at: "Small multiples" }, { hand: "small chart per group", indent: 1, at: "once for each group" },
    { sketch: "smallMult", at: "Small multiples", phases: ["With separate axes"], until: "Parallel coordinates" }] },
  { say: "Check whether the panels share an axis. With separate axes, every panel fills its box, and big and small groups look alike.", board: [
    { hand: "check the axes: free axes", color: "blue", at: "Check whether" }, { hand: "make groups look alike", indent: 1, color: "blue", at: "big and small groups" }] },
  { say: "Parallel coordinates give each variable its own vertical axis, and each observation one line.", board: [
    { gap: true }, { hand: "parallel coordinates:", at: "Parallel coordinates" }, { hand: "one axis per variable", indent: 1, at: "its own vertical axis" },
    { hand: "one line per observation", indent: 1, at: "each observation" },
    { sketch: "parcoords", at: "Parallel coordinates", phases: ["Lines that cross", "Lines that run parallel"] }] },
  { say: "Lines that cross between two axes show a negative relationship. Lines that run parallel show a positive one.", board: [
    { hand: "crossing: negative", at: "Lines that cross" }, { hand: "parallel: positive", at: "Lines that run parallel" }] },
  { say: "A radar chart is parallel coordinates wrapped into a circle, and its shape depends on the order of the axes.", board: [
    { page: true }, { hand: "More charts for many variables", big: true, color: "red" },
    { hand: "radar: its shape depends", at: "A radar chart" }, { hand: "on the axis order", indent: 1, at: "depends on the order" },
    { sketch: "fourCharts", at: "A radar chart", phases: ["depends on the order", "A heat map", "A treemap", "Chernoff faces"] }] },
  { say: "A heat map is a grid of cells, each colored by its value.", board: [
    { hand: "heat map: a grid of cells", at: "A heat map" }, { hand: "colored by value", indent: 1, at: "colored by its value" }] },
  { say: "A treemap nests rectangles sized by value, for parts of a whole with a hierarchy.", board: [
    { hand: "treemap: nested rectangles", at: "A treemap" }, { hand: "parts of a whole", indent: 1, at: "for parts of a whole" }] },
  { say: "And Chernoff faces turn variables into the features of a face: memorable, but hard to read precisely.", board: [
    { hand: "Chernoff faces: memorable,", at: "Chernoff faces" }, { hand: "hard to read precisely", indent: 1, at: "hard to read" }] },
] },

{ id: "dataright", segs: [
  { say: "An A I describes the chart it is shown. It rarely asks whether the data could be right. That part is yours.", board: [
    { hand: "Is the data right?", big: true, color: "red" },
    { hand: "the AI describes the chart;", at: "describes the chart" }, { hand: "the check is yours", indent: 1, at: "That part is yours" }] },
  { say: "Ask two questions. First, does the pattern follow the business, or the reporting schedule?", board: [
    { gap: true }, { hand: "1. the business, or the", color: "blue", at: "First" }, { hand: "reporting schedule?", indent: 1, color: "blue", at: "the reporting schedule" }] },
  { say: "Ohio's COVID line rose and fell every week because counties reported on fixed days, not because the virus did.", board: [
    { hand: "Ohio COVID: a weekly comb", at: "Ohio's COVID" }, { hand: "from reporting days", indent: 1, at: "reported on fixed days" },
    { sketch: "comb", at: "Ohio's COVID", phases: ["reported on fixed days"] }] },
  { say: "Second, what is one row, and could something be counted twice?", board: [
    { page: true }, { hand: "2. What is one row?", big: true, color: "red" }, { hand: "counted twice?", at: "counted twice" }] },
  { say: "In a course file, Tableau's sum added a campus's enrollment once for every section listed. In the crash file, one row is one person, not one crash.", board: [
    { hand: "course file: SUM added the", at: "In a course file" }, { hand: "enrollment once per row", indent: 1, at: "once for every section" },
    { hand: "crash file: a row = a person", at: "In the crash file" }, { hand: "not a crash", indent: 1, at: "not one crash" },
    { sketch: "crashRows", at: "In the crash file", phases: ["not one crash"] }] },
  { say: "When a pattern looks too sudden, too regular or too big, ask how the data were collected before you trust the story.", board: [
    { gap: true }, { hand: "too sudden, regular or big?", color: "red", at: "too sudden" }, { hand: "ask how it was collected", indent: 1, color: "red", at: "ask how" }] },
] },

{ id: "build", segs: [
  { say: "In Tableau or Power B I, start by asking what one row of the file is.", board: [
    { hand: "Before you drag anything", big: true, color: "red" },
    { hand: "what is one row of the file?", at: "what one row" }] },
  { say: "Tableau sums a measure by default. That is right for sales, and wrong for a value that repeats on every row, like a campus's enrollment listed on every course section: take it once, with the maximum or the average.", board: [
    { hand: "Tableau sums by default", at: "Tableau sums" },
    { hand: "repeated value?", color: "blue", at: "wrong for a value" }, { hand: "take it once: MAX or AVG", indent: 1, color: "blue", at: "take it once" },
    { sketch: "sumTrap", at: "Tableau sums", phases: ["wrong for a value", "take it once"] }] },
  { say: "To count records, count rows, or count distinct IDs when a record can appear more than once.", board: [
    { hand: "count rows, or count", at: "To count records" }, { hand: "distinct IDs", indent: 1, at: "count distinct IDs" }] },
  { say: "Then make the chart answer the question, and finish it with the design checklist.", board: [
    { page: true }, { hand: "The design checklist", big: true, color: "red" },
    { hand: "answer the question", at: "answer the question" },
    { sketch: "checklist", at: "Then make the chart", phases: ["A title", "Labeled axes", "Bars that start", "Color only", "no chart junk"] }] },
  { say: "A title that says what the chart shows. Labeled axes with units. Bars that start at zero and are sorted. Color only when it carries a variable. And no chart junk.", board: [
    { hand: "a title: what it shows", at: "A title" }, { hand: "labeled axes, with units", at: "Labeled axes" },
    { hand: "bars from zero, sorted", at: "Bars that start" }, { hand: "color only for a variable", at: "Color only" },
    { hand: "no chart junk", at: "no chart junk" }] },
  { say: "Last, give every number a sanity check: could it be true? In Map Gallery, maps that added up the running totals gave Butler County more than seven million cases, in a county of fewer than four hundred thousand people.", board: [
    { page: true }, { hand: "Sanity check", big: true, color: "red" },
    { hand: "could this number be true?", at: "could it be true" },
    { hand: "Map Gallery: running totals", at: "In Map Gallery" }, { hand: "added up: 7 million+ cases", indent: 1, at: "more than seven million" },
    { hand: "in a county of < 400,000", indent: 1, at: "fewer than four hundred thousand" },
    { sketch: "sanityBars", at: "In Map Gallery", phases: ["fewer than four hundred thousand"] }] },
  { say: "Save a packaged Tableau workbook, or a Power B I file, so the data travel with it.", board: [
    { gap: true }, { hand: ".twbx or .pbix, so the", color: "blue", at: "Save a packaged" }, { hand: "data travel with it", indent: 1, color: "blue", at: "data travel" }] },
] },
];
