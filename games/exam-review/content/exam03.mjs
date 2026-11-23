// Content of the Quiz 03 review (Classes 25 and 26), split by build.mjs into units_exam03.json.
// Design: docs/superpowers/specs/2026-11-18-quiz03-review-design.md; plan:
// docs/superpowers/plans/2026-11-18-quiz03-review.md.
// Five units, each with a written recap and a picture, Jev-checked writing, and multiple-choice questions whose
// answer and why show after Check. Unit 4 runs R in the browser (webR, arules) on R's Groceries data.
// The four "reward" questions (marked REWARD) follow the moves of Quiz 03's Q5 to Q8 on Groceries instead of Job
// Scout, so students who practice recognize them. Nothing here comes from the old Exam 03 (old exams stay private).
// Every number is from Groceries in arules 1.7.14 (9,835 baskets, 169 items) or from the pictures' own R script.
// R style: pkg::fun(), no installs or loads, the native pipe; never base length() on transactions (it returns 1).

const deck = (n, file, label) => ({ label: label || `Class ${n} slides`, url: `https://fmegahed.github.io/isa401/fall2026/class${n}/${file}.html` });
const D25 = deck("25", "25_data_mining_overview");
const D26 = { label: "Clustering slides (Spring 2026)", url: "https://fmegahed.github.io/isa401/spring2026/class22/22_clustering_intro.html" };
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
const escHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const code = (s) => `<pre class="rcode">${escHtml(s.trim())}</pre>`;
const out = (s) => `<pre class="rcode" style="font-size:12.5px;">${escHtml(s.trim())}</pre>`;
const pic = (file, alt, caption, width = 760) => `<figure style="margin:12px 0 4px 0;"><img src="exam03/img/${file}" alt="${alt}" style="display:block; width:100%; max-width:${width}px; border:1px solid #e5e7eb; border-radius:8px;">${caption ? `<figcaption style="font-size:13px; color:#585E60; margin-top:4px;">${caption}</figcaption>` : ""}</figure>`;
const dot = (on) => (on ? "&#9679;" : `<span style="color:#cbd5e1;">&#9675;</span>`);
const grid = (items, baskets) => `<table style="border-collapse:collapse; margin:8px 0; font-size:15px;"><tr><th></th>${items.map((i) => `<th style="padding:2px 12px;">${i}</th>`).join("")}</tr>${
  baskets.map((b, k) => `<tr><td style="padding:2px 10px 2px 0; font-weight:600;">B${k + 1}</td>${items.map((i) => `<td style="text-align:center; padding:2px 12px;">${dot(b.includes(i))}</td>`).join("")}</tr>`).join("")}</table>`;

// the small grid for unit 3: {bread, milk} is the only pair in 3 baskets
const GRID_ITEMS = ["bread", "milk", "eggs", "butter"];
const GRID = [["bread", "milk", "eggs"], ["bread", "butter"], ["milk", "eggs"], ["bread", "milk", "butter"], ["eggs", "butter"], ["bread", "milk"]];
const pairCount = (a, b) => GRID.filter((x) => x.includes(a) && x.includes(b)).length;
if (pairCount("bread", "milk") !== 3 || pairCount("milk", "eggs") !== 2 || pairCount("bread", "butter") !== 2 || pairCount("eggs", "butter") !== 1) throw new Error("unit 3 grid counts changed");

// real arules output (arules 1.7.14, options(width = 110))
const OUT_COUNT = `> arules::sort(grocery_rules, by = 'count', decreasing = TRUE)[1:3] |> arules::inspect()
    lhs                                       rhs          support    confidence coverage   lift     count
[1] {other vegetables, yogurt}             => {whole milk} 0.02226741 0.5128806  0.04341637 2.007235 219
[2] {tropical fruit, yogurt}               => {whole milk} 0.01514997 0.5173611  0.02928317 2.024770 149
[3] {other vegetables, whipped/sour cream} => {whole milk} 0.01464159 0.5070423  0.02887646 1.984385 144`;
const OUT_RULE = `    lhs                          rhs          support    confidence coverage   lift     count
[1] {root vegetables, yogurt} => {whole milk} 0.01453991 0.5629921  0.02582613 2.203354 143`;

