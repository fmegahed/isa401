# Real console output for the "Read the output" questions, so nothing shown to students is made up.
# Runs each snippet in R and saves what the Console would print to content/outputs.json.
#   "C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" make_outputs.R
# Run make_data.R first: the snippets read the practice files in data/.
options(width = 92, readr.show_col_types = FALSE, dplyr.summarise.inform = FALSE, cli.num_colors = 1, cli.unicode = FALSE)
here = normalizePath(".")
root = file.path(tempdir(), "project")
dir.create(file.path(root, "markdowns"), recursive = TRUE, showWarnings = FALSE)
dir.create(file.path(root, "data"), showWarnings = FALSE)
file.copy(list.files("data", full.names = TRUE), file.path(root, "data"), overwrite = TRUE)
setwd(file.path(root, "markdowns"))

# what the Console shows for a piece of code: "> " before each line of code, then its output
console = function(code, setup = NULL) {
  env = new.env(parent = globalenv())
  if (!is.null(setup)) eval(parse(text = setup), envir = env)
  res = evaluate::evaluate(code, envir = env, stop_on_error = 1L)
  out = character(0)
  for (r in res) {
    if (inherits(r, "source")) {
      src = strsplit(sub("\n$", "", r$src), "\n")[[1]]
      out = c(out, paste0(c("> ", rep("+ ", length(src) - 1)), src))
    } else if (is.character(r)) out = c(out, sub("\n$", "", r))
    else if (inherits(r, "message")) out = c(out, sub("\n$", "", conditionMessage(r)))
    else if (inherits(r, "warning")) out = c(out, "Warning message:", conditionMessage(r))
    else if (inherits(r, "error")) out = c(out, paste0("Error: ", conditionMessage(r)))
  }
  paste(out, collapse = "\n")
}

outputs = list(
  skip = console('by_state = readxl::read_excel(path = "../data/postings_by_state.xlsx", sheet = "by_state")\ndplyr::glimpse(by_state)\nas.data.frame(by_state)[1:3, 2:3]'),

  small_groups = console(
    'jobs |>\n  dplyr::filter(category == "fulltime") |>\n  dplyr::group_by(location_state) |>\n  dplyr::summarise(\n    postings = dplyr::n(),\n    remote_share = mean(remote) |> round(3)\n  ) |>\n  dplyr::arrange(dplyr::desc(remote_share)) |>\n  head(3)',
    setup = 'jobs = readr::read_csv("../data/jobs.csv")'),

  # the Class 07 join demo: postings per state, joined to a lookup of the fifty states that ships with R
  left_join = console(
    'by_state |>\n  dplyr::left_join(states, by = "location_state") |>\n  head(7)\nby_state |>\n  dplyr::anti_join(states, by = "location_state")',
    setup = 'jobs = readr::read_csv("../data/jobs.csv")
by_state = jobs |> dplyr::count(location_state, sort = T)
states = tibble::tibble(location_state = state.abb, state_name = state.name, region = as.character(state.region))'),

  lengths = console(
    'length(title)\nlength(company)\njobs_df = data.frame(title = title, company = company)',
    setup = 'jobs_page = rvest::read_html("../data/job_board.html")
jobs_page |> rvest::html_elements("h2") |> rvest::html_text2() -> title
jobs_page |> rvest::html_elements(".card .company") |> rvest::html_text2() -> company'),

  separate_warning = console(
    'crashes |>\n  tidyr::separate(fatalities, into = c("air_fatalities", "passengers", "ground")) |>\n  head(3)',
    setup = 'crashes = readr::read_csv("../data/crashes_2025.csv")')
)

setwd(here)
writeLines(jsonlite::toJSON(outputs, auto_unbox = TRUE, pretty = TRUE), "content/outputs.json", useBytes = TRUE)
for (n in names(outputs)) cat("\n=====", n, "=====\n", outputs[[n]], "\n", sep = "")
