# Class 19 lab data.
# Part I: a weekly Ohio extract of the Class 18 COVID file and the Ohio county boundaries, small
#   enough to upload to any AI chat tool.
# Parts II and III: Indeed job postings by occupation (FRED) and BLS OEWS May 2025 wages.
#   "C:/Program Files/R/R-4.6.1/bin/Rscript.exe" make_data.R   (run from lectures/19_lab_ai_maps)
# Needs FRED_API_KEY in the course .Renviron; the BLS v1 API needs no key (25 requests a day).

readRenviron("../../.Renviron")

covid = readr::read_csv("../../data/covid_cases_county.csv", show_col_types = FALSE)

# one row per county per week (Saturdays; the file ends on Saturday 2022-12-31)
ohio_weekly = covid |>
  dplyr::filter(state == "Ohio", weekdays(date) == "Saturday") |>
  dplyr::arrange(county, date)

stopifnot(dplyr::n_distinct(ohio_weekly$county) == 88,
          max(ohio_weekly$date) == as.Date("2022-12-31"))

readr::write_csv(ohio_weekly, "../../data/ohio_covid_weekly.csv")

# county outlines from the Census cartographic boundary file (20m resolution keeps the file small)
ohio_counties = tigris::counties(state = "OH", cb = TRUE, resolution = "20m", year = 2023,
                                 progress_bar = FALSE) |>
  dplyr::select(NAMELSAD, NAME, GEOID) |>
  sf::st_transform(4326)

stopifnot(nrow(ohio_counties) == 88,
          setequal(ohio_counties$NAMELSAD, unique(ohio_weekly$county)))

out = "../../data/ohio_counties.geojson"
if (file.exists(out)) file.remove(out)
sf::st_write(ohio_counties, out, driver = "GeoJSON", quiet = TRUE,
             layer_options = c("COORDINATE_PRECISION=5", "RFC7946=YES"))


# ---- Part II (Flourish bar chart race): Indeed job postings by occupation, Feb 2020 = 100 ----
fredr::fredr_set_key(Sys.getenv("FRED_API_KEY"))

occupations = c(IHLIDXUSTPACCO = "Accounting", IHLIDXUSTPBAFI = "Banking and Finance",
                IHLIDXUSTPCUSTSERV = "Customer Service", IHLIDXUSTPHUMARESO = "Human Resources",
                IHLIDXUSTPINSU = "Insurance", IHLIDXUSTPITOPHE = "IT Operations and Helpdesk",
                IHLIDXUSTPMANA = "Management", IHLIDXUSTPMARK = "Marketing",
                IHLIDXUSTPMATH = "Mathematics", IHLIDXUSTPPROJMANA = "Project Management",
                IHLIDXUSTPSALE = "Sales", IHLIDXUSTPSOFTDEVE = "Software Development")

postings = lapply(names(occupations), function(id) {
  fredr::fredr(series_id = id, observation_start = as.Date("2020-02-01"),
               frequency = "m", aggregation_method = "avg")
}) |>
  dplyr::bind_rows() |>
  dplyr::mutate(occupation = occupations[series_id], value = round(value, 1))

# keep complete months only, then one column per month (the wide shape Flourish expects)
last_month = max(postings$date[postings$date < lubridate::floor_date(Sys.Date(), "month")])
postings_wide = postings |>
  dplyr::filter(date <= last_month) |>
  dplyr::arrange(date) |>
  dplyr::mutate(month = format(date, "%b %Y")) |>
  dplyr::select(occupation, month, value) |>
  tidyr::pivot_wider(names_from = month, values_from = value) |>
  dplyr::rename(Occupation = occupation)

stopifnot(nrow(postings_wide) == 12, !anyNA(postings_wide))
readr::write_csv(postings_wide, "../../data/indeed_postings_by_occupation.csv")