export default [

// ================================================================================================
{
  id: "dm-limits", title: "Data Mining and Its Limits", classes: "Class 25",
  blurb: "What counts as a pattern, descriptive vs. predictive models, and why looking in enough places always finds something.",
  tags: ["data_mining", "predictive_modeling", "hypothesis_testing"],
  links: { slides: [D25], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Data mining</b> is finding patterns in data that are <b>valid</b> (they hold on new data), <b>useful</b> (you can act on them), <b>unexpected</b> (not already obvious) and <b>understandable</b> (people can read them).</li>
<li><b>Descriptive or predictive?</b> Ask one question: is there a column you are trying to predict? No outcome column: descriptive (association rules, clustering). An outcome column: predictive (regression for a number, classification for a category).</li>
<li><b>Bonferroni's principle.</b> Look in enough places and you will find something, even in pure noise. Test 20 things at the 5% level and about one will "work" by chance.</li>
<li><b>Rhine's paradox.</b> Guessing all 10 red/blue cards right happens with probability 1/2<sup>10</sup> = 1/1,024. Test about 1,000 people and about one "psychic" appears. Retest with new cards and they score about 5 of 10, like everyone else. Our ESP Test did the same thing on purpose.</li>
</ul>
${pic("luck.png", "Bar chart of how many of 2,000 pure guessers called 0 to 10 of 10 cards right: most called 4 to 6; 18 called 9; 2 called all 10.", "One simulated run: 2,000 people guessing, nobody with ESP. Two of them still called all 10.")}` },

    { type: "choice", id: "x3-type-patients", title: "Patients with similar symptoms",
      prompt: "A hospital has symptom records for 50,000 patients but no diagnosis column. It wants to find groups of patients whose symptoms look alike. What kind of data mining is this?",
      options: ["Descriptive: there is no column to predict", "Predictive: it predicts each patient's diagnosis", "Predictive: it predicts which group a patient belongs to", "Neither: data mining needs an outcome column"],
      answer: 0,
      why: "There is no outcome column, so this is descriptive data mining (clustering). Predicting needs a column to predict, such as a diagnosis that is already recorded for past patients." },

    { type: "choice", id: "x3-type-loans", title: "Loans that default",
      prompt: "A bank has 200,000 past loans, each marked <i>defaulted</i> or <i>repaid</i>. It wants to flag new applications that look likely to default. What kind of data mining is this?",
      options: ["Predictive: classification, since the outcome is a category", "Predictive: regression, since the outcome is a category", "Descriptive: association rules", "Descriptive: clustering"],
      answer: 0,
      why: "The defaulted/repaid column is the outcome, so this is predictive. The outcome is a category, so it is classification. Regression predicts a number, such as the amount still owed." },

    { type: "choice", id: "x3-luck", title: "How many 'psychics' by luck?",
      prompt: "A lab asks 8,000 people to call 10 hidden cards, red or blue. Nobody has ESP. About how many will call all 10 right by luck alone?",
      options: ["about 0.8", "about 8", "about 80", "about 800", "none: 10 in a row by chance is impossible"],
      answer: 1,
      why: "8,000 &times; 0.5<sup>10</sup> = 8,000 / 1,024 &asymp; 7.8, so about 8. The chart above shows the same thing with 2,000 people: about 2. Look at enough people and someone gets lucky." },

    { type: "explain", id: "x3-bonferroni", title: "Forty subject lines",
      prompt: "A marketing team tests 40 different email subject lines, each against the usual one, and reports the one that raised clicks \"significantly\" (at the 5% level). Use Bonferroni's principle to explain why this result may not be a real finding, and what the team should do before acting on it.",
      ideas: [
        idea("Many tests make a chance winner likely", "At 5% each, how many of 40 would 'win' with no real effect at all?", "testing many subject lines makes it likely that at least one looks significant by chance alone (for example, about 2 of 40 at the 5% level)"),
        idea("Check it again on new data", "What did the lab do with its psychics, and what happened?", "the team should test the winning subject line again on new data (a new sample, a holdout or a follow-up test) before acting on it"),
      ],
      wrong: [wrong("a result that is significant at the 5% level is proven to be real", "At 5% per test, chance alone produces a 'significant' result about once in every 20 tries.")],
      tests: [
        t("With 40 tests at 5%, about 2 would look significant just by luck, so one winner proves nothing. They should run the winning subject line again on a new group of emails and see if it still wins.", [1, 1], false, "full"),
        t("They looked in 40 places, so finding something is expected even with no real effect. Retest the winner on fresh data first.", [1, 1], false, "full reworded"),
        t("Since they tried so many subject lines, one of them was bound to come out significant by chance.", [1, 0], false, "partial"),
        t("Before acting they should repeat the experiment with new customers to see if it holds.", [0, 1], false, "partial"),
        t("It was significant at 5%, so it is definitely a real effect and they should use it right away.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "dm-process", title: "The Data Mining Process: CRISP-DM", classes: "Class 25",
  blurb: "The six steps, why most of the time goes to the first three, and why fitting the model is the easy part.",
  tags: ["data_mining", "project_management", "business_acumen"],
  links: { slides: [D25], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>CRISP-DM</b> (CRoss-Industry Standard Process for Data Mining) has six steps: business understanding, data understanding, data preparation, modeling, evaluation, deployment.</li>
<li><b>It is a cycle, not a line.</b> The arrows go back: modeling often sends you back to data preparation, and evaluation can send you back to business understanding.</li>
<li><b>Most of the time goes to steps 1 to 3.</b> Understanding the client's real goal, understanding the data, and getting it in shape: Phases I and II of this course. Step 1 was Flight Plan's lesson: solve the problem the client actually has.</li>
<li><b>Data mining is hard</b> because of scale, many columns (Job Scout alone has 139 skills), mixed data, poor data quality, data spread across owners, and privacy. Fitting the model is the easy part once the data is understood and in shape.</li>
</ul>
${pic("crisp_dm.jpg", "The CRISP-DM cycle: business understanding, data understanding, data preparation, modeling, evaluation and deployment around the data, with arrows going back between steps.", 'The CRISP-DM process. Diagram by Kenneth Jensen, <a href="https://commons.wikimedia.org/wiki/File:CRISP-DM_Process_Diagram.png" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>.', 460)}` },

    { type: "choice", id: "x3-crisp-before", title: "Right before modeling",
      prompt: "In CRISP-DM, which step comes right before modeling?",
      options: ["business understanding", "data understanding", "data preparation", "evaluation", "deployment"],
      answer: 2,
      why: "The order is business understanding, data understanding, data preparation, then modeling. Data preparation (cleaning, joining, reshaping) gets the data into the shape the model needs." },

    { type: "choice", id: "x3-crisp-loop", title: "The model misses the goal",
      prompt: "A team's model scores well on accuracy, but in the evaluation step the client says it does not answer the question the business needed. Where does CRISP-DM send the team?",
      options: ["Back to business understanding", "On to deployment, since the accuracy is good", "Back to modeling, to try a bigger model", "Nowhere: the process ends after evaluation"],
      answer: 0,
      why: "CRISP-DM is a cycle. A model that misses the business goal sends you back to step 1: understand the real question first." },

    { type: "explain", id: "x3-crisp-skip", title: "\"Let's skip to the model\"",
      prompt: "Your manager says: \"Let's skip ahead and start modeling the job postings today. The model is where the value is.\" Using CRISP-DM, explain where most of the time in a data mining project goes, and why skipping ahead is risky.",
      ideas: [
        idea("Most time goes to steps 1 to 3", "Which three steps come before modeling?", "most of a data mining project's time goes to business understanding, data understanding and data preparation (the steps before modeling)"),
        idea("Skipping risks the wrong question or bad data", "What could go wrong if nobody checked the goal or the data first?", "skipping those steps risks answering the wrong question or building the model on data that is messy, misunderstood or wrong"),
      ],
      wrong: [wrong("most of the time in a data mining project goes to modeling", "On the slides, fitting the model was the easy part.")],
      tests: [
        t("Most of the time goes into the first three steps: understanding the business goal, understanding the data, and preparing it. If we jump to the model we might answer the wrong question or train it on dirty data.", [1, 1], false, "full"),
        t("CRISP-DM says the bulk of the work is business understanding, data understanding and data prep. Skip them and the model can be built on bad data or aimed at the wrong goal.", [1, 1], false, "full reworded"),
        t("Most of the effort is spent before modeling, on understanding the problem and cleaning the data.", [1, 0], false, "partial"),
        t("If we skip ahead, the model could be solving a problem the client does not have.", [0, 1], false, "partial"),
        t("He is right, modeling is where most of the time goes, the other steps are quick.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "dm-itemsets", title: "Frequent Itemsets and A-Priori", classes: "Class 25",
  blurb: "Support, frequent itemsets, and the monotonicity idea that lets A-Priori skip most of the counting.",
  tags: ["data_mining", "data_analysis", "r"],
  links: { slides: [D25], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Baskets and items.</b> A basket is one trip to the store (or one job posting); its items are what it holds (or the skills it asks for).</li>
<li><b>Support</b> of an itemset is how many baskets hold the whole set. It can be a count (2 baskets) or a share (2 of 5 = 0.4); R's arules reports the share.</li>
<li><b>Frequent itemset:</b> support at or above a threshold <i>s</i> that you choose.</li>
<li><b>Monotonicity.</b> A set can appear in no more baskets than each of its parts. So if an item fails the threshold, every set that holds it fails too, and A-Priori never counts those sets. Pass 1 counts single items; pass 2 counts only pairs of frequent items.</li>
</ul>
${pic("pictures.png", "Five panels from the Class 25 slides: baskets, the basket grid, support as a count of rows, confidence and lift on the grid, and A-Priori skipping every set with Pepsi.", "The whole method in five pictures (Class 25).")}
${pic("lattice.png", "The A-Priori lattice from class after three passes at s = 3: Pepsi is crossed out after pass 1, the pairs with Pepsi are never counted, 11 of 31 itemsets are counted and 7 are frequent.", "A-Priori on the class activity's 8 baskets: it counts 11 of the 31 itemsets and finds the same 7 frequent ones that counting all 31 finds. Every larger set with Pepsi was skipped.")}` },

    { type: "choice", id: "x3-grid", title: "Count the pairs",
      prompt: `Six baskets and four items; a filled dot means the basket holds the item. With a support threshold of 3 baskets, which of these pairs is frequent?${grid(GRID_ITEMS, GRID)}`,
      options: ["{bread, milk}", "{milk, eggs}", "{bread, butter}", "{eggs, butter}", "none of these pairs"],
      answer: 0,
      why: "{bread, milk} is in B1, B4 and B6: 3 baskets. {milk, eggs} and {bread, butter} are in 2 each, and {eggs, butter} in 1. Count the rows that have <i>both</i> dots." },

    // REWARD (quiz Q5 on Groceries)
    { type: "choice", id: "x3-mayo", title: "Groceries: an item that fails pass 1",
      prompt: "We run A-Priori on R's Groceries data (9,835 baskets) with <code>support = 0.01</code>, so an itemset needs at least 99 baskets. In pass 1, {mayonnaise} appears in 90 baskets. In pass 2, what happens to the pairs that contain mayonnaise?",
      options: ["A-Priori never counts them", "A-Priori counts them, since pass 2 counts every pair of items", "A-Priori counts only those whose other item also appears in fewer than 99 baskets", "A-Priori counts them, and keeps those that appear in at least 90 baskets", "A-Priori counts only those with a confidence of at least 0.5"],
      answer: 0,
      why: "Monotonicity: a pair with mayonnaise can appear in at most 90 baskets, below 99, so it can never be frequent. A-Priori skips it without counting, and the same goes for pairs with any other item below 99. Confidence plays no part in counting itemsets. (If you run it, the log says \"Absolute minimum support count: 98\": 0.01 &times; 9,835 = 98.35, so an itemset still needs 99 baskets.)" },

    { type: "explain", id: "x3-monotonicity", title: "Why skip the pair?",
      prompt: "Explain in your own words why A-Priori never counts a pair that contains an item that failed the support threshold in pass 1.",
      ideas: [
        idea("A pair is in no more baskets than each of its items", "Can {A, B} show up in a basket that does not hold A?", "a pair (or any larger set) appears in no more baskets than each of the items in it"),
        idea("So the pair cannot reach the threshold", "If the item is below s, where does that leave the pair?", "since the item is below the threshold, any pair holding it is also below the threshold, so counting it would be wasted work"),
      ],
      wrong: [wrong("A-Priori skips the pair because its confidence or lift is too low", "A-Priori counts itemsets by support; confidence and lift come later, for rules.")],
      tests: [
        t("Every basket that has the pair also has the item, so the pair can't appear more often than the item. If the item is already below the threshold, the pair must be too, so there is no point counting it.", [1, 1], false, "full"),
        t("A set can't be more common than any of its parts. The item failed s, so any pair with it fails s as well and A-Priori saves the work.", [1, 1], false, "full reworded"),
        t("A pair can only be in a basket if both of its items are there, so the pair is in no more baskets than the item.", [1, 0], false, "partial"),
        t("Because the item already failed, the pair can't pass the support threshold either.", [0, 1], false, "partial"),
        t("It skips the pair because the confidence of the rule would be too low to matter.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "dm-rules", title: "Association Rules in R", classes: "Class 25",
  blurb: "Confidence and lift in plain words, reading arules output, and mining rules from R's Groceries data in your browser.",
  tags: ["r", "data_mining", "data_analysis"],
  links: { slides: [D25], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>A rule I &rarr; j:</b> people who buy everything in I often buy j too.</li>
<li><b>Confidence:</b> of the baskets that hold I, the share that also hold j. It is the conditional probability P(j | I).</li>
<li><b>Lift:</b> how many times more likely j is in a basket with I than in any basket: confidence / P(j). A lift of 1 means I tells you nothing about j; below 1, j is <i>less</i> likely with I. High confidence alone is not a finding when j is in most baskets anyway.</li>
<li><b>Reading <code>arules::inspect()</code>:</b> <code>support</code> is the share of baskets with every item in the rule; <code>confidence</code> as above; <code>coverage</code> is the share of baskets with the left side; <code>count</code> is the number of baskets with <i>every</i> item, left and right.</li>
</ul>
${pic("lift.png", "Bar chart of the share of baskets with whole milk: 25.6% of all baskets (the baseline), 25.4% of baskets with bottled beer (lift 0.99, about the same as chance), and 57.4% of baskets with butter and other vegetables (lift 2.24, more than twice as likely).", "Lift in one picture: compare the share in these baskets with the share in all baskets.")}
<p>The class code, on R's Groceries data (one month of a grocery store, 9,835 baskets, 169 items). Nothing is loaded: every call names its package.</p>
${code(`
data('Groceries', package = 'arules')

arules::summary(Groceries)
arules::itemFrequency(Groceries) |> sort(decreasing = TRUE) |> head(10)

grocery_rules = arules::apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 0.5, minlen = 2)  )

arules::summary(grocery_rules)
arules::sort(grocery_rules, by = 'count', decreasing = TRUE)[1:3] |> arules::inspect()
`)}` },

    // REWARD (quiz Q6 on Groceries)
    { type: "code", id: "x3-r-support", title: "Groceries: one item's support", packages: ["arules"], tags: ["r", "data_analysis"],
      task: "This code should put the support of {yogurt} in <code>yogurt_support</code> and the rank of {tropical fruit} among the 169 items (1 = most common) in <code>tropical_rank</code>. Both come out wrong. Fix the two problems.",
      starter: `data('Groceries', package = 'arules')

item_freq = arules::itemFrequency(Groceries)   # the support of every item, in the data's own order (not sorted)
item_freq |> sort(decreasing = TRUE) |> head(10)

yogurt_support = item_freq['Yogurt']
yogurt_support

tropical_rank = which(names(sort(item_freq)) == 'tropical fruit')
tropical_rank
`,
      check: `abs(as.numeric(yogurt_support) - 0.1395) < 0.0005 && as.integer(tropical_rank) == 8L`,
      hint: "Look at the item names in the top-10 output: are they capitalized? And which way does <code>sort()</code> order values unless you tell it otherwise?",
      solution: `data('Groceries', package = 'arules')

item_freq = arules::itemFrequency(Groceries)   # the support of every item, in the data's own order (not sorted)
item_freq |> sort(decreasing = TRUE) |> head(10)

yogurt_support = item_freq['yogurt']
yogurt_support

tropical_rank = which(names(sort(item_freq, decreasing = TRUE)) == 'tropical fruit')
tropical_rank
`,
      okMsg: "Yogurt is in 13.95% of the baskets, and tropical fruit is the 8th most common item." },

    { type: "code", id: "x3-r-rules", title: "Groceries: mine the rules", packages: ["arules"], tags: ["r", "data_mining"],
      task: "Mine the Groceries rules with a minimum support of 0.01 and a minimum confidence of 50%, then keep the three rules found in the most baskets (the highest count) in <code>top3</code>. Run it first and read the error.",
      starter: `data('Groceries', package = 'arules')

grocery_rules = arules::apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 50, minlen = 2)  )

arules::summary(grocery_rules)

top3 = arules::sort(grocery_rules, by = 'count', decreasing = TRUE)[1:3]
arules::inspect(top3)
`,
      check: `nrow(arules::quality(grocery_rules)) == 15L && nrow(arules::quality(top3)) == 3L && arules::quality(top3)$count[1] == 219L`,
      hint: "The error says confidence is not in [0,1]. Confidence is a share, like support: 50% is written as 0.5.",
      solution: `data('Groceries', package = 'arules')

grocery_rules = arules::apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 0.5, minlen = 2)  )

arules::summary(grocery_rules)

top3 = arules::sort(grocery_rules, by = 'count', decreasing = TRUE)[1:3]
arules::inspect(top3)
`,
      okMsg: "15 rules. The one found in the most baskets, {other vegetables, yogurt} &rarr; {whole milk}, holds all three items in 219 baskets." },

    // REWARD (quiz Q8 on Groceries)
    { type: "choice", id: "x3-count", title: "Groceries: what does count tell you?",
      prompt: `The three Groceries rules with the highest count (support 0.01, confidence 0.5):${out(OUT_COUNT)}True or false: from this output, {other vegetables, yogurt} appears in <b>exactly 219</b> baskets.`,
      options: ["True", "False"],
      answer: 1,
      why: "False. 219 counts the baskets that hold <i>all three</i> items, {other vegetables, yogurt, whole milk}. So {other vegetables, yogurt} appears in at least 219 baskets. The coverage column gives the exact number: 0.04341637 &times; 9,835 = 427 baskets (or count / confidence = 219 / 0.5129)." },

    // REWARD (quiz Q7 on Groceries)
    { type: "choice", id: "x3-soda", title: "Groceries: confidence vs. lift",
      prompt: "In Groceries, the rule {soda} &rarr; {whole milk} has confidence 0.230 and lift 0.899. Across all 9,835 baskets, 25.6% have whole milk. Which statement is correct?",
      options: ["Baskets with soda are slightly less likely than the average basket to have whole milk.",
                "Baskets with soda usually have whole milk, so this rule is a strong finding.",
                "23% of all baskets have both soda and whole milk.",
                "Of the baskets with whole milk, 23% also have soda.",
                "A lift of 0.899 means 89.9% of soda baskets have whole milk."],
      answer: 0,
      why: "Lift below 1: soda baskets have whole milk 23.0% of the time, a bit less than the 25.6% of all baskets. The other choices mix up the measures: 23% is not most baskets; the share of all baskets with both is the support (4.0%); 23% is a share of the soda baskets, not of the whole-milk baskets (of those, 15.7% have soda); and lift is a ratio, not a percentage." },

    { type: "interpret", id: "x3-read-rule", title: "Say the rule in words",
      prompt: "Here is one Groceries rule. In plain words, say what its confidence and its lift tell a store manager.",
      show: { kind: "output", text: OUT_RULE },
      ideas: [
        idea("Confidence: 56% of baskets with both also have milk", "Start from the baskets that hold root vegetables and yogurt.", "of the baskets that have both root vegetables and yogurt, about 56% also have whole milk (confidence 0.563)"),
        idea("Lift: about 2.2 times as likely as an average basket", "Compare those baskets with all baskets.", "baskets with root vegetables and yogurt are about 2.2 times as likely (more than twice as likely) to have whole milk as an average basket (lift 2.2)"),
      ],
      wrong: [wrong("56% of all baskets contain root vegetables, yogurt and whole milk", "56% is a share of the baskets that already hold root vegetables and yogurt, not of all baskets (that share is the support, 1.5%).")],
      tests: [
        t("When a basket has root vegetables and yogurt, about 56% of the time it also has whole milk. And those baskets are about 2.2 times more likely to have whole milk than a typical basket.", [1, 1], false, "full"),
        t("Confidence 0.56: more than half of the root veg + yogurt baskets include whole milk. Lift 2.2: that is over twice the usual rate for milk.", [1, 1], false, "full reworded"),
        t("Of the baskets with root vegetables and yogurt, 56% also contain whole milk.", [1, 0], false, "partial"),
        t("The lift of 2.2 means whole milk is about twice as likely in these baskets as in baskets overall.", [0, 1], false, "partial"),
        t("56% of all the baskets in the store have root vegetables, yogurt and whole milk together.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "dm-clustering", title: "Clustering and k-means", classes: "Class 26",
  blurb: "Grouping records with no outcome column, the k-means steps, and the practical issues: scaling, choosing k, and k-means in Tableau.",
  tags: ["clustering", "machine_learning", "tableau"],
  links: { slides: [D26], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Clustering</b> puts records into groups so that records in a group are alike and records in different groups are not. There is no outcome column: it is descriptive data mining.</li>
<li><b>k-means, step by step.</b> Step 0: pick <i>k</i> starting centers (often <i>k</i> random records). Step 1: each record joins its nearest center. Step 2: each center moves to the mean of its group. Repeat steps 1 and 2 until the centers stop moving.</li>
<li><b>What k-means makes small:</b> the inertia, or within-cluster sum of squares: the sum of the squared distances from each record to its own center. Lower means tighter groups.</li>
<li><b>Practical issues.</b> Rescale numeric columns first (z-scores, 0 to 1, or per-person rates), or the column with the biggest numbers decides the distance. Use more than one measure to choose <i>k</i>. Then visualize the clusters and try to explain who ended up where.</li>
<li><b>k-means in Tableau.</b> Drag Cluster from the Analytics pane onto the view. Tableau runs k-means and colors each mark by its cluster.</li>
</ul>
${pic("kmeans.png", "Four panels of penguins plotted by rescaled bill length and flipper length: three starting centers, every penguin colored by its nearest center, the centers moving to their group means, and the final three groups once nothing moves.", "k-means on the Palmer penguins, drawn step by step.")}` },

    { type: "choice", id: "x3-scale", title: "Salary and experience",
      prompt: "You run k-means on job postings using two columns: salary in dollars (about 40,000 to 200,000) and years of experience required (0 to 15). You do not rescale. What happens?",
      options: ["Salary decides almost all of the distance, so the clusters mostly split postings by salary", "Experience decides the distance, since it is the smaller number", "Both columns count equally, since k-means looks at each column separately", "k-means stops with an error when columns are on different scales"],
      answer: 0,
      why: "Distances add up squared differences, and a 10,000-dollar gap swamps a 5-year gap. Rescale both columns (for example, z-scores) so each one counts." },

    { type: "choice", id: "x3-tableau-cluster", title: "Clustering in Tableau",
      prompt: "You have a Tableau scatter plot of penguins, bill length against flipper length. Where is Tableau's k-means clustering, and what does it do to the view?",
      options: ["In the Analytics pane: drag Cluster onto the view, and Tableau colors each mark by its cluster", "In the Data pane: Cluster is a ready-made field you drag to Rows", "In Show Me: Cluster is a chart type next to the scatter plot", "Nowhere: Tableau cannot cluster, so you run k-means in R and import the groups"],
      answer: 0,
      why: "Cluster sits in the Analytics pane, with Average Line, Trend Line and Forecast. Drop it on the view and Tableau runs k-means, then colors each mark by the cluster it joined." },

    { type: "explain", id: "x3-kmeans", title: "k-means in your own words",
      prompt: "Explain how the k-means algorithm groups records, step by step, and when it stops.",
      ideas: [
        idea("Start with k centers", "What does k-means need before the first round?", "k-means starts by choosing k starting centers (for example, k random records)"),
        idea("Each record joins its nearest center", "Which center does a record belong to?", "each record is assigned to its nearest (closest) center"),
        idea("Centers move to the mean; repeat until stable", "What happens to a center after its group is formed, and when does it end?", "each center moves to the mean (average) of its group, and the assign-and-move steps repeat until the centers stop moving or the groups stop changing"),
      ],
      wrong: [wrong("k-means needs an outcome column (labels) to learn the groups", "Clustering has no outcome column; the groups come from distances alone.")],
      tests: [
        t("You pick k starting centers, often k random points. Every point is assigned to the closest center. Then each center is moved to the average of the points assigned to it, and you repeat assign and move until the centers don't change.", [1, 1, 1], false, "full"),
        t("Choose k random records as centers, put each record with its nearest center, recompute every center as its group's mean, and keep going until nothing moves.", [1, 1, 1], false, "full reworded"),
        t("It begins with k centers and assigns each record to the nearest one.", [1, 1, 0], false, "partial"),
        t("Records go to the closest center.", [0, 1, 0], false, "partial"),
        t("k-means looks at the labels in the outcome column and learns which group each record belongs to.", [0, 0, 0], true, "wrong"),
      ] },
  ],
},
];
