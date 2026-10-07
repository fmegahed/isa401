# Recap clips: narration scripts for review

Nine clips, one per unit, about 65 to 75 seconds each (roughly 1,450 words and 8,500 characters in total).
Each script uses only what was written in class or shown on the slides. Edit the text directly; the
audio is generated from this file only after you approve it.

Spoken spellings: the voice reads what is written, so package names are spelled the way they should
sound (`dplyr` is written "dee plier", `rvest` "R vest", `httr2` "H T T R two", `tidyr` "tidy R",
`ellmer` "elmer"). The board shows the real names.

"Board" lists what is drawn while the sentence is spoken.

---

## 1. Data Types and R Vectors (Classes 01 and 03)

Every analysis starts with a question about shape. A row in a database table is structured data: fixed
columns, and one value in each. A JSON file is semi-structured: it carries its own labels, and it can
nest. The text of a job description is unstructured: no fields at all.

Next, ask what one row is. In the Cincinnati crashes file, one row is one person, not one crash. So
counting rows does not count crashes.

Now the R side. A vector holds one type. We built crashes by day with c, seven numbers, and type of
returned double. Put one value in quotes, and the whole vector becomes character, and the mean stops
working.

R also works on the whole vector at once. Crashes by day, greater than two thousand, gives seven
answers, true or false. And sum counts the trues.

**Board:** three boxes labelled structured / semi-structured / unstructured, with a table row, a JSON
snippet and a line of text. "1 row = 1 person". `crashes_by_day = c(2020, 2241, ...)`,
`typeof()` gives `"double"`. `crashes_by_day > 2000` gives seven TRUE/FALSE. `sum(...)` gives 5.

---

## 2. Git and GitHub (Class 02)

Git is the tool on your computer that records snapshots of your project. GitHub is the website that
keeps a copy.

A commit saves a snapshot on your computer. Nothing has left your laptop yet. A push sends your commits
to GitHub. So if your partner cannot see your file online, you committed, but you did not push.

Our ritual at the end of every class is three steps: knit, commit, push. Then open the repository on
GitHub and check that the file is there. If it is not pushed, it is not done.

Mistakes happen. Before you push, Undo takes the commit back. After you push, use Revert. Revert adds a
new commit that reverses the old one, and the history keeps both.

And remember why we write code at all. The steps are written down, they run in order, and they run again
on new data.

**Board:** laptop and cloud. "commit" arrow stays on the laptop; "push" arrow goes to the cloud.
"knit, commit, push". Timeline of commits; "Undo" before the push, "Revert" adds a new dot after it.

---

## 3. Importing Data (Classes 04 and 05)

Your markdown lives in the markdowns folder, and your files live in the data folder. So a path starts
with dot dot, slash, data. Go up one folder, then into data. Knitting starts from the markdown's folder.
The Console starts from the project folder. That is why the same line can work in one and fail in the
other.

Three readers. Read C S V, from reader, reads a web address or a local file. Read excel, from read X L,
needs a file on disk: give it the path, the sheet, and skip, for the rows above the header. Forget skip,
and the title becomes one giant column name. From JSON, from JSON lite, reads JSON, and it often comes
back as a list.

Always run glimpse on what you imported.

To pull one piece out: single brackets keep the container. Double brackets, and the dollar sign, open it.

**Board:** folder tree: project, markdowns, data; the path `"../data/occupation.xlsx"` traced along it.
`readr::read_csv()`, `readxl::read_excel(path, sheet, skip)`, `jsonlite::fromJSON()`.
`dplyr::glimpse()`. `job["salary"]` drawn as a box in a box; `job[["salary"]]`, `job$salary$max`.

---

## 4. The querychat App (Classes 06 and 07)

The Job Scout app turns a question in plain English into an answer from a database. Two actors do the
work. The language model writes SQL. The database runs it.

The model receives your question, and a description of the table: column names, types, and ranges. It
never receives the rows. So the model has not seen your data, and it does not know the answer. It returns
a query, and you can read that query. Read it before you trust the table.

Ask how many postings are in Ohio, and the model may search for the word Ohio, when the column stores the
two letters O H. That returns zero. A data dictionary fixes it: tell the model what each column means,
and how it is coded.

Last, the key. On your computer it lives in dot R environ, which Git ignores. On Render it is an
environment variable. A key in a commit is public within minutes.

**Board:** question bubble, arrow to "model", arrow labelled "SQL" to "database", arrow back "table".
"schema only, no rows". `LIKE '%Ohio%'` crossed out, `= 'OH'`. "data dictionary". `.Renviron`, with a
lock.

---

## 5. Wrangling with dee plier (Class 07)

Five verbs, chained with the pipe. Select keeps columns. Filter keeps rows, and the test uses two equals
signs. Mutate adds a column, and never changes the number of rows. Arrange sorts. Group by, followed by
summarise, collapses the table to one row per group, and N counts the rows in each group.

In class we asked: among full-time jobs, which states have the highest remote share? Filter to full time.
Group by state. Summarise the number of postings, and the mean of remote. Then one more filter: keep
states with at least fifty postings, because a share from seven postings tells you very little. Arrange
in descending order, and take the head.

