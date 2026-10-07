# Practice files for the code tasks in the Exam 01 review. Run from this folder:
#   "C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" make_data.R
# Everything is real course data: the Job Scout database (data/scout.db), one FRED series,
# and the 2025 table from planecrashinfo.com. The FRED key is read from the project .Renviron.
readRenviron("../../.Renviron")
dir.create("data", showWarnings = FALSE)

# ---- Job Scout: one row per posting (dplyr task) ------------------------------------------------
con = DBI::dbConnect(RSQLite::SQLite(), "../../data/scout.db")
postings = DBI::dbReadTable(con, "scout_postings") |> tibble::as_tibble()
DBI::dbDisconnect(con)

jobs = postings |>
  dplyr::select(title, company, location_city, location_state, remote, category, posted_at)
readr::write_csv(jobs, "data/jobs.csv")

# ---- An Excel sheet with a title row above the column names (import task) -----------------------
by_state = jobs |>
  dplyr::filter(category == "fulltime", !is.na(location_state)) |>
  dplyr::group_by(location_state) |>
  dplyr::summarize(postings = dplyr::n(), remote_share = round(mean(remote), 2)) |>
  dplyr::arrange(dplyr::desc(postings)) |>
  dplyr::rename(state = location_state)

# openxlsx writes the title in row 1 and the table from row 2, so postings stays a number in Excel
wb = openxlsx::createWorkbook()
openxlsx::addWorksheet(wb, "about")
openxlsx::writeData(wb, "about", data.frame(note = c("Source: data/scout.db (ChatISA Job Scout).",
                                                   "Sheet by_state has one title row above the column names.")))
openxlsx::addWorksheet(wb, "by_state")
openxlsx::writeData(wb, "by_state", "Full-time postings by state, ChatISA Job Scout, harvested through Sep 27, 2026", startRow = 1)
openxlsx::writeData(wb, "by_state", by_state, startRow = 2)
openxlsx::saveWorkbook(wb, "data/postings_by_state.xlsx", overwrite = TRUE)

# ---- A saved job board page (scraping task) -----------------------------------------------------
esc = function(x) htmltools::htmlEscape(x)
board = postings |>
  dplyr::filter(active == 1, !is.na(apply_url), !is.na(location_state)) |>
  dplyr::arrange(dplyr::desc(posted_at)) |>
  dplyr::distinct(company, .keep_all = TRUE) |>
  head(20)
stopifnot(nrow(board) == 20)
cards = paste0(
  '  <div class="card">\n',
  '    <h2 class="title">', esc(board$title), '</h2>\n',
  '    <span class="company">', esc(board$company), '</span>\n',
  '    <span class="location">', esc(paste0(board$location_city, ", ", board$location_state)), '</span>\n',
  '    <a class="apply" href="', esc(board$apply_url), '">Apply</a>\n',
  '  </div>', collapse = "\n")
featured = paste0('    <h2>', esc(c("Resume review hours", "Career fair: Oct 21", "Interview practice in ChatISA")), '</h2>', collapse = "\n")
page = paste0(
  '<!doctype html>\n<html>\n<head><meta charset="utf-8"><title>Practice job board</title></head>\n<body>\n',
  '<h1>Practice job board</h1>\n<p>Twenty open postings from the ChatISA Job Scout database (saved Sep 27, 2026).</p>\n',
  '<aside class="featured">\n', featured, '\n</aside>\n',
  '<main>\n', cards, '\n</main>\n</body>\n</html>\n')
writeLines(page, "data/job_board.html", useBytes = TRUE)

# ---- One saved API reply (API task): Indeed job postings index for Ohio, 2026 -------------------
fred_text = httr2::request("https://api.stlouisfed.org/fred/series/observations") |>
  httr2::req_url_query(
    series_id = "IHLIDXUSOH",
    api_key = Sys.getenv("FRED_API_KEY"),
    file_type = "json",
    observation_start = "2026-01-01"
  ) |>
  httr2::req_perform() |>
  httr2::resp_body_string()
writeLines(fred_text, "data/fred_reply.json", useBytes = TRUE)
fred_reply = jsonlite::fromJSON(fred_text)

# ---- The 2025 crash table, one row per crash, cells still combined (tidy task) ------------------
crash_page = rvest::read_html("https://www.planecrashinfo.com/2025/2025.htm", encoding = "ISO-8859-1")
date = crash_page |> rvest::html_elements("tr > td:nth-child(1)") |> rvest::html_text2()
location_operator = crash_page |> rvest::html_elements("tr > td:nth-child(2) > font") |> rvest::html_text2()
fatalities = crash_page |> rvest::html_elements("tr > td:nth-child(4) > font") |> rvest::html_text2()
crashes = tibble::tibble(date, location_operator, fatalities) |>
  dplyr::slice(-1) |>
  tidyr::separate(location_operator, into = c("location", "operator"), sep = "\n")
readr::write_csv(crashes, "data/crashes_2025.csv")

# ---- numbers the content file refers to ---------------------------------------------------------
cat("jobs.csv rows:", nrow(jobs), "| fulltime:", sum(jobs$category == "fulltime"), "\n")
cat("by_state rows:", nrow(by_state), "| top:", by_state$state[1], by_state$postings[1], "\n")
cat("board first title:", board$title[1], "|", board$company[1], "\n")
cat("fred observations:", nrow(fred_reply$observations), "| any '.':", any(fred_reply$observations$value == "."),
    "| first:", fred_reply$observations$date[1], "last:", tail(fred_reply$observations$date, 1), "\n")
cat("crashes:", nrow(crashes), "| example cell:", crashes$fatalities[2], "\n")
