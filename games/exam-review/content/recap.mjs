// The nine recap clips: what is said and what is drawn while it is said.
//
// `say` is the narration. Joined in order, the `say` strings of a clip must equal the approved script
// in recap/scripts.md word for word; make_recap.mjs stops if they do not.
// `board` lists what is drawn during that sentence, top to bottom on the whiteboard:
//   { hand: "..." }   a handwritten line        options: big, color ("red" | "blue"), indent
//   { code: "..." }   a line of R, coloured as in the decks
//   { row: [...] }    boxes left to right, joined by arrows (arrows: false for none)
//   { gap: true }     half a line of space
//   { page: true }    wipe the board and start again at the top
// `at: "words"` starts an item when those words are spoken (they must appear in `say`). Without it,
// items start one after another from the beginning of the sentence. `strikeAt` crosses a line out.

export default [
{ id: "data", segs: [
  { say: "Every analysis starts with a question about shape.", board: [{ hand: "What shape is the data?", big: true, color: "red" }] },
  { say: "A row in a database table is structured data: fixed columns, and one value in each.", board: [{ hand: "structured: a table row, fixed columns", at: "structured data" }] },
  { say: "A JSON file is semi-structured: it carries its own labels, and it can nest.", board: [{ hand: "semi-structured: JSON, labels and nesting", at: "semi-structured" }] },
  { say: "The text of a job description is unstructured: no fields at all.", board: [{ hand: "unstructured: free text, no fields", at: "unstructured" }] },
  { say: "Next, ask what one row is. In the Cincinnati crashes file, one row is one person, not one crash. So counting rows does not count crashes.", board: [
    { gap: true }, { hand: "What is one row?", big: true, color: "red" },
    { hand: "crashes file: 1 row = 1 person", color: "blue", at: "one row is one person" },
    { hand: "so the number of rows is not the number of crashes", at: "So counting" }] },
  { say: "Now the R side. A vector holds one type.", board: [{ page: true }, { hand: "One vector, one type", big: true, color: "red", at: "A vector" }] },
  { say: "We built crashes by day with c, seven numbers, and type of returned double.", board: [
    { code: "crashes_by_day = c(2020, 2241, 2327, 2285, 2380, 1866, 1664)" },
    { code: 'typeof(crashes_by_day)       # "double"', at: "type of" }] },
  { say: "Put one value in quotes, and the whole vector becomes character, and the mean stops working.", board: [
    { code: 'typeof(c(2020, "2241", 2327))   # "character"' },
    { hand: "then mean() returns NA", color: "blue", at: "the mean" }] },
  { say: "R also works on the whole vector at once. Crashes by day, greater than two thousand, gives seven answers, true or false. And sum counts the trues.", board: [
    { gap: true },
    { code: "crashes_by_day > 2000", at: "Crashes by day" },
    { code: "# TRUE TRUE TRUE TRUE TRUE FALSE FALSE", at: "seven answers" },
    { code: "sum(crashes_by_day > 2000)   # 5", at: "And sum" }] },
] },

{ id: "git", segs: [
  { say: "Git is the tool on your computer that records snapshots of your project. GitHub is the website that keeps a copy.", board: [
    { hand: "Git: the tool on your computer", color: "red" },
    { hand: "GitHub: the website that keeps a copy", color: "red", at: "GitHub is" }] },
  { say: "A commit saves a snapshot on your computer. Nothing has left your laptop yet.", board: [
    { gap: true }, { row: ["your work", "commit", "snapshot on your laptop"] }] },
  { say: "A push sends your commits to GitHub.", board: [{ row: ["snapshot on your laptop", "push", "GitHub"] }] },
  { say: "So if your partner cannot see your file online, you committed, but you did not push.", board: [
    { hand: "not online? you committed, but did not push", color: "blue", at: "you committed" }] },
  { say: "Our ritual at the end of every class is three steps: knit, commit, push. Then open the repository on GitHub and check that the file is there. If it is not pushed, it is not done.", board: [
    { page: true }, { hand: "The ritual", big: true, color: "red" },
    { row: ["knit", "commit", "push"], at: "knit, commit" },
    { hand: "then check the file on GitHub", at: "Then open" },
    { hand: "not pushed = not done", color: "red", at: "If it is not pushed" }] },
  { say: "Mistakes happen. Before you push, Undo takes the commit back. After you push, use Revert. Revert adds a new commit that reverses the old one, and the history keeps both.", board: [
    { gap: true },
    { hand: "before the push: Undo", at: "Before you push" },
    { hand: "after the push: Revert (a new commit)", at: "After you push" }] },
  { say: "And remember why we write code at all. The steps are written down, they run in order, and they run again on new data.", board: [
    { gap: true }, { hand: "code: written down, in order, rerun on new data", color: "blue", at: "The steps" }] },
] },

{ id: "import", segs: [
  { say: "Your markdown lives in the markdowns folder, and your files live in the data folder. So a path starts with dot dot, slash, data. Go up one folder, then into data.", board: [
    { hand: "project/", big: true },
    { hand: "markdowns/   class05.Rmd", indent: 1, at: "markdowns folder" },
    { hand: "data/   occupation.xlsx", indent: 1, at: "data folder" },
    { code: '"../data/occupation.xlsx"', at: "So a path" },
    { hand: ".. means go up one folder", color: "blue", at: "Go up" }] },
  { say: "Knitting starts from the markdown's folder. The Console starts from the project folder. That is why the same line can work in one and fail in the other.", board: [
    { gap: true },
    { hand: "Knit starts in markdowns/", at: "Knitting" },
    { hand: "the Console starts in project/", at: "The Console" }] },
  { say: "Three readers. Read C S V, from reader, reads a web address or a local file.", board: [
    { page: true }, { hand: "Three readers", big: true, color: "red" },
    { code: "readr::read_csv(file = ...)", at: "Read C S V" }] },
  { say: "Read excel, from read X L, needs a file on disk: give it the path, the sheet, and skip, for the rows above the header. Forget skip, and the title becomes one giant column name.", board: [
    { code: 'readxl::read_excel(path = ..., sheet = "Table 1.4", skip = 1)' },
    { hand: "no skip: the title becomes the column name", color: "blue", at: "Forget skip" }] },
  { say: "From JSON, from JSON lite, reads JSON, and it often comes back as a list.", board: [{ code: "jsonlite::fromJSON(json_url)" }] },
  { say: "Always run glimpse on what you imported.", board: [{ code: "dplyr::glimpse(crashes_json)   # always look" }] },
  { say: "To pull one piece out: single brackets keep the container. Double brackets, and the dollar sign, open it.", board: [
    { gap: true },
    { code: 'job["salary"]      # keeps the container', at: "single brackets" },
    { code: 'job[["salary"]]    # opens it', at: "Double brackets" },
    { code: "job$salary$max", at: "the dollar sign" }] },
] },

{ id: "querychat", segs: [
  { say: "The Job Scout app turns a question in plain English into an answer from a database. Two actors do the work. The language model writes SQL. The database runs it.", board: [
    { hand: "The Job Scout app", big: true, color: "red" },
    { row: ["your question", "model writes SQL", "database runs it"], at: "Two actors" }] },
  { say: "The model receives your question, and a description of the table: column names, types, and ranges. It never receives the rows.", board: [
    { gap: true },
    { hand: "the model sees: column names, types, ranges", at: "a description of the table" },
    { hand: "the model never sees the rows", color: "red", at: "It never receives" }] },
  { say: "So the model has not seen your data, and it does not know the answer. It returns a query, and you can read that query. Read it before you trust the table.", board: [
    { gap: true },
    { hand: "read the SQL before you trust the table", color: "blue", at: "Read it before" }] },
  { say: "Ask how many postings are in Ohio, and the model may search for the word Ohio, when the column stores the two letters O H. That returns zero.", board: [
    { page: true }, { hand: "How many postings are in Ohio?", big: true },
    { hand: "the model searched for the word Ohio", at: "search for the word", strikeAt: "That returns zero" },
    { hand: "0 rows: the column stores OH", color: "red", at: "That returns zero" }] },
  { say: "A data dictionary fixes it: tell the model what each column means, and how it is coded.", board: [
    { gap: true },
    { hand: "data dictionary:", color: "blue" },
    { hand: "what each column means, and how it is coded", indent: 1, at: "tell the model" }] },
  { say: "Last, the key. On your computer it lives in dot R environ, which Git ignores. On Render it is an environment variable. A key in a commit is public within minutes.", board: [
    { gap: true },
    { hand: "the key: in .Renviron, ignored by Git", at: "On your computer" },
    { hand: "on Render: an environment variable", at: "On Render" },
    { hand: "never in a commit", color: "red", at: "A key in a commit" }] },
] },

{ id: "dplyr", segs: [
  { say: "Five verbs, chained with the pipe. Select keeps columns. Filter keeps rows, and the test uses two equals signs. Mutate adds a column, and never changes the number of rows. Arrange sorts. Group by, followed by summarise, collapses the table to one row per group, and N counts the rows in each group.", board: [
    { hand: "Five verbs, chained with |>", big: true, color: "red" },
    { hand: "select: keep columns", at: "Select keeps" },
    { hand: "filter: keep rows (the test uses ==)", at: "Filter keeps" },
    { hand: "mutate: add a column, same number of rows", at: "Mutate adds" },
    { hand: "arrange: sort", at: "Arrange sorts" },
    { hand: "group_by + summarise: one row per group", at: "Group by" },
    { hand: "n(): the rows in each group", at: "N counts" }] },
  { say: "In class we asked: among full-time jobs, which states have the highest remote share? Filter to full time. Group by state. Summarise the number of postings, and the mean of remote.", board: [
    { page: true },
    { code: "jobs |>" },
    { code: "  dplyr::filter(category == 'fulltime') |>", at: "Filter to full time" },
    { code: "  dplyr::group_by(location_state) |>", at: "Group by state" },
    { code: "  dplyr::summarise(", at: "Summarise" },
    { code: "    postings = dplyr::n(),", at: "the number of postings" },
    { code: "    remote_share = mean(remote) |> round(3)", at: "the mean of remote" },
    { code: "  ) |>", at: "the mean of remote" }] },
  { say: "Then one more filter: keep states with at least fifty postings, because a share from seven postings tells you very little. Arrange in descending order, and take the head.", board: [
    { code: "  dplyr::filter(postings >= 50) |>", at: "keep states" },
    { code: "  dplyr::arrange(dplyr::desc(remote_share)) |>", at: "Arrange in" },
    { code: "  head(3)", at: "take the head" }] },
  { say: "To add information from a second table, use left join. It keeps every row of the left table, and a row with no partner gets N A. Run anti join once, to see which rows found no partner.", board: [
    { page: true }, { hand: "Adding a second table", big: true, color: "red" },
    { code: 'by_state |> dplyr::left_join(states, by = "location_state")', at: "use left join" },
    { hand: "keeps every row of the left table", at: "It keeps every row" },
    { hand: "no partner: NA  (DC has no row in states)", color: "blue", at: "a row with no partner" },
    { gap: true },
    { code: 'by_state |> dplyr::anti_join(states, by = "location_state")', at: "Run anti join" },
    { hand: "shows the rows that found no partner", at: "to see which" }] },
] },

{ id: "apis", segs: [
  { say: "An A P I is a documented way to ask a server for data. Read the address like a sentence. Before the question mark: the server and the path. After it: parameters, written as name equals value, and joined by ampersands. The names come from the documentation.", board: [
    { hand: "API: a documented way to ask for data", big: true, color: "red" },
    { hand: "https://api.stlouisfed.org/fred/series/observations", at: "Before the question mark" },
    { hand: "?series_id=IHLIDXUSOH&file_type=json", indent: 1, at: "After it" },
    { hand: "before ? : the server and the path", color: "blue", at: "the server and the path" },
    { hand: "after ? : name=value, joined by &", color: "blue", at: "name equals value" }] },
  { say: "In R, we build the request with H T T R two. Request takes the address. Req U R L query adds the parameters. Nothing has been sent yet. Req perform sends it. Resp body string takes the reply as text, and from JSON turns it into a list.", board: [
    { page: true },
    { code: 'httr2::request("https://api.stlouisfed.org/...") |>', at: "Request takes" },
    { code: '  httr2::req_url_query(series_id = "IHLIDXUSOH", ...) |>', at: "Req U R L query" },
    { code: "  # nothing has been sent yet", at: "Nothing has been sent" },
    { code: "  httr2::req_perform() |>", at: "Req perform" },
    { code: "  httr2::resp_body_string() |>", at: "Resp body string" },
    { code: "  jsonlite::fromJSON()", at: "from JSON turns" }] },
  { say: "For FRED, the key is a parameter, and we read it with sys get env, so it never appears in the code. For U S A Jobs, the key goes in the headers.", board: [
    { gap: true },
    { code: 'api_key = Sys.getenv("FRED_API_KEY")', at: "we read it" },
    { hand: "USAJOBS: the key goes in the headers", at: "For U S A Jobs" }] },
  { say: "The server answers with a status code. Two hundred means it worked. A code that starts with four means: fix your request. Four oh one means: check your key.", board: [
    { page: true }, { hand: "Status codes", big: true, color: "red" },
    { hand: "200: it worked", at: "Two hundred" },
    { hand: "4xx: fix your request", at: "A code that starts" },
    { hand: "401: check your key", color: "red", at: "Four oh one" }] },
  { say: "Then find the table inside the list, and fix the types.", board: [
    { gap: true },
    { code: "ohio_df = ohio_jobs$observations", at: "find the table" },
    { code: "ohio_df |> dplyr::mutate(date = lubridate::ymd(date))", at: "fix the types" }] },
] },

{ id: "scraping", segs: [
  { say: "When a site has no A P I, we read the page itself. First, permission. Paths allowed checks robots dot T X T for one path. The terms of service count too.", board: [
    { hand: "1. Permission", big: true, color: "red", at: "First, permission" },
    { code: 'robotstxt::paths_allowed(paths = "...", domain = "...")', at: "Paths allowed" },
    { hand: "and read the terms of service", color: "blue", at: "The terms of service" }] },
  { say: "Then three steps with R vest. Read H T M L downloads the page. H T M L elements picks the pieces, with a C S S selector. H T M L text two returns their text.", board: [
    { gap: true }, { hand: "2. Three steps with rvest", big: true, color: "red" },
    { code: "isa_page_in_r = rvest::read_html(url)", at: "Read H T M L" },
    { code: 'isa_page_in_r |> rvest::html_elements(".courseblockdesc") |>', at: "H T M L elements" },
    { code: "  rvest::html_text2() -> isa_descs", at: "H T M L text two" }] },
  { say: "To find a selector: right-click, Inspect, and copy the selector. Or use Selector Gadget.", board: [
    { hand: "selector: Inspect, or SelectorGadget", color: "blue", at: "right-click" }] },
  { say: "One selector gives one vector. Check its length against what you see on the page. Twenty jobs should give twenty titles. If you get twenty-three, the selector is too broad.", board: [
    { page: true }, { hand: "One selector, one vector", big: true, color: "red" },
    { code: "length(isa_titles)   # as many as on the page?", at: "Check its length" },
    { hand: "20 jobs but 23 titles: the selector is too broad", color: "blue", at: "If you get" }] },
  { say: "Put the vectors side by side with data frame.", board: [
    { code: "isa_df = data.frame(title = isa_titles, description = isa_descs)", at: "side by side" }] },
  { say: "For many pages, look at how the address changes. Build each address with paste zero, and repeat the scrape in a for loop. Or write your own function, and use map D F. Pause one second between requests with sys sleep.", board: [
    { gap: true }, { hand: "Many pages", big: true, color: "red" },
    { code: 'dept_url = paste0(".../courses-instruction/", dept_name, "/")', at: "Build each address" },
    { code: "for (dept_name in dept_abbr) { ... }", at: "a for loop" },
    { code: "purrr::map_df(.x = my_urls, .f = scrape_mu_bulletin)", at: "map D F" },
    { code: "Sys.sleep(1)   # between requests", at: "Pause one second" }] },
] },

{ id: "llm", segs: [
  { say: "Sometimes the value you need has no tag and no field name. It sits inside a sentence, like a prerequisite inside a course description. A selector cannot reach it. A language model can.", board: [
    { hand: "No tag, no field name", big: true, color: "red" },
    { hand: "the value sits inside a sentence", at: "It sits inside" },
    { hand: "(a prerequisite inside a course description)", indent: 1, at: "like a prerequisite" },
    { hand: "a selector cannot reach it. A language model can.", color: "blue", at: "A selector cannot" }] },
  { say: "With the elmer package, we start a chat with chat open A I. Then chat structured takes two things: the text, and a description of what we want back.", board: [
    { page: true },
    { code: "chat = ellmer::chat_openai(model = ...)", at: "chat open A I" },
    { code: "course_info = chat$chat_structured(", at: "Then chat structured" },
    { code: "  isa125_text,", at: "the text" }] },
  { say: "That description is type object, with one entry per column. Each entry has a type, such as type string, and a description. The description is your instruction to the model, so write it carefully.", board: [
    { code: "  type = ellmer::type_object(", at: "type object" },
    { code: '    name = ellmer::type_string(description = "..."),', at: "type string" },
    { code: '    prereqs = ellmer::type_string("...")', at: "and a description" },
    { code: "  )", at: "and a description" },
    { code: ")", at: "and a description" },
    { hand: "the description is your instruction to the model", color: "blue", at: "The description is your" }] },
  { say: "What comes back has exactly those fields. That is all it guarantees. A schema fixes the shape of the answer, not its correctness. The same code can return different text on a second run, and each run costs money.", board: [
    { page: true }, { hand: "What a schema guarantees", big: true, color: "red" },
    { hand: "the fields you asked for: yes", at: "exactly those fields" },
    { hand: "correct values: no", color: "red", at: "not its correctness" },
    { hand: "a second run can differ, and each run costs money", at: "The same code" }] },
  { say: "So check a sample against the page. And if a selector, or one line of code, can do the job, use that instead.", board: [
    { gap: true },
    { hand: "check a sample against the page", color: "blue", at: "check a sample" },
    { hand: "if a selector can do the job, use the selector", at: "And if a selector" }] },
] },

{ id: "tidy", segs: [
  { say: "Two definitions. Tidy is about shape: each variable is a column, each observation is a row, each value is a cell.", board: [
    { hand: "Tidy = shape", big: true, color: "red", at: "Tidy is about" },
    { row: ["variable = column", "observation = row", "value = cell"], arrows: false, at: "each variable" }] },
  { say: "Technically correct is about names and types: names you can type without quotes, and each column stored as the type that matches what it holds.", board: [
    { gap: true }, { hand: "Technically correct = names + types", big: true, color: "red" },
    { hand: "names you can type without quotes", at: "names you can type" },
    { hand: "each column stored as the right type", at: "each column stored" }] },
  { say: "The crash table broke both. One cell held sixty-seven, slash, sixty-seven, and zero in parentheses. Three numbers in one cell.", board: [
    { gap: true },
    { code: '"67/67(0)"', at: "One cell held" },
    { hand: "three numbers in one cell", color: "blue", at: "Three numbers" }] },
  { say: "Separate, from tidy R, splits it. Give it the column, and into, with the three new names.", board: [
    { page: true },
    { code: "df |> tidyr::separate(fatalities," },
    { code: '  into = c("air_fatalities", "passengers", "ground"))', at: "and into" }] },
  { say: "Without sep, it cuts at every character that is not a letter or a number. So it finds four pieces, and warns that one was discarded. That piece is empty, so the result is fine.", board: [
    { row: ["67", "67", "0", "(empty)"], arrows: false, at: "it cuts at" },
    { hand: "4 pieces, 3 names: a warning, and the result is fine", color: "blue", at: "So it finds" }] },
  { say: "For location and operator, we set sep to the line break.", board: [
    { gap: true },
    { code: 'tidyr::separate(location_operator, into = c(...), sep = "\\n")', at: "we set sep" }] },
  { say: "Now the table is tidy, but every column is text. Inside mutate, D M Y turns the date into a date, and across, with as integer, converts the three counts. Then glimpse, to confirm.", board: [
    { page: true }, { hand: "Tidy, but every column is text", big: true, color: "red" },
    { code: "crash_clean = df |>", at: "Inside mutate" },
    { code: "  dplyr::mutate(", at: "Inside mutate" },
    { code: "    date = lubridate::dmy(date),", at: "D M Y turns" },
    { code: "    dplyr::across(c(air_fatalities, passengers, ground),", at: "and across" },
    { code: "                  as.integer)", at: "as integer" },
    { code: "  )", at: "as integer" },
    { code: "dplyr::glimpse(crash_clean)", at: "Then glimpse" }] },
] },
];