# ---- Parts II and III: BLS OEWS May 2025 wages, U.S. and Ohio (BLS public API v1) ----
soc = c("11-2021" = "Marketing Managers", "11-3021" = "Computer and Information Systems Managers",
        "11-3031" = "Financial Managers", "11-3121" = "Human Resources Managers",
        "13-1071" = "Human Resources Specialists", "13-1081" = "Logisticians",
        "13-1082" = "Project Management Specialists", "13-1111" = "Management Analysts",
        "13-1161" = "Market Research Analysts and Marketing Specialists",
        "13-2011" = "Accountants and Auditors", "13-2051" = "Financial and Investment Analysts",
        "13-2052" = "Personal Financial Advisors", "13-2061" = "Financial Examiners",
        "15-1211" = "Computer Systems Analysts", "15-1212" = "Information Security Analysts",
        "15-1221" = "Computer and Information Research Scientists",
        "15-1242" = "Database Administrators", "15-1243" = "Database Architects",
        "15-1252" = "Software Developers", "15-2031" = "Operations Research Analysts",
        "15-2041" = "Statisticians", "15-2051" = "Data Scientists",
        "41-3031" = "Securities, Commodities, and Financial Services Sales Agents")

# OEWS series id: OEU + area type + area + industry + occupation + data type
# data types: 01 employment, 12 annual 25th percentile, 13 annual median, 14 annual 75th percentile
series = dplyr::bind_rows(
  tidyr::expand_grid(area = "us", code = names(soc), type = c("01", "12", "13", "14")),
  tidyr::expand_grid(area = "oh", code = names(soc), type = c("01", "13"))) |>
  dplyr::mutate(id = paste0("OEU", ifelse(area == "us", "N0000000", "S3900000"), "000000",
                            gsub("-", "", code), type))

bls = split(series$id, ceiling(seq_along(series$id) / 25)) |>
  lapply(function(ids) {
    resp = httr2::request("https://api.bls.gov/publicAPI/v1/timeseries/data/") |>
      httr2::req_body_json(list(seriesid = ids, startyear = "2025", endyear = "2025")) |>
      httr2::req_perform() |>
      httr2::resp_body_json(check_type = FALSE)  # BLS replies as text/plain
    stopifnot(resp$status == "REQUEST_SUCCEEDED")
    lapply(resp$Results$series, function(s) {
      data.frame(id = s$seriesID,
                 value = if (length(s$data)) s$data[[1]]$value else NA_character_)
    }) |> dplyr::bind_rows()
  }) |>
  dplyr::bind_rows() |>
  # "-" means not published; "#" means at or above the top wage BLS reports
  dplyr::mutate(value = suppressWarnings(as.numeric(gsub(",", "", value))))

wages = series |>
  dplyr::left_join(bls, by = "id") |>
  dplyr::mutate(col = paste(area, type, sep = "_")) |>
  dplyr::select(code, col, value) |>
  tidyr::pivot_wider(names_from = col, values_from = value) |>
  dplyr::transmute(Occupation = soc[code], `SOC Code` = code,
                   `U.S. Employment` = us_01, `U.S. 25th Percentile ($)` = us_12,
                   `U.S. Median ($)` = us_13, `U.S. 75th Percentile ($)` = us_14,
                   `Ohio Employment` = oh_01, `Ohio Median ($)` = oh_13) |>
  dplyr::arrange(dplyr::desc(`U.S. Median ($)`))

stopifnot(nrow(wages) == length(soc), !anyNA(wages$`U.S. Median ($)`))
readr::write_csv(wages, "../../data/oews_2025_business_occupations.csv")

# Part III (Datawrapper range plot): the analytics roles only
analytics = c("15-2051", "15-2031", "15-2041", "13-1111", "13-1161", "13-2051", "15-1243", "15-1211")
wages |>
  dplyr::filter(`SOC Code` %in% analytics) |>
  dplyr::select(Occupation, `25th Percentile ($)` = `U.S. 25th Percentile ($)`,
                `Median ($)` = `U.S. Median ($)`, `75th Percentile ($)` = `U.S. 75th Percentile ($)`) |>
  readr::write_csv("../../data/oews_2025_analytics_salaries.csv")