To add information from a second table, use left join. It keeps every row of the left table, and a row
with no partner gets N A. Run anti join once, to see which rows found no partner.

**Board:** the class pipeline, one line per verb: `dplyr::filter(category == 'fulltime')`,
`dplyr::group_by(location_state)`, `dplyr::summarise(postings = dplyr::n(), remote_share = ...)`,
`dplyr::filter(postings >= 50)`, `dplyr::arrange(dplyr::desc(remote_share))`, `head(3)`. A table shrinking
to one row per group. Two tables joining; the DC row with `NA`.

---

## 6. Using APIs (Classes 08 and 09)

An A P I is a documented way to ask a server for data. Read the address like a sentence. Before the
question mark: the server and the path. After it: parameters, written as name equals value, and joined
by ampersands. The names come from the documentation.

In R, we build the request with H T T R two. Request takes the address. Req U R L query adds the
parameters. Nothing has been sent yet. Req perform sends it. Resp body string takes the reply as text,
and from JSON turns it into a list.

For FRED, the key is a parameter, and we read it with sys get env, so it never appears in the code. For
U S A Jobs, the key goes in the headers.

The server answers with a status code. Two hundred means it worked. A code that starts with four means:
fix your request. Four oh one means: check your key.

Then find the table inside the list, and fix the types.

**Board:** the FRED address split at `?` and `&`, parts labelled. The pipeline, one line per function:
`httr2::request()`, `httr2::req_url_query()`, `httr2::req_perform()`, `httr2::resp_body_string()`,
`jsonlite::fromJSON()`. `Sys.getenv("FRED_API_KEY")`. "200 ok", "4xx your request", "401 key".
`ohio_jobs$observations`, `lubridate::ymd(date)`.

---

## 7. Web Scraping (Classes 10 and 11)

When a site has no A P I, we read the page itself. First, permission. Paths allowed checks robots dot
T X T for one path. The terms of service count too.

Then three steps with R vest. Read H T M L downloads the page. H T M L elements picks the pieces, with a
C S S selector. H T M L text two returns their text.

To find a selector: right-click, Inspect, and copy the selector. Or use Selector Gadget.

One selector gives one vector. Check its length against what you see on the page. Twenty jobs should
give twenty titles. If you get twenty-three, the selector is too broad.

Put the vectors side by side with data frame.

For many pages, look at how the address changes. Build each address with paste zero, and repeat the
scrape in a for loop. Or write your own function, and use map D F. Pause one second between requests
with sys sleep.

**Board:** `robotstxt::paths_allowed()` with a tick, "terms of service" beside it. Three steps:
`rvest::read_html()`, `rvest::html_elements("...")`, `rvest::html_text2()`. `length(titles)` 23 vs 20.
`data.frame(title, description)`. Four addresses built by `paste0()`; a loop arrow; `Sys.sleep(1)`.

---

## 8. Text Extraction with an L L M (Class 12)

Sometimes the value you need has no tag and no field name. It sits inside a sentence, like a
prerequisite inside a course description. A selector cannot reach it. A language model can.

With the elmer package, we start a chat with chat open A I. Then chat structured takes two things: the
text, and a description of what we want back. That description is type object, with one entry per
column. Each entry has a type, such as type string, and a description. The description is your
instruction to the model, so write it carefully.

What comes back has exactly those fields. That is all it guarantees. A schema fixes the shape of the
answer, not its correctness. The same code can return different text on a second run, and each run costs
money.

So check a sample against the page. And if a selector, or one line of code, can do the job, use that
instead.

**Board:** a course description with the prerequisite sentence underlined. `ellmer::chat_openai()`,
`chat$chat_structured(text, type = ...)`, `ellmer::type_object(name = ellmer::type_string("..."), ...)`.
One output row with three fields. "shape, not correctness". "check a sample".

---

## 9. Tidy and Technically Correct Data (Class 13)

Two definitions. Tidy is about shape: each variable is a column, each observation is a row, each value
is a cell. Technically correct is about names and types: names you can type without quotes, and each
column stored as the type that matches what it holds.

The crash table broke both. One cell held sixty-seven, slash, sixty-seven, and zero in parentheses.
Three numbers in one cell.

Separate, from tidy R, splits it. Give it the column, and into, with the three new names. Without sep,
it cuts at every character that is not a letter or a number. So it finds four pieces, and warns that
one was discarded. That piece is empty, so the result is fine. For location and operator, we set sep to
the line break.

Now the table is tidy, but every column is text. Inside mutate, D M Y turns the date into a date, and
across, with as integer, converts the three counts. Then glimpse, to confirm.

**Board:** three small grids marking a column, a row, a cell. "names + types". The cell `67/67(0)`
splitting into three boxes, a fourth empty box crossed out. `tidyr::separate(fatalities, into = c(...))`.
`sep = "\n"`. `lubridate::dmy(date)`, `dplyr::across(c(...), as.integer)`. `dplyr::glimpse()` with
`<date>` and `<int>`.
