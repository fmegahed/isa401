// Content of the Exam 01 review: ten units, authored here and split by build.mjs.
// R code follows the code written in class (github.com/fmegahed/isa401a/markdowns, plus the Class 13
// demo chunk in the deck): the same functions, spelling and layout, pkg::function() on every
// non-base call, and "../data/..." paths from a markdown saved in markdowns/. tests/check_coverage.py
// lists any function named here that was not written in class.
//
// A written question lists 2 or 3 ideas. For each idea Jev is asked one yes/no question about the
// student's answer; `wrong` lists known wrong claims that should send the student back.
// `tests` are sample answers with the verdict we expect: [1, 0] means idea 1 covered, idea 2 not.

import fs from "node:fs";
// real console output, written by make_outputs.R
const OUT = JSON.parse(fs.readFileSync(new URL("./outputs.json", import.meta.url), "utf8"));

// links shown at the top of a unit: the slide deck(s) and the code written in class (both sections)
const deck = (n, file, label) => ({ label: label || `Class ${n} slides`, url: `https://fmegahed.github.io/isa401/fall2026/class${n}/${file}.html` });
const classCode = (file, inB = true) => ({
  label: file,
  a: `https://github.com/fmegahed/isa401a/blob/main/markdowns/${file}`,
  b: inB ? `https://github.com/fmegahed/isa401b/blob/main/markdowns/${file}` : null,
});

const escHtml = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const code = (t) => `<pre class="rcode">${escHtml(t.trim())}</pre>`;
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