# ---- Part II alternative (Flourish bar chart race): employment in tech and business occupations,
# May 2019 to May 2025 (BLS OEWS). Fadel asked for business analytics, information systems and
# cybersecurity jobs, which Indeed's FRED categories do not have.
# 2019-2023: BLS's national tables as archived by the Wayback Machine (bls.gov refuses scripts);
# 2024: the OEWS file in data/; 2025: the BLS API pull above (data/oews_2025_business_occupations.csv),
# so this part costs no extra BLS requests. In 2019-2020 BLS had not yet split two groups:
# Data Scientists were in 15-2098 and database administrators and architects in 15-1245.
race = tibble::tribble(
  ~Occupation,                                   ~Category,              ~code,     ~code_2019,
  "Information Security Analysts",               "Cybersecurity",        "15-1212", "15-1212",
  "Computer and Information Systems Managers",   "Information systems",  "11-3021", "11-3021",
  "Computer Systems Analysts",                   "Information systems",  "15-1211", "15-1211",
  "Database Administrators and Architects",      "Information systems",  "15-1242+15-1243", "15-1245",
  "Data Scientists",                             "Business analytics",   "15-2051", "15-2098",
  "Operations Research Analysts",                "Business analytics",   "15-2031", "15-2031",
  "Statisticians",                               "Business analytics",   "15-2041", "15-2041",
  "Management Analysts",                         "Business analytics",   "13-1111", "13-1111",
  "Market Research Analysts and Marketing Specialists", "Business analytics", "13-1161", "13-1161",
  "Accountants and Auditors",                    "Business",             "13-2011", "13-2011")
codes_of = function(x) strsplit(x, "+", fixed = TRUE)[[1]]

wayback_table = function(year) {
  page = paste0("bls.gov/oes/", year, "/may/oes_nat.htm")
  snap = httr2::request("https://archive.org/wayback/available") |>
    httr2::req_url_query(url = page, timestamp = paste0(year, "1231")) |>
    httr2::req_retry(max_tries = 6) |>   # the archive answers 429 when asked too fast
    httr2::req_perform() |>
    httr2::resp_body_json()
  # "id_" after the timestamp gives the page as archived, without the Wayback banner
  raw = sub("/https://", "id_/https://", snap$archived_snapshots$closest$url, fixed = TRUE)
  # httr2 cannot parse the archive's addresses (they contain a second https://), so rvest fetches
  # the page, with a few patient retries
  page_html = NULL
  for (i in 1:6) {
    page_html = tryCatch(rvest::read_html(raw), error = function(e) NULL)
    if (!is.null(page_html)) break
    Sys.sleep(2^i)
  }
  stopifnot(!is.null(page_html))
  tb = page_html |> rvest::html_element("table") |> rvest::html_table()
  tibble::tibble(code = tb[[1]], emp = readr::parse_number(as.character(tb[[4]]), na = c("", "-", "**")))
}
emp_for = function(tb, codes) { v = tb$emp[match(codes, tb$code)]; if (anyNA(v)) NA_real_ else sum(v) }

years = list()
for (y in 2019:2023) {
  tb = wayback_table(y)
  Sys.sleep(2)
  col = if (y <= 2020) race$code_2019 else race$code
  years[[as.character(y)]] = sapply(col, function(x) emp_for(tb, codes_of(x)))
}
oews24 = readxl::read_excel("../../data/all_data_M_2024.xlsx") |>
  dplyr::filter(AREA_TYPE == 1, NAICS == "000000") |>
  dplyr::transmute(code = OCC_CODE, emp = suppressWarnings(as.numeric(TOT_EMP)))
years[["2024"]] = sapply(race$code, function(x) emp_for(oews24, codes_of(x)))

oews25 = readr::read_csv("../../data/oews_2025_business_occupations.csv", show_col_types = FALSE) |>
  dplyr::transmute(code = `SOC Code`, emp = `U.S. Employment`)
years[["2025"]] = sapply(race$code, function(x) emp_for(oews25, codes_of(x)))

employment = dplyr::bind_cols(race[, c("Occupation", "Category")], tibble::as_tibble(years))
stopifnot(nrow(employment) == 10, !anyNA(employment))
readr::write_csv(employment, "../../data/oews_employment_tech_business.csv")