export default [

// ================================================================================================
{
  id: "data", title: "Data Types and R Vectors", classes: "Classes 01 and 03",
  blurb: "Structured, semi-structured and unstructured data, the unit of analysis, and how one vector holds one type.",
  tags: ["data_analysis", "r"],
  links: { slides: [deck("01", "01_introduction"), deck("03", "03_r_foundations")], code: [classCode("03_r_basics.Rmd")] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Three shapes of data.</b> Structured data sits in a table with fixed columns (a database row). Semi-structured data carries its own labels and can nest (JSON, HTML). Unstructured data has no fields at all (the text of a job description, an image).</li>
<li><b>Unit of analysis.</b> Before counting anything, say what one row is. In the Cincinnati crashes file one row is one <i>person</i> involved in a crash, so the number of rows is not the number of crashes.</li>
<li><b>One vector, one type.</b> The types are logical, integer, double and character. If one value is text, <code>c()</code> turns every value into text.</li>
<li><b>R works on whole vectors.</b> A comparison returns one <code>TRUE</code> or <code>FALSE</code> per value, and <code>sum()</code> of those counts the <code>TRUE</code>s.</li>
</ul>
${code(`
crashes_by_day = c(2020, 2241, 2327, 2285,
                   2380, 1866, 1664)
names(crashes_by_day) = c("Mon", "Tue", "Wed", "Thu",
                          "Fri", "Sat", "Sun")
typeof(crashes_by_day)            # "double"
crashes_by_day > 2000             # one TRUE or FALSE for each day
sum(crashes_by_day > 2000)        # 5
typeof(c(2020, "Mon"))            # "character"
`)}` },

    { type: "explain", id: "data-shapes", title: "One job ad, three shapes",
      prompt: "The same job ad reaches us three ways: the free text of its description, a JSON list of its skills, and a row in a database table. Say which one is structured, which is semi-structured and which is unstructured, and what makes each one so.",
      ideas: [
        idea("The database row is structured: fixed columns", "Which of the three already has a column for every value?", "the database row (the table) is structured data, because it has fixed columns or a fixed table layout"),
        idea("The JSON is semi-structured: labels, no fixed table", "JSON has keys and can nest. Is that a table?", "the JSON is semi-structured data, because it carries labels, keys or tags (or nesting) without being a fixed table"),
        idea("The description text is unstructured: no fields", "What does plain text lack that the other two have?", "the free-text description is unstructured data, because it has no fields, columns or labels"),
      ],
      wrong: [wrong("the JSON is structured data, or that the free text is semi-structured data", "Check which label you gave the JSON and the free text.")],
      tests: [
        t("The database row is structured because every value sits in a fixed column. The JSON skills list is semi-structured since it has keys and nesting but is not a table. The description is unstructured: it is just text with no fields.", [1, 1, 1], false, "full"),
        t("Table row = structured (set columns). JSON = semi structured, it labels its values with keys but isn't a fixed table. Free text = unstructured, nothing is labelled.", [1, 1, 1], false, "full reworded"),
        t("The row in the database is structured because it has columns that are always the same.", [1, 0, 0], false, "partial"),
        t("The description is unstructured because it is free text with no columns or labels.", [0, 0, 1], false, "partial"),
        t("The JSON is structured because it has names for everything, and the description text is semi-structured.", [0, 0, 0], true, "wrong labels"),
      ] },

    { type: "code", id: "data-vector", title: "A number typed as text", tags: ["r"],
      task: "One value in this vector was typed inside quotes. Fix the vector so it is stored as numbers, then make <code>days_over</code> hold the number of days with more than 2,000 crashes.",
      starter: `crashes_by_day = c(2020, 2241, "2327", 2285,
                   2380, 1866, 1664)
names(crashes_by_day) = c("Mon", "Tue", "Wed", "Thu",
                          "Fri", "Sat", "Sun")

typeof(crashes_by_day)
mean(crashes_by_day)

days_over = sum(crashes_by_day > 2000)
days_over
`,
      check: `is.double(crashes_by_day) && length(crashes_by_day) == 7 && sum(crashes_by_day) == 14783 && as.integer(days_over) == 5L`,
      hint: "Run <code>typeof(crashes_by_day)</code> first. One value in quotes turns the whole vector into character, which is why <code>mean()</code> returns <code>NA</code> with a warning.",
      solution: `crashes_by_day = c(2020, 2241, 2327, 2285,
                   2380, 1866, 1664)
names(crashes_by_day) = c("Mon", "Tue", "Wed", "Thu",
                          "Fri", "Sat", "Sun")

typeof(crashes_by_day)
mean(crashes_by_day)

days_over = sum(crashes_by_day > 2000)
days_over
`,
      okMsg: "The vector is double again, and five days are above 2,000." },
    { type: "interpret", id: "data-unit", title: "What is one row?",
      prompt: "A classmate looks at this output and writes: \"There were 1,000 crashes.\" Use the output to say what one row of this table is, and what is wrong with the sentence. <span style=\"color:#585E60;\">(The rows are a small made-up example in the shape of the Cincinnati crashes file.)</span>",
      show: { kind: "output", text: `> dplyr::glimpse(crashes)
Rows: 1,000
Columns: 5
$ instanceid    <chr> "A2026-0412", "A2026-0412", "A2026-0413", "A2026-0413", "A2026-0413", ...
$ crashdate     <dttm> 2026-08-21 07:40:00, 2026-08-21 07:40:00, 2026-08-21 09:05:00, ...
$ persontype    <chr> "D - DRIVER", "O - OCCUPANT", "D - DRIVER", "D - DRIVER", "P - PEDESTRIAN", ...
$ age           <chr> "34", "8", "51", "UNKNOWN", "27", ...
$ injuries      <chr> "5 - NO APPARENT INJURY", "5 - NO APPARENT INJURY", "2 - SUSPECTED SERIOUS", ...

> length(unique(crashes$instanceid))
[1] 431` },
      ideas: [
        idea("One row is one person involved in a crash", "Look at persontype, and at the first two rows.", "one row of the table is one person (a driver, occupant or pedestrian) involved in a crash, not one crash"),
        idea("Rows are not crashes: there are 431 crashes, not 1,000", "Which number in the output counts crashes?", "the number of crashes is smaller than the number of rows (431 distinct crashes, or that several rows share the same crash id), so 1,000 is the wrong count of crashes"),
      ],
      wrong: [wrong("each row of the table is one crash and the count of 1,000 crashes is correct", "Compare the first two rows: same instanceid, same time, different people.")],
      tests: [
        t("One row is one person in a crash (driver, occupant, pedestrian), not a crash. The same instanceid repeats, so there are only 431 crashes; 1,000 is the number of people.", [1, 1], false, "full"),
        t("Each row is a person involved. The classmate counted people. There are only 431 different crash ids.", [1, 1], false, "full reworded"),
        t("A row is one person who was in a crash.", [1, 0], false, "partial"),
        t("The count is wrong because there are 431 distinct instance ids, so only 431 crashes happened.", [0, 1], false, "partial"),
        t("Each row is one crash so the classmate is right, there were 1,000 crashes.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "git", title: "Git and GitHub", classes: "Class 02",
  blurb: "What a commit does, what a push does, and how to take back a mistake before and after it is pushed.",
  tags: ["version_control"],
  links: { slides: [deck("02", "02_git_foundations")], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Git</b> is the tool on your computer that records snapshots of a folder. <b>GitHub</b> is the website that hosts a copy.</li>
<li>A <b>commit</b> saves a snapshot <i>on your computer</i>. A <b>push</b> sends your commits to GitHub. Only push and pull touch the internet.</li>
<li>The class ritual: <b>knit, commit, push</b>, then open the repository on GitHub and check the file is there. "If it is not pushed, it is not done."</li>
<li>To take back a commit: <b>Undo</b> works before the push. After the push, use <b>Revert</b>, which adds a new commit that reverses the old one and keeps the history.</li>
<li>A script is reproducible where a spreadsheet is not: the steps are written down, run in order, and run again on new data.</li>
</ul>` },

    { type: "explain", id: "git-commit-push", title: "Committed, but not on GitHub",
      prompt: "You committed <code>class13.Rmd</code> in GitHub Desktop, but your partner cannot see it on github.com. Explain what the commit did, and what is still missing.",
      ideas: [
        idea("A commit saves a snapshot on your own computer", "Where does a commit live right after you make it?", "a commit saves or records the changes (a snapshot) locally, on the student's own computer or local repository"),
        idea("A push sends the commits to GitHub", "Which button talks to the internet?", "a push (Push origin) is needed to send or upload the commit to GitHub, and it has not been done yet"),
      ],
      wrong: [wrong("committing by itself uploads the file to GitHub", "A commit never touches the internet.")],
      tests: [
        t("The commit saved a snapshot of my changes in the repository on my computer. Nothing went to GitHub yet. I still need to click Push origin to send the commit to github.com.", [1, 1], false, "full"),
        t("Commit = recorded locally only. To get it online I have to push.", [1, 1], false, "full reworded"),
        t("I need to push it.", [0, 1], false, "partial"),
        t("The commit stored the change on my laptop.", [1, 0], false, "partial"),
        t("The commit uploads the file to GitHub, so GitHub must be slow or my partner needs to refresh.", [0, 0], true, "wrong"),
      ] },

    { type: "interpret", id: "git-revert", title: "Taking back a pushed commit",
      prompt: "You pushed the second commit below and then noticed it deleted a chunk your report needs. GitHub Desktop offers <b>Undo</b> and <b>Revert</b>. Which one applies here, and what does it do to the history?",
      show: { kind: "output", text: `History (newest first)
  a41c9e2  Remove old chunks          pushed 10:42
  7be0d15  Add class 13 markdown      pushed 10:15` },
      ideas: [
        idea("Revert, because the commit is already pushed", "Undo is only offered for a commit that has not left your computer.", "Revert is the one to use here, because the commit has already been pushed (Undo only works before a push)"),
        idea("Revert adds a new commit that reverses the old one", "Does the bad commit disappear from the history?", "Revert creates a new commit that reverses the changes of the earlier commit, and the earlier commit stays in the history"),
      ],
      wrong: [wrong("Undo is the right choice for a commit that has already been pushed", "Check when Undo is available.")],
      tests: [
        t("Revert. The commit was already pushed so Undo is not available. Revert makes a new commit that reverses a41c9e2, and both stay in the history.", [1, 1], false, "full"),
        t("Since it is pushed I have to revert it. That adds another commit undoing the change instead of erasing the old one.", [1, 1], false, "full reworded"),
        t("Use Revert because it has been pushed already.", [1, 0], false, "partial"),
        t("Use Undo, it removes the last commit even after pushing.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "import", title: "Importing Data", classes: "Classes 04 and 05",
  blurb: "Paths from a markdown, CSV, Excel and JSON files, and pulling one value out with [ ], [[ ]] and $.",
  tags: ["r", "etl", "excel"],
  links: { slides: [deck("04", "04_data_import_export"), deck("05", "05_data_import_apps")], code: [classCode("class04.Rmd"), classCode("class05.Rmd")] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Paths.</b> Your markdown is in <code>markdowns/</code> and files are in <code>data/</code>, so every local file is <code>"../data/SOMETHING"</code>. Knit starts from the markdown's folder; the Console starts from the project folder.</li>
<li><b>CSV:</b> <code>readr::read_csv()</code> reads a web address or a local file the same way.</li>
<li><b>Excel:</b> <code>readxl::read_excel()</code> needs a file on disk. Use <code>sheet</code> to pick the sheet and <code>skip</code> to pass over rows above the header.</li>
<li><b>JSON:</b> <code>jsonlite::fromJSON()</code> reads a web address or a file. Check the types: values often arrive as text.</li>
<li><b>Look before you use it:</b> run <code>dplyr::glimpse()</code> on anything you did not build yourself.</li>
<li><b>Subsetting:</b> <code>[ ]</code> keeps the container, <code>[[ ]]</code> and <code>$</code> open it.</li>
</ul>
${code(`
occupation = readxl::read_excel(
  path = "../data/occupation.xlsx", sheet = "Table 1.4", skip = 1
  )
dplyr::glimpse(occupation)
`)}` },

    { type: "explain", id: "import-path", title: "Why \"../data/\"?",
      prompt: "Your markdown is saved in <code>markdowns/</code> and the file is in <code>data/</code>. Explain what <code>\"../data/jobs.csv\"</code> tells R to do, and why that same line can work when you knit but fail when you run it in the Console.",
      ideas: [
        idea("\"..\" goes up one folder, then into data/", "Read the path piece by piece, starting from the markdown's folder.", "the two dots mean go up one folder (to the parent or project folder) from where the markdown is, and then into the data folder"),
        idea("Knit starts from the markdown's folder; the Console starts from the project folder", "Each one has its own starting folder.", "knitting runs from the folder of the markdown file while the Console runs from the project (root) folder, so the same relative path points to a different place"),
      ],
      wrong: [wrong("the fix is to call setwd() or to type the full absolute path starting with C:", "We never use setwd() or absolute paths in this course.")],
      tests: [
        t("The .. means go up one level out of markdowns to the project folder, then down into data. Knit starts in the markdowns folder so that works. The Console starts in the project folder, so going up one level leaves the project and the file is not found.", [1, 1], false, "full"),
        t("Go up a folder, then into data, and read jobs.csv there. It fails in the console because the console's working directory is the project root, not markdowns/, while knitr uses the Rmd's own folder.", [1, 1], false, "full reworded"),
        t("Two dots take you one folder up and then you go into the data folder.", [1, 0], false, "partial"),
        t("Just use setwd() to the data folder or write the full path from C: and it will always work.", [0, 0], true, "wrong"),
      ] },

    { type: "code", id: "import-excel", title: "An Excel sheet with a title row", packages: ["readxl", "dplyr"], files: ["postings_by_state.xlsx"], tags: ["excel", "etl", "r"],
      task: "Read the sheet <code>by_state</code> into <code>by_state</code>. The code has two problems: the path is wrong for a markdown saved in <code>markdowns/</code>, and the sheet has one title row above the column names. When it works, the columns are <code>state</code>, <code>postings</code> and <code>remote_share</code>.",
      starter: `by_state = readxl::read_excel(
  path = "data/postings_by_state.xlsx", sheet = "by_state"
  )

dplyr::glimpse(by_state)
`,
      check: `is.data.frame(by_state) && identical(names(by_state), c("state", "postings", "remote_share")) && is.numeric(by_state$postings) && nrow(by_state) == 11 && by_state$postings[1] == 272`,
      hint: "First fix the path so R finds the file. Then look at the column names in the <code>glimpse()</code>: the title became a column name. Which argument tells <code>read_excel()</code> to pass over rows above the header?",
      solution: `by_state = readxl::read_excel(
  path = "../data/postings_by_state.xlsx", sheet = "by_state", skip = 1
  )

dplyr::glimpse(by_state)
`,
      okMsg: "Eleven states, and postings is a number because the title row no longer sits in the column." },

    { type: "explain", id: "import-brackets", title: "[ ] or [[ ]]?",
      prompt: "For the list below, explain the difference between what <code>job[\"salary\"]</code> and <code>job[[\"salary\"]]</code> return, and which one you need before you can ask for <code>$max</code>.",
      show: { kind: "code", text: `job = list(
  title  = "Data Analyst",
  salary = list(min = 62000, max = 78000))` },
      ideas: [
        idea("[ ] keeps the container: a list with one element", "Think of the pepper shaker.", "single brackets return a list (a smaller list that still contains the salary element), that is, the container is kept"),
        idea("[[ ]] opens it: the element itself", "What do you get when you open the shaker?", "double brackets (or the dollar sign) return the element itself, here the inner salary list with min and max, not a list wrapped around it"),
        idea("You need [[ ]] (or $) before $max", "Which result has max directly inside it?", "to get max you must use double brackets or the dollar sign, as in job[[\"salary\"]]$max or job$salary$max"),
      ],
      wrong: [wrong("single brackets and double brackets return the same thing", "They do not. Check what each one returns.")],
      tests: [
        t("job[\"salary\"] gives back a list of length one that still has salary inside it. job[[\"salary\"]] gives the salary element itself, the inner list with min and max. So I need the double brackets (or job$salary) and then $max.", [1, 1, 1], false, "full"),
        t("Single brackets keep the container so you get a list. Double brackets open it and hand you what is inside. Use job[[\"salary\"]]$max.", [1, 1, 1], false, "full reworded"),
        t("Single brackets return a list.", [1, 0, 0], false, "partial"),
        t("They both return the salary, there is no difference between the two.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "interpret", id: "import-skip", title: "One giant column name",
      prompt: "This is what R printed for the Excel sheet from the last task when it was read without <code>skip</code>. What went wrong, and which argument fixes it?",
      show: { kind: "output", text: OUT.skip },
      ideas: [
        idea("The title row was read as the column names", "Look at the first column's name, and at row 1 of the data.", "the title line at the top of the sheet was treated as the column names (the header), so the real column names ended up in the first row of data"),
        idea("skip = 1 passes over the title row", "It is an argument of read_excel() that takes a number of rows.", "the fix is to use the skip argument of read_excel, for example skip = 1"),
      ],
      wrong: [],
      tests: [
        t("R used the sheet's title as the header, so the real column names (postings, remote_share) became the first row and everything is text. Adding skip = 1 skips the title row.", [1, 1], false, "full"),
        t("The first line of the sheet is a title, not the header. read_excel took it as the column name. Fix with skip = 1.", [1, 1], false, "full reworded"),
        t("You need to add skip = 1.", [0, 1], false, "partial"),
        t("The title got read in as the name of the column and the actual names are sitting in row one.", [1, 0], false, "partial"),
        t("The sheet name is wrong, change the sheet argument.", [0, 0], false, "off target"),
      ] },
  ],
},

// ================================================================================================
{
  id: "querychat", title: "The querychat App", classes: "Classes 06 and 07",
  blurb: "What the model sees, why you read the SQL it writes, what a data dictionary adds, and where the key lives.",
  tags: ["sql", "generative_ai"],
  links: { slides: [deck("06", "06_sqlite_deployed_app"), deck("07", "07_data_wrangling")], code: [classCode("class06.Rmd")] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Two actors.</b> The model writes SQL. The database runs it. The model receives your question and a description of the table (column names, types, ranges), never the rows.</li>
<li><b>Read the SQL.</b> The model has not seen the data and does not know the answer. The SQL is the part you can check, so read it before you trust the table.</li>
<li><b>Data dictionary.</b> The model sees names and types, not meanings. <code>data_desc.md</code> says what each column holds, and <code>extra_instructions.md</code> adds house rules such as "match states by their two-letter code".</li>
<li><b>The key.</b> <code>OPENAI_API_KEY</code> goes in <code>.Renviron</code>, which is git-ignored, and is read with <code>Sys.getenv()</code>. On Render the same name is set as an environment variable. A key in a commit is public within minutes.</li>
<li><b>Deploying.</b> A Dockerfile is a recipe for a computer; Render follows it. You do not run Docker yourself.</li>
</ul>
<p>You will not be asked to write SQL. You should be able to read a short query and say what it does.</p>` },

    { type: "explain", id: "qc-privacy", title: "Does the data go to OpenAI?",
      prompt: "A friend says: \"I would never use querychat at work. It sends our whole table to OpenAI.\" Explain what is sent to the model, what comes back, and where the data is queried.",
      ideas: [
        idea("Only the question and the table's structure are sent, not the rows", "What does the model need in order to write a query?", "the rows of data are not sent to the model; only structural information such as the column names and types (the schema) is sent"),
        idea("The model returns SQL, not the answer", "What does the model write?", "the model sends back a SQL query (code), not the numbers or the answer itself"),
        idea("The SQL runs on the database, where the data stays", "Who runs the query?", "the SQL query is run by the database (SQLite) locally or on the app's own server, where the data stays"),
      ],
      wrong: [wrong("the data is kept private because it is encrypted or anonymized before it is sent to the model, or that the model reads the rows of the table", "The protection is not encryption. Think about what is sent at all.")],
      tests: [
        t("That is not what happens. The model only gets my question and the schema: column names, types and ranges. It never gets the rows. It writes a SQL query and sends that back, and SQLite runs the query on our own server where the data lives.", [1, 1, 1], false, "full"),
        t("querychat shares structure only (names and types of columns), no actual records. The LLM answers with SQL. The database executes that SQL locally, so the table never leaves.", [1, 1, 1], false, "full reworded"),
        t("The model returns a SQL query rather than the result.", [0, 1, 0], false, "partial"),
        t("Only the column names and types go to OpenAI, not the data.", [1, 0, 0], false, "partial"),
        t("It is safe because the rows are encrypted before they are sent to OpenAI, and the model reads them and calculates the answer.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "interpret", id: "qc-sql", title: "Zero postings in Ohio?",
      prompt: "You asked the Job Scout app \"How many postings are in Ohio?\" and it answered 0. This is the SQL it wrote and one row of the table. Explain why the answer is 0, and what you would add to the app so it gets this right.",
      show: { kind: "plain", text: `SELECT COUNT(*) AS n
FROM scout_postings
WHERE location_state LIKE '%Ohio%';

-- one row of scout_postings
-- title: "Data Analyst"   location_city: "Columbus"   location_state: "OH"` },
      ideas: [
        idea("The column holds two-letter codes, so 'Ohio' matches nothing", "Compare the text in the WHERE line with the value in the row.", "the location_state column stores two-letter state codes such as OH, so searching for the word Ohio matches no rows"),
        idea("A data dictionary (or an instruction) tells the model how the column is coded", "The model sees column names and types. What does it not see?", "a data dictionary, column description or extra instruction should be added to tell the model that states are stored as two-letter codes"),
      ],
      wrong: [wrong("the result of 0 is correct and there really are no postings in Ohio", "Look at the example row again.")],
      tests: [
        t("The WHERE clause looks for the word Ohio, but location_state holds two letter codes like OH, so nothing matches and the count is 0. I would describe the column in the data dictionary (data_desc.md) or add a rule in extra_instructions.md saying to match states by their two letter code.", [1, 1], false, "full"),
        t("States are saved as abbreviations. LIKE '%Ohio%' can't find 'OH'. Fix: tell the model in the data description that the column uses two-letter codes.", [1, 1], false, "full reworded"),
        t("The column has OH not Ohio so the filter returns nothing.", [1, 0], false, "partial"),
        t("There are just no jobs in Ohio in the database, so 0 is right.", [0, 0], true, "wrong"),
      ] },

    { type: "explain", id: "qc-key", title: "Where the key lives",
      prompt: "Your app needs <code>OPENAI_API_KEY</code>. Explain where the key is kept on your own computer, where it is kept once the app runs on Render, and why it must never be in a file you commit.",
      ideas: [
        idea("Locally: in .Renviron, which is git-ignored", "Which file did usethis::edit_r_environ(\"project\") open?", "on the student's own computer the key is kept in the .Renviron file"),
        idea("On Render: as an environment variable on the server", "It is set in Render's dashboard, not in the repository.", "on Render the key is set as an environment variable on Render's server (in the service settings), not stored in the repository"),
        idea("A committed key is public and stays in the history", "What happens to anything pushed to a public repository?", "a key that is committed or pushed becomes public or exposed to other people, for example because the repository is public or the Git history keeps it"),
      ],
      wrong: [wrong("it is fine to paste the key directly into app.R or the markdown as long as the repository is deleted or the line is removed later", "Removing the line later does not remove it from the history.")],
      tests: [
        t("On my computer the key sits in .Renviron, which is listed in .gitignore, and the app reads it with Sys.getenv. On Render I add it as an environment variable in the service settings, so it lives on their server and not in my repo. If I commit it, it is public on GitHub within minutes and stays in the history even after I delete it, so I would have to revoke it.", [1, 1, 1], false, "full"),
        t("Local: .Renviron (ignored by git). Render: an environment variable set in the dashboard. Never commit it because pushed keys are public and the history keeps them.", [1, 1, 1], false, "full reworded"),
        t("I keep it in .Renviron and make sure git ignores that file.", [1, 0, 0], false, "partial"),
        t("Just paste the key in app.R so the app can find it, and remove the line before the semester ends.", [0, 0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "dplyr", title: "Wrangling with dplyr", classes: "Class 07",
  blurb: "select, filter, arrange, mutate, group_by with summarise, count, and left joins, chained with the pipe.",
  tags: ["data_wrangling", "r", "data_analysis"],
  links: { slides: [deck("07", "07_data_wrangling")], code: [classCode("class07.Rmd")] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><code>dplyr::select()</code> keeps columns, <code>dplyr::filter()</code> keeps rows, <code>dplyr::arrange()</code> sorts, <code>dplyr::mutate()</code> adds or changes a column.</li>
<li>In <code>filter()</code>, a test is written with <code>==</code>. A single <code>=</code> names an argument. Text goes in quotes; column names do not.</li>
<li><code>dplyr::group_by()</code> changes nothing you can see. <code>dplyr::summarise()</code> then returns one row per group, and <code>dplyr::n()</code> counts the rows in each group.</li>
<li><code>dplyr::count()</code> is the shortcut for <code>group_by()</code> followed by <code>n()</code>.</li>
<li><code>mutate()</code> never changes the number of rows. <code>summarise()</code> does.</li>
<li>A share based on very few rows says little. In class we kept only groups with enough postings before ranking them.</li>
<li><b>Joins.</b> <code>dplyr::left_join()</code> keeps every row of the left table and adds the right table's columns; where a row finds no partner, the new cells are <code>NA</code>. <code>dplyr::inner_join()</code> keeps matches only, and <code>dplyr::anti_join()</code> shows the left rows that found no partner. After any join that matters, run <code>anti_join()</code> once.</li>
</ul>
${code(`
jobs |>
  dplyr::filter(category == 'fulltime') |>
  dplyr::group_by(location_state) |>
    dplyr::summarise(
    postings = dplyr::n(), # counting the number of rows per state
    remote_share = mean(remote) |> round(3)
  ) |>
  dplyr::filter(postings >= 50) |> # up to you to determine the min threshold
  dplyr::arrange(dplyr::desc(remote_share)) |>
  head(3)
`)}` },

    { type: "explain", id: "dplyr-mutate-summarize", title: "mutate() or summarise()?",
      prompt: "Both <code>dplyr::mutate()</code> and <code>dplyr::summarise()</code> can compute a new column. Explain what each one does to the number of rows, and what <code>dplyr::group_by()</code> changes about the result of <code>summarise()</code>.",
      ideas: [
        idea("mutate() keeps every row", "Count the rows before and after.", "mutate keeps the same number of rows (it does not change the row count)"),
        idea("summarise() collapses rows into a summary", "What is left of 2,541 postings after summarise(n = dplyr::n())?", "summarise (also spelled summarize) collapses the rows into a summary, a single row when there is no grouping"),
        idea("After group_by(), summarise() returns one row per group", "One row for each what?", "after group_by, summarise (also spelled summarize) returns one row for each group"),
      ],
      wrong: [wrong("mutate reduces the number of rows, or that summarise (summarize) keeps every original row", "You have the two the wrong way round.")],
      tests: [
        t("mutate adds a column and leaves the number of rows alone. summarise squeezes all the rows into one summary row. If you group first, you get one row per group instead.", [1, 1, 1], false, "full"),
        t("With mutate the row count never changes. summarize collapses the table: one row overall, or one row for each group when it follows group_by.", [1, 1, 1], false, "full reworded"),
        t("mutate keeps all the rows and just adds a new column.", [1, 0, 0], false, "partial"),
        t("mutate collapses everything to one row, and summarize keeps all the rows and adds a column.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "code", id: "dplyr-pipeline", title: "Full-time postings by state", packages: ["readr", "dplyr"], files: ["jobs.csv"],
      task: "For <b>full-time</b> postings, <code>by_state</code> should have one row per state with the number of postings and the share that are remote, sorted from most postings to fewest. The pipeline has two problems. Find them and fix them.",
      starter: `jobs = readr::read_csv("../data/jobs.csv")

by_state = jobs |>
  dplyr::filter(category = "fulltime") |>
  dplyr::summarise(
    postings = dplyr::n(),
    remote_share = mean(remote) |> round(3)
  ) |>
  dplyr::group_by(location_state) |>
  dplyr::arrange(dplyr::desc(postings))

by_state
`,
      check: `is.data.frame(by_state) && all(c("location_state", "postings", "remote_share") %in% names(by_state)) && nrow(by_state) == length(unique(jobs$location_state[jobs$category == "fulltime"])) && sum(by_state$postings) == sum(jobs$category == "fulltime") && by_state$postings[1] == 272 && by_state$location_state[1] == "CA"`,
      hint: "Read the error first: <code>filter()</code> wants a test, and a test uses two equals signs. Then check the order of the verbs: the grouping has to happen <i>before</i> the summary.",
      solution: `jobs = readr::read_csv("../data/jobs.csv")

by_state = jobs |>
  dplyr::filter(category == "fulltime") |>
  dplyr::group_by(location_state) |>
  dplyr::summarise(
    postings = dplyr::n(),
    remote_share = mean(remote) |> round(3)
  ) |>
  dplyr::arrange(dplyr::desc(postings))

by_state
`,
      okMsg: "One row per state, California first with 272 full-time postings." },

    { type: "interpret", id: "dplyr-small-groups", title: "The top three states",
      prompt: "This is the class demo for \"among the full-time jobs, which states have the highest remote share?\", run on the same postings but without the line <code>dplyr::filter(postings &gt;= 50)</code>. Use the output to say what the first row is, and why that line belongs in the pipeline.",
      show: { kind: "output", text: OUT.small_groups },
      ideas: [
        idea("The first row is the postings with no state, and there are only 7", "Read location_state and postings in row 1.", "the first row is the group of postings whose state is missing (NA), and that it contains only a few postings (7)"),
        idea("A share from so few postings should not lead the ranking", "0.429 of 7 postings is 3 postings.", "a share or average computed from very few postings is not reliable or meaningful, so it should not be ranked alongside states that have many postings"),
        idea("filter(postings >= 50) keeps only groups with enough postings", "What does that line do to the 7-posting row?", "filtering on postings (for example postings >= 50) keeps only the groups or states that have enough postings, which removes the small group before the ranking"),
      ],
      wrong: [wrong("the output shows that the top-ranked row is a real state that is the best place for remote full-time work", "Look at what is written in location_state for row 1, and at how many postings it has.")],
      tests: [
        t("Row 1 is not a state at all: it is the 7 postings where the state is missing (NA). 0.429 of 7 is just 3 postings, so that share does not mean much and should not sit above Ohio with 95 postings. The filter on postings >= 50 keeps only states with enough postings, so the tiny group drops out before we rank.", [1, 1, 1], false, "full"),
        t("The top line is NA, postings with no state, only seven of them. A percentage from seven rows is unreliable. Filtering to groups with at least 50 postings removes it and leaves states with enough data.", [1, 1, 1], false, "full reworded"),
        t("The first row is the missing states, NA, with only 7 postings.", [1, 0, 0], false, "partial"),
        t("The filter keeps only states that have at least 50 postings.", [0, 0, 1], false, "partial"),
        t("The first row shows the state with the most remote full-time jobs, so that is the best state for remote work.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "interpret", id: "dplyr-join", title: "A row that found no partner",
      prompt: "<code>by_state</code> counts the postings in each state, and <code>states</code> is a lookup table of the fifty states with their regions. The output shows a <code>dplyr::left_join()</code> of the two and then a <code>dplyr::anti_join()</code>. Explain the <code>NA</code> values in row 7, what <code>left_join()</code> did with that row, and what <code>dplyr::inner_join()</code> would have done with it.",
      show: { kind: "output", text: OUT.left_join },
      ideas: [
        idea("NA means DC had no match in the states table", "anti_join() shows exactly the rows with no partner.", "the NA values mean that DC had no matching row in the states lookup table (the right-hand table), so there was no state name or region to fill in"),
        idea("left_join() kept the row anyway", "How many rows of by_state survive a left join?", "left_join keeps every row of the left table, including rows without a match"),
        idea("inner_join() would have dropped DC without a message", "inner_join() keeps matches only.", "inner_join would have dropped the DC row (kept only matching rows), so those 124 postings would be missing, with no warning"),
      ],
      wrong: [wrong("the NA means the number of postings for DC is missing or zero", "The count for DC is there. Look at which columns hold the NA.")],
      tests: [
        t("DC is not one of the fifty states in the lookup table, so the join found no match and put NA for state_name and region. left_join keeps all rows from by_state so DC is still there. inner_join would only keep matching rows, so DC and its 124 postings would vanish without any warning.", [1, 1, 1], false, "full"),
        t("NA = no partner row for DC on the right side. A left join never drops left rows. An inner join would have removed DC quietly.", [1, 1, 1], false, "full reworded"),
        t("There was no match for DC in the states table.", [1, 0, 0], false, "partial"),
        t("inner_join would have deleted the DC row.", [0, 0, 1], false, "partial"),
        t("The NA means DC has zero postings.", [0, 0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "apis", title: "Using APIs", classes: "Classes 08 and 09",
  blurb: "Reading an API address, sending a request with httr2, reading the status code, and turning the reply into a data frame.",
  tags: ["etl", "r"],
  links: { slides: [deck("08", "08_apis", "Classes 08 and 09 slides")], code: [classCode("class08.Rmd")] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li>An <b>API</b> is a documented contract: you send a request the documentation describes, and the server returns a status code and, when the code is 200, data.</li>
<li><b>Address:</b> server and path, then <code>?</code>, then <code>name=value</code> pairs joined by <code>&amp;</code>. The parameter names come from the documentation.</li>
<li><b>Status codes:</b> 2xx worked, 4xx is a problem with <i>your</i> request (400 bad request, 401 or 403 key, 404 not found, 429 too many), 5xx is a problem on the server.</li>
<li><b>Keys</b> go in <code>.Renviron</code> and are read with <code>Sys.getenv()</code>. Some APIs want the key as a query parameter (FRED), others in a header (USAJOBS).</li>
<li>The reply is a <b>list</b>. Find the table inside it, then fix the types: JSON has no date type, and numbers often arrive as text.</li>
</ul>
${code(`
ohio_jobs =
  httr2::request("https://api.stlouisfed.org/fred/series/observations") |>
  httr2::req_url_query(
    series_id = "IHLIDXUSOH",
    api_key = Sys.getenv("FRED_API_KEY"),
    file_type = "json"
  ) |>
  # nothing has been sent yet
  httr2::req_perform() |>
  httr2::resp_body_string() |>
  jsonlite::fromJSON()

dplyr::glimpse(ohio_jobs)
ohio_df = ohio_jobs$observations # we saw that the data is in observations
`)}` },

    { type: "explain", id: "api-url", title: "Read the address",
      prompt: "Explain the parts of this API address: what comes before the <code>?</code>, what comes after it, and what the <code>&amp;</code> does.",
      show: { kind: "plain", text: `https://api.stlouisfed.org/fred/series/observations?series_id=IHLIDXUSOH&file_type=json&observation_start=2026-01-01` },
      ideas: [
        idea("Before the ?: the server and the path (the endpoint)", "Which part says where the request goes?", "the part before the question mark is the server and path, that is, the endpoint or location the request is sent to"),
        idea("After the ?: query parameters written as name=value", "series_id=IHLIDXUSOH is one of them.", "the part after the question mark holds the query parameters, each written as a name and a value (name=value), which say what data is wanted"),
        idea("& separates one parameter from the next", "Count the parameters, then count the &.", "the ampersand separates one parameter (name=value pair) from the next"),
      ],
      wrong: [],
      tests: [
        t("Everything before the ? is the address of the endpoint: the server api.stlouisfed.org and the path /fred/series/observations. After the ? come the query parameters, each a name=value pair like series_id=IHLIDXUSOH, that tell the server what we want. The & separates the parameters from each other.", [1, 1, 1], false, "full"),
        t("Before: base URL plus path (where to send it). After: parameters as name = value. & joins or splits the pairs.", [1, 1, 1], false, "full reworded"),
        t("After the question mark are the parameters, written name=value.", [0, 1, 0], false, "partial"),
        t("The & separates the different parameters.", [0, 0, 1], false, "partial"),
      ] },

    { type: "code", id: "api-parse", title: "From the reply to a data frame", packages: ["jsonlite", "dplyr", "lubridate"], files: ["fred_reply.json"],
      task: "The file holds one saved reply from the FRED API (the Indeed job postings index for Ohio, daily, 2026), the same request as in class. Build <code>ohio_df</code> with two columns: <code>date</code> stored as a date and <code>value</code> stored as a number. The code treats the reply as if it were already a table, and it leaves both columns as text. <span style=\"color:#585E60;\">When you are done, this editor can also send a live request with <code>httr2</code>.</span>",
      starter: `ohio_jobs = jsonlite::fromJSON("../data/fred_reply.json")
dplyr::glimpse(ohio_jobs)

ohio_df = ohio_jobs |>
  dplyr::select(date, value)

mean(ohio_df$value)
`,
      check: `is.data.frame(ohio_df) && identical(names(ohio_df), c("date", "value")) && inherits(ohio_df$date, "Date") && is.numeric(ohio_df$value) && nrow(ohio_df) == 261 && !anyNA(ohio_df$value)`,
      hint: "<code>dplyr::glimpse(ohio_jobs)</code> shows the reply is a list, and the table is one of its elements. Take that element with <code>$</code>. Then, inside <code>dplyr::mutate()</code>, convert the date with <code>lubridate::ymd()</code> as we did in class, and the value with <code>as.numeric()</code>.",
      solution: `ohio_jobs = jsonlite::fromJSON("../data/fred_reply.json")
dplyr::glimpse(ohio_jobs)

ohio_df = ohio_jobs$observations |> # the data is in observations
  dplyr::select(date, value) |>
  dplyr::mutate(date = lubridate::ymd(date), value = as.numeric(value))

mean(ohio_df$value)
`,
      okMsg: "261 daily observations, with a real date and a numeric value." },
    { type: "interpret", id: "api-status", title: "HTTP 401",
      prompt: "A request to the USAJOBS API stopped with the message below. What does a code that starts with 4 tell you about where the problem is, and what would you check first for a 401?",
      show: { kind: "output", text: `Error in \`httr2::req_perform()\`:
! HTTP 401 Unauthorized.` },
      ideas: [
        idea("4xx: the problem is in my request, not on the server", "2 means it worked, 5 means the server failed. What is 4?", "a status code starting with 4 means the problem is with the request that was sent (the client side), not a failure of the server"),
        idea("401: the key is missing or wrong, so check the key", "Unauthorized. What proves who you are?", "a 401 means the API key is missing, wrong or not being sent correctly, so the first thing to check is the key (the .Renviron entry, Sys.getenv returning it, restarting R, or the header or parameter name)"),
      ],
      wrong: [wrong("a 401 means the server is down or broken and the only thing to do is wait", "A server failure would be a code that starts with 5.")],
      tests: [
        t("A code in the 400s means something is wrong with my request, not with their server. 401 is unauthorized, so the key is the suspect: I would check that Sys.getenv(\"USAJOBS_API_KEY\") actually returns it, that .Renviron has no quotes or spaces, that I restarted R, and that the header name is right.", [1, 1], false, "full"),
        t("4xx = client error, my side. 401 = bad or missing API key, so check the key and how it is sent.", [1, 1], false, "full reworded"),
        t("The key is probably wrong or was not sent.", [0, 1], false, "partial"),
        t("The 4 means it is an error in what I sent.", [1, 0], false, "partial"),
        t("The USAJOBS server is down. Nothing to do but wait until they fix it.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "scraping", title: "Web Scraping", classes: "Classes 10 and 11",
  blurb: "Permission to scrape, CSS selectors, text versus attributes, and collecting many pages politely.",
  tags: ["etl", "data_wrangling", "r"],
  links: { slides: [deck("10", "10_web_scraping_1", "Class 10 slides"), deck("12", "12_structured_text_extraction", "Class 12 slides (many pages)")], code: [classCode("class10.Rmd"), classCode("class11.Rmd"), classCode("class12.Rmd", false)] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Permission first.</b> <code>robotstxt::paths_allowed()</code> checks the site's robots.txt for one path. The site's terms of service count too.</li>
<li><b>Three steps:</b> <code>rvest::read_html()</code>, then <code>rvest::html_elements()</code> with a CSS selector, then <code>rvest::html_text2()</code> for the text, or <code>rvest::html_table()</code> for a table.</li>
<li><b>Finding a selector:</b> the Inspector (right-click, Inspect, copy the selector) or SelectorGadget. A copied selector that ends in <code>:nth-child(24)</code> returns one element; drop that part to get them all.</li>
<li><b>Check the count.</b> Compare <code>length()</code> of what the selector returned with what you see on the page.</li>
<li><b>One selector, one vector,</b> then <code>data.frame()</code> puts the vectors side by side. They must have the same length.</li>
<li><b>Many pages:</b> build each address with <code>paste0()</code> and repeat the scrape in a <code>for</code> loop, or write your own function and use <code>purrr::map_df()</code>. Pause with <code>Sys.sleep(1)</code> between requests.</li>
</ul>
${code(`
isa_page_in_r = rvest::read_html("https://bulletin.miamioh.edu/courses-instruction/isa/")

isa_page_in_r |>
  rvest::html_elements(
    "#sc_sccoursedescs > div > p.courseblocktitle > strong"
  ) |>
  rvest::html_text2() -> isa_titles

isa_page_in_r |>
  rvest::html_elements(".courseblockdesc")  |>
  rvest::html_text2() -> isa_descs

isa_df = data.frame(
  title = isa_titles, description = isa_descs
)
`)}` },

    { type: "explain", id: "scrape-permission", title: "Are we allowed?",
      prompt: "Before scraping a site, what do you check? If <code>robotstxt::paths_allowed()</code> returns <code>TRUE</code>, does that settle whether you may scrape the page? Explain.",
      ideas: [
        idea("Check robots.txt for the path you want", "It is the file that paths_allowed() reads.", "the site's robots.txt should be checked for the specific path, for example with robotstxt::paths_allowed"),
        idea("Read the site's terms of service too", "hiQ v. LinkedIn was about this.", "the site's terms of service (terms of use, user agreement) also have to be checked"),
        idea("TRUE does not settle it", "robots.txt is a request to robots, not the whole agreement.", "a TRUE from robots.txt is not enough by itself to settle permission, because the terms of service can still forbid scraping"),
      ],
      wrong: [wrong("a TRUE from paths_allowed means scraping is fully permitted and nothing else needs checking", "One more document applies.")],
      tests: [
        t("First I check robots.txt for that path with robotstxt::paths_allowed. Then I read the terms of service, because a TRUE only says robots are not asked to stay away from that path. The terms can still prohibit scraping, so TRUE alone does not settle it.", [1, 1, 1], false, "full"),
        t("Two things: robots.txt (per path) and the terms of use. TRUE is necessary but not sufficient since the user agreement might forbid it.", [1, 1, 1], false, "full reworded"),
        t("I would look at the robots.txt file for that path.", [1, 0, 0], false, "partial"),
        t("If paths_allowed says TRUE then you are allowed to scrape it, that is all you need.", [null, 0, 0], true, "wrong"),
      ] },

    { type: "code", id: "scrape-board", title: "Twenty cards, three columns", packages: ["rvest"], files: ["job_board.html"],
      task: "The saved page lists <b>20</b> job postings, each in a <code>div</code> with class <code>card</code>. Build <code>jobs_df</code> with the title, the company and the location of each posting. Open the page (link below) and view its source if you need to. Two of the three vectors are wrong. <span style=\"color:#585E60;\">When you are done, this editor can also read a live page: try <code>rvest::read_html()</code> on a real address.</span>",
      starter: `jobs_page = rvest::read_html("../data/job_board.html")

jobs_page |> rvest::html_elements("h2") |> rvest::html_text2() -> title
jobs_page |> rvest::html_elements(".card .company") -> company
jobs_page |> rvest::html_elements(".card .location") |> rvest::html_text2() -> location

length(title)
length(company)
length(location)

jobs_df = data.frame(title = title, company = company, location = location)
head(jobs_df)
`,
      check: `is.data.frame(jobs_df) && nrow(jobs_df) == 20 && identical(names(jobs_df), c("title", "company", "location")) && is.character(jobs_df$company) && jobs_df$title[1] == "Management and Program Analyst" && jobs_df$company[1] == "Federal Aviation Administration" && !any(jobs_df$title == "Career fair: Oct 21")`,
      hint: "Check the counts first. <code>\"h2\"</code> also matches the three headings in the sidebar, so make the selector say <i>inside a card</i>. Then compare the three lines: one of them stops before the step that turns the elements into text.",
      solution: `jobs_page = rvest::read_html("../data/job_board.html")

jobs_page |> rvest::html_elements(".card h2") |> rvest::html_text2() -> title
jobs_page |> rvest::html_elements(".card .company") |> rvest::html_text2() -> company
jobs_page |> rvest::html_elements(".card .location") |> rvest::html_text2() -> location

length(title)
length(company)
length(location)

jobs_df = data.frame(title = title, company = company, location = location)
head(jobs_df)
`,
      okMsg: "Twenty rows, three text columns." },
    { type: "interpret", id: "scrape-lengths", title: "23 titles, 20 companies",
      prompt: "A scrape of a page that shows 20 jobs printed this. What does it tell you about the selector used for the titles, and what do you do next?",
      show: { kind: "output", text: OUT.lengths },
      ideas: [
        idea("The title selector matches more than the 20 jobs", "The page shows 20 jobs. One vector has 23.", "the selector used for the titles is too broad and matches extra elements that are not job titles (23 instead of 20)"),
        idea("Make the selector more specific, then check length() again", "Add the class or the parent element to the selector.", "the selector should be made more specific (for example by adding a class or a parent element) and the count checked again so that it equals 20"),
      ],
      wrong: [wrong("the fix is to cut the longer vector down to its first 20 values without changing the selector", "Which three would you be throwing away? Look at the selector instead.")],
      tests: [
        t("The title selector is too general: it picked up 23 elements when there are only 20 jobs, so three of them are something else on the page. I would make the selector more specific, for example .card h2, and run length() again until it says 20.", [1, 1], false, "full"),
        t("Titles has three extra matches so the selector grabs things that aren't jobs. Narrow it with a class or parent and recheck the length.", [1, 1], false, "full reworded"),
        t("The selector for title is matching too many things.", [1, 0], false, "partial"),
        t("Just take title[1:20] so the sizes match and build the data frame.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "llm", title: "Text Extraction with an LLM", classes: "Class 12",
  blurb: "What a schema guarantees, what it does not, and when an LLM is the right tool for getting data out of text.",
  tags: ["llm_applications", "generative_ai", "prompt_engineering"],
  links: { slides: [deck("12", "12_structured_text_extraction")], code: [classCode("class12.Rmd", false)] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>When to use it.</b> An API or a selector is free and returns the same result every run. Use an LLM when the value sits inside free text, an image or a PDF, where no field name or tag points to it.</li>
<li><b>The schema is the prompt.</b> <code>ellmer::type_object()</code> lists the columns you want. Each field has a type and a description, and the description is your instruction to the model.</li>
<li><b>Types:</b> <code>ellmer::type_string()</code>, <code>ellmer::type_integer()</code>, <code>ellmer::type_number()</code>, <code>ellmer::type_boolean()</code>.</li>
<li><b>required = FALSE</b> lets the model return <code>NA</code>. A required field must be filled with something, which is where invented values come from.</li>
<li><b>A schema fixes the shape of the answer, not its correctness.</b> Results can differ between runs and each run costs money, so check a sample against the source.</li>
</ul>
${code(`
chat = ellmer::chat_openai(
  model = "gpt-5.6-luna",
  params = ellmer::params(reasoning_effort = "none")
)

course_info = chat$chat_structured(
  isa125_text,
  type = ellmer::type_object(
    name = ellmer::type_string(
      description = "Name of the course. For example, ISA 235. Information Technology and the Intelligent Enterprise."
    ),
   description = ellmer::type_string(description = "The description of the course without the prereqs."),
   prereqs = ellmer::type_string("List the information after Prerequisite:")
  )
)
`)}` },

    { type: "explain", id: "llm-schema", title: "What a schema guarantees",
      prompt: "You extract course information with <code>chat$chat_structured()</code> and a schema. Explain what the schema guarantees about the reply, what it does not guarantee, and one way you would check the result.",
      ideas: [
        idea("It guarantees the fields and their types", "The shape of the answer.", "the schema guarantees the structure of the reply: the fields (columns) that come back and their data types"),
        idea("It does not guarantee the values are correct", "Can a value have the right type and still be wrong?", "the schema does not guarantee that the values are correct or true; the model can still return wrong or invented values"),
        idea("Check a sample against the source (or run it twice)", "How did we check the catalog demo?", "the result should be checked, for example by comparing a sample of rows with the original text, checking the text appears on the page word for word, or running the extraction a second time and comparing"),
      ],
      wrong: [wrong("using a schema makes the extracted values correct or guarantees accuracy", "A schema controls the shape, nothing more.")],
      tests: [
        t("The schema guarantees the shape: I get exactly the fields I listed, each with the type I declared. It does not guarantee that what is in those fields is right, the model can still make something up. I would check a sample of rows against the catalog page, or run it again and compare the two runs.", [1, 1, 1], false, "full"),
        t("Guaranteed: column names and types. Not guaranteed: correctness of the content. Check: compare some rows with the source text.", [1, 1, 1], false, "full reworded"),
        t("It guarantees which fields come back and what type they are.", [1, 0, 0], false, "partial"),
        t("With a schema the model's output is guaranteed to be accurate, so no checking is needed.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "interpret", id: "llm-required", title: "Two suspicious values",
      prompt: "The catalog says this course is worth 1.5 credit hours and lists no prerequisite. Use the schema to explain why the model returned <code>2</code> and <code>\"None listed\"</code>, and how you would change the schema.",
      show: { kind: "code", text: `type_course = ellmer::type_object(
  code = ellmer::type_string(description = "Subject and number of the course"),
  credit_hours = ellmer::type_integer(description = "Credit hours"),
  prereqs = ellmer::type_string(description = "The prerequisite[s] for this course")
)

# what came back for one course
#   code       credit_hours   prereqs
#   "ISA 177"  2              "None listed"` },
      ideas: [
        idea("An integer field cannot hold 1.5: use type_number()", "What is the declared type of credit_hours?", "credit_hours was declared as an integer, which cannot hold 1.5, so the value was changed to a whole number, and the field should be a number type (type_number) instead"),
        idea("prereqs is required, so the model had to return something", "What is the default when you do not write required = FALSE?", "the prereqs field is required (by default), so the model had to return some text even though the course has no prerequisite"),
        idea("required = FALSE lets it return NA", "One argument in the prereqs line.", "adding required = FALSE to the prereqs field lets the model return a missing value (NA) when there is no prerequisite"),
      ],
      wrong: [],
      tests: [
        t("credit_hours is type_integer, and an integer cannot be 1.5, so the model rounded to 2. It should be type_number. prereqs has no required = FALSE, so it is required and the model had to write something, which is where None listed came from. With required = FALSE it can return NA.", [1, 1, 1], false, "full"),
        t("1.5 doesn't fit an integer field so you get 2; switch to type_number(). The prerequisite field is mandatory by default so the model invents text; set required = FALSE and you get NA.", [1, 1, 1], false, "full reworded"),
        t("The credit hours are declared as integer, so 1.5 can't be stored. Use type_number.", [1, 0, 0], false, "partial"),
        t("The prereqs field needs required = FALSE so the model can return NA.", [0, null, 1], false, "partial"),
      ] },
  ],
},

// ================================================================================================
{
  id: "tidy", title: "Tidy and Technically Correct Data", classes: "Class 13",
  blurb: "The three rules of tidy data, the two conditions of technically correct data, and tidyr::separate().",
  tags: ["data_wrangling", "r"],
  links: { slides: [deck("13", "13_tidy_data")], code: [] },
  steps: [
    { type: "read", title: "What to remember", html: `
<ul>
<li><b>Tidy</b> is about shape: each variable is a column, each observation is a row, each value is a cell.</li>
<li><b>Technically correct</b> is about names and types: column names you can type without quotes, and each column stored as the type that matches what it holds.</li>
<li>A table can be one without the other. A price stored as <code>"$119.00"</code> is tidy and not technically correct.</li>
<li><code>tidyr::separate()</code> splits one column into several. Without <code>sep</code>, it cuts at every character that is not a letter or a number.</li>
<li>The pieces are still text afterwards. Convert them: <code>lubridate::dmy()</code> for dates written day, month, year, and <code>as.integer()</code> for counts.</li>
<li><code>tidyr::pivot_longer()</code> and <code>tidyr::pivot_wider()</code> move values between column names and rows. You should recognize what they do.</li>
</ul>
${code(`
crash_clean = df |>
  dplyr::mutate(
    date = lubridate::dmy(date),
    dplyr::across(c(air_fatalities, passengers, ground),
                  as.integer)
  )
dplyr::glimpse(crash_clean)
`)}` },

    { type: "explain", id: "tidy-vs-correct", title: "Tidy or technically correct?",
      prompt: "A table of Airbnb listings has one row per listing and one column per variable, but <code>price</code> is stored as text such as <code>\"$119.00\"</code>. Is the table tidy? Is it technically correct? Explain the difference between the two.",
      ideas: [
        idea("Tidy is about shape: variables in columns, observations in rows, one value per cell", "The three rules.", "tidy data is about the shape or layout of the table: each variable is a column, each observation is a row, and each cell holds one value"),
        idea("Technically correct is about names and types", "Two conditions, and neither is about shape.", "technically correct data is about the columns having the correct data types (and reasonable column names)"),
        idea("This table is tidy but not technically correct", "Which of the two does a text price break?", "this table is tidy but is not technically correct, because price is stored as text instead of a number"),
      ],
      wrong: [wrong("the table is not tidy because the price column is stored as text or has the wrong type", "A wrong type does not change the shape of the table.")],
      tests: [
        t("It is tidy: one listing per row, one variable per column, one value in each cell. That is all tidy asks, it is about the shape. Technically correct is about types and names, and price is a character string where it should be a number, so the table is tidy but not technically correct.", [1, 1, 1], false, "full"),
        t("Tidy = layout (variables are columns, observations rows, single values in cells). Technically correct = right data type per column and usable names. So: tidy yes, technically correct no, since price is text.", [1, 1, 1], false, "full reworded"),
        t("Tidy means each variable has a column, each observation a row and each value a cell.", [1, 0, 0], false, "partial"),
        t("It is not tidy because price is saved as text with a dollar sign.", [0, 0, 0], true, "wrong"),
      ] },

    { type: "code", id: "tidy-separate", title: "Three numbers in one cell", packages: ["readr", "tidyr", "dplyr", "lubridate"], files: ["crashes_2025.csv"],
      task: "In <code>crashes_2025.csv</code> the <code>fatalities</code> cell holds three numbers, such as <code>67/67(0)</code>: fatalities in the air, people on the aircraft, and fatalities on the ground. Finish <code>crash_clean</code> so that the three numbers are in the columns <code>air_fatalities</code>, <code>passengers</code> and <code>ground</code>, stored as integers, and the last line returns the total number of people killed on the ground.",
      starter: `crashes = readr::read_csv("../data/crashes_2025.csv")

crash_clean = crashes |>
  tidyr::separate(fatalities, into = c("air_fatalities", "passengers")) |>
  dplyr::mutate(date = lubridate::dmy(date))

dplyr::glimpse(crash_clean)
sum(crash_clean$ground)
`,
      check: `is.data.frame(crash_clean) && all(c("air_fatalities", "passengers", "ground") %in% names(crash_clean)) && is.integer(crash_clean$ground) && is.integer(crash_clean$air_fatalities) && is.integer(crash_clean$passengers) && sum(crash_clean$ground) == 63 && inherits(crash_clean$date, "Date") && nrow(crash_clean) == 14`,
      hint: "The cell has three numbers, so <code>into</code> needs three names. After the split the pieces are still text: convert the three columns with <code>dplyr::across(c(...), as.integer)</code> inside <code>mutate()</code>. A warning about a discarded piece is expected here.",
      solution: `crashes = readr::read_csv("../data/crashes_2025.csv")

crash_clean = crashes |>
  tidyr::separate(fatalities, into = c("air_fatalities", "passengers", "ground")) |>
  dplyr::mutate(
    date = lubridate::dmy(date),
    dplyr::across(c(air_fatalities, passengers, ground),
                  as.integer)
  )

dplyr::glimpse(crash_clean)
sum(crash_clean$ground)
`,
      okMsg: "63 people on the ground, from three integer columns and a real date." },

    { type: "interpret", id: "tidy-warning", title: "Expected 3 pieces",
      prompt: "The call below printed a warning. Using the cell <code>67/67(0)</code>, explain why R found more pieces than names, and whether the result can be trusted.",
      show: { kind: "output", text: OUT.separate_warning },
      ideas: [
        idea("Without sep, separate() cuts at /, ( and ), which gives four pieces", "Count the characters in 67/67(0) that are not letters or numbers.", "separate, when no sep is given, also splits at the parentheses (at every character that is not a letter or a number), which produces four pieces instead of three"),
        idea("The extra piece is empty, so the three columns are right", "What is left after the closing parenthesis?", "the discarded fourth piece is empty (nothing comes after the closing parenthesis), so no data is lost and the three resulting columns are correct"),
      ],
      wrong: [wrong("the warning means the code failed or the result is wrong and cannot be used", "A warning is not an error. Work out what was discarded.")],
      tests: [
        t("With no sep, separate splits wherever there is a character that is not a letter or a digit. In 67/67(0) that is the slash, the opening parenthesis and the closing parenthesis, so there are four pieces and only three names. The fourth piece is the empty text after the ), so nothing real is thrown away and the three columns are correct.", [1, 1], false, "full"),
        t("It cuts at / ( and ) by default, giving 4 parts for 3 names. The dropped part is blank, so the result is fine. It is a warning, not an error.", [1, 1], false, "full reworded"),
        t("The default separator is any non alphanumeric character so the closing bracket also counts as a split, making four pieces.", [1, 0], false, "partial"),
        t("The warning means separate did not work and the columns are wrong, so the code has to be thrown out.", [0, 0], true, "wrong"),
      ] },
  ],
},

// ================================================================================================
{
  id: "interview", title: "Interview Practice", classes: "After the exam, or for fun", optional: true,
  blurb: "Seven questions an interviewer could ask about what you have done in this course. Answer the way you would say it out loud.",
  tags: ["data_analysis"],
  steps: [
    { type: "read", title: "How this works", html: `
<p>These are not exam questions. Each one is tagged with a skill from real job postings, and each is checked for the points a good answer usually makes. Answer in three or four sentences, in the first person, with something you actually did in this course.</p>` },

    { type: "explain", id: "int-messy", title: "Data you could not use as it came", tags: ["data_wrangling", "etl"],
      prompt: "\"Tell me about a time data arrived in a form you could not analyze. What did you do?\"",
      ideas: [
        idea("Names a specific problem with the data", "What exactly was wrong with it? Be concrete.", "the answer names a specific problem with the data, such as several values combined in one cell, numbers or dates stored as text, or a table that had to be scraped or reshaped"),
        idea("Describes the steps taken to fix it", "Which tools or functions, in which order?", "the answer describes concrete steps taken to fix the data, such as splitting a column, converting types, or reshaping, ideally naming the tool or function"),
        idea("Says how the result was checked", "How did you know it worked?", "the answer says how the result was verified or checked, such as inspecting the types, comparing counts or totals, or looking at the rows"),
      ],
      wrong: [],
      tests: [
        t("In my BI course we scraped a table of 2025 plane crashes where one cell held three numbers, like 67/67(0), and the dates were text. I used tidyr::separate in R to split that cell into three columns, then converted the counts to integers and the date to a real date with lubridate. I checked it with glimpse to confirm the types and by making sure the row count was still 14.", [1, 1, 1], false, "full"),
        t("We had a scraped table with combined cells and everything stored as characters. I split the columns and fixed the types in R, and then verified by checking the column types and totals.", [1, 1, 1], false, "full reworded"),
        t("Once I got data where the dates were stored as text.", [1, 0, 0], false, "partial"),
        t("I am a hard worker and I always make sure my data is clean.", [0, 0, 0], false, "vague"),
      ] },

    { type: "explain", id: "int-reproducible", title: "Work someone else can rerun", tags: ["version_control", "r"],
      prompt: "\"How do you make sure a colleague can reproduce your analysis six months from now?\"",
      ideas: [
        idea("The steps are in code, not manual clicks", "Script or spreadsheet?", "the analysis is written as code or a script (for example R or R Markdown) that can be rerun, not done by manual steps in a spreadsheet"),
        idea("The work is under version control", "Where do your commits go?", "the work is kept under version control, such as Git and GitHub, with commits"),
        idea("It runs from a clean start: project, relative paths, a fresh knit", "Would it run on their computer?", "the work is set up to run on another computer or from a clean start, for example by using a project with relative paths, knitting the document from scratch, or keeping keys outside the code"),
      ],
      wrong: [],
      tests: [
        t("I write the whole analysis as an R Markdown document instead of clicking through a spreadsheet, so every step is in code and runs top to bottom. I keep it in a Git repository on GitHub and commit as I go. I use an RStudio project with relative paths and I knit from a fresh session before I push, so it does not depend on my machine.", [1, 1, 1], false, "full"),
        t("Everything is scripted, tracked with git, and uses relative paths in a project so it runs anywhere.", [1, 1, 1], false, "full reworded"),
        t("I keep my files on GitHub and commit regularly.", [0, 1, 0], false, "partial"),
        t("I would email them the Excel file and explain what I did.", [0, 0, 0], false, "weak"),
      ] },

    { type: "explain", id: "int-api", title: "Data behind a vendor's API", tags: ["etl", "r"],
      prompt: "\"Our sales data sits behind a vendor's API. Walk me through how you would get it into a table you can analyze.\"",
      ideas: [
        idea("Starts from the documentation: endpoint, parameters, key", "Where do the parameter names come from?", "the first step is reading the API documentation to find the endpoint, the parameters, and how authentication (the key) works"),
        idea("Sends the request with the key kept out of the code", "Where does the key live?", "a request is sent from code (for example with httr2 in R) with the API key kept out of the code, such as in an environment variable or .Renviron"),
        idea("Parses the JSON into a data frame and fixes the types", "What does the reply look like when it arrives?", "the reply (JSON) is parsed or converted into a data frame or table"),
      ],
      wrong: [],
      tests: [
        t("I would start with the vendor's documentation to find the endpoint, the query parameters and how they want the key sent. Then I would build the request in R with httr2, reading the key from an environment variable so it never appears in my code. The reply comes back as JSON, so I parse it, pull out the table, and convert the dates and numbers from text before analyzing.", [1, 1, 1], false, "full"),
        t("Read the docs for the endpoint and auth, call it from R with the key in .Renviron, then turn the JSON into a data frame and fix column types.", [1, 1, 1], false, "full reworded"),
        t("I would parse the JSON response into a data frame.", [0, 0, 1], false, "partial"),
        t("I would ask the vendor to send me a spreadsheet.", [0, 0, 0], false, "weak"),
      ] },

    { type: "explain", id: "int-llm-privacy", title: "Customer records and a chatbot", tags: ["generative_ai", "llm_applications", "data_privacy"],
      prompt: "\"A manager wants to paste our customer records into a chatbot to have it analyze them. What do you say?\"",
      ideas: [
        idea("Names the risk: the records leave the company", "Where does pasted text go?", "pasting the records sends private or confidential customer data to an outside company or service, which is a privacy or confidentiality risk"),
        idea("Offers a way that keeps the rows in house", "What did querychat send to the model?", "there is an alternative in which only the structure of the data (the schema or column names) is shared and the model writes code or SQL that is run locally on the data, so the records stay inside the company"),
        idea("Says the output still has to be checked", "Can the model be wrong?", "the model's output can be wrong and should be checked or verified, for example by reading the code or SQL it wrote"),
      ],
      wrong: [],
      tests: [
        t("I would say no to pasting the records, because that sends our customers' private data to an outside company. A better way is to give the model only the column names and types and have it write the SQL or R code, which we then run on our own machines so the rows never leave. And I would still read the code it writes, because these models make mistakes.", [1, 1, 1], false, "full"),
        t("That exposes confidential data to a third party. Share the schema only and let the LLM generate a query we execute locally. Then verify what it produced.", [1, 1, 1], false, "full reworded"),
        t("That is a privacy problem since the data goes to another company.", [1, 0, 0], false, "partial"),
        t("Great idea, chatbots are very good at analyzing data quickly.", [0, 0, 0], false, "weak"),
      ] },

    { type: "explain", id: "int-scrape", title: "Scraping a public website", tags: ["etl", "data_wrangling"],
      prompt: "\"You need prices from a public website that has no API. How do you go about it responsibly, and how do you know you got everything?\"",
      ideas: [
        idea("Checks permission: robots.txt and the terms of service", "Two documents.", "permission is checked first, by looking at the site's robots.txt and its terms of service"),
        idea("Is polite: pauses between requests", "What goes inside the loop?", "requests are sent politely, with a pause or delay between them so the site is not overloaded"),
        idea("Verifies the result: counts match the page", "How many items does the page show?", "the result is verified, for example by checking that the number of items scraped matches what the page shows or that the columns have equal length"),
      ],
      wrong: [],
      tests: [
        t("First I would check that scraping is allowed: the robots.txt for those paths and the terms of service. Then I would write the scrape with a pause of about a second between page requests so I do not hammer their server. To know I got everything I compare the number of rows with the number of products the site shows, and check that each selector returned the same count.", [1, 1, 1], false, "full"),
        t("Look at robots.txt and the terms, add a delay between requests, and confirm the counts line up with the page.", [1, 1, 1], false, "full reworded"),
        t("I would add Sys.sleep between requests to be polite.", [0, 1, 0], false, "partial"),
        t("I would just download everything as fast as possible.", [0, 0, 0], false, "weak"),
      ] },

    { type: "explain", id: "int-summary", title: "A ranking that looks too good", tags: ["data_analysis", "data_wrangling"],
      prompt: "\"You ranked our sales regions by average order value, and a region nobody expected came out on top. What do you check before you present it?\"",
      ideas: [
        idea("How many records are behind each average", "How many orders did that region have?", "the number of records, orders or rows behind each group's average should be checked, because a group with very few records can produce an extreme average"),
        idea("Whether a few extreme values drive it", "Mean or median?", "outliers or extreme values (a skewed distribution) should be checked, for example by comparing the average with the median or looking at the largest values"),
        idea("How the caveat will be handled in the report", "What goes next to the average in your table?", "the answer says what will be done about it in the report, such as showing the count next to each average, setting a minimum number of records, or stating the caveat"),
      ],
      wrong: [],
      tests: [
        t("First I would look at how many orders are behind each region's average, because a region with only a handful of orders can easily land at the top. Then I would check whether one or two very large orders are pulling the average up, by comparing it with the median. In the report I would show the number of orders next to each average and only rank regions with a minimum number of orders.", [1, 1, 1], false, "full"),
        t("Check the count per group, check for outliers using the median, and put the counts in the table with a minimum threshold.", [1, 1, 1], false, "full reworded"),
        t("I would see how many orders that region actually had.", [1, 0, 0], false, "partial"),
        t("I would present it right away because the numbers are the numbers.", [0, 0, 0], false, "weak"),
      ] },

    { type: "explain", id: "int-join", title: "A join, in plain words", tags: ["sql", "data_analysis"],
      prompt: "\"Explain a left join to someone who is not technical, and tell me one way it can mislead you.\"",
      ideas: [
        idea("Keeps every row of the first table and adds matching columns from the second", "Use an everyday example of two lists.", "a left join keeps every row of the first (left) table and adds the matching information from the second table"),
        idea("Rows with no match get blanks (NA)", "What happens to a customer with no orders?", "rows in the first table that have no match in the second table are kept with blank or missing (NA) values"),
        idea("Names a way it misleads", "What happened to DC in the review unit?", "one way it can mislead is named, such as unnoticed missing values from rows that did not match, or rows being duplicated when the key appears more than once in the second table"),
      ],
      wrong: [],
      tests: [
        t("Imagine a list of all our customers and a second list of sales regions by state. A left join keeps every customer and writes the region next to each one. If a customer's state is not in the region list, that customer stays but the region is blank. That can mislead you: if you then total by region, those customers quietly fall into a blank group, so I always check which rows did not match.", [1, 1, 1], false, "full"),
        t("You keep everything from table one and attach what matches from table two. No match means NA. The danger is missing values you don't notice, or duplicate rows if the key repeats.", [1, 1, 1], false, "full reworded"),
        t("It keeps all the rows from the left table and adds columns from the right one where they match.", [1, 0, 0], false, "partial"),
        t("A left join only keeps rows that exist in both tables.", [0, 0, 0], false, "wrong idea"),
      ] },
  ],
},
];
