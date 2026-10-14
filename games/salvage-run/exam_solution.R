# Exam 01 registry: instructor key (ISA 401, Fall 2026). Not deployed (see .vercelignore).
# Scrapes the exam copy of the registry the way students were taught and compares the
# result with exam_key.json. To test against the local dev server:
#   Sys.setenv(SALVAGE_BASE = "http://localhost:4010")

base = Sys.getenv("SALVAGE_BASE", "https://isa401-salvage.vercel.app")

# the page shows 40 wrecks and "Showing 1-40 of 360", so start goes 1, 41, ..., 321
starts = seq(from = 1, to = 321, by = 40)

registry = data.frame()
for (start in starts) {
  pg = rvest::read_html(paste0(base, "/exam/registry?start=", start))
  df = data.frame(
    hull   = pg |> rvest::html_elements(".wreck .hull-id") |> rvest::html_text2(),
    class  = pg |> rvest::html_elements(".wreck .ship-class") |> rvest::html_text2(),
    sector = pg |> rvest::html_elements(".wreck .sector") |> rvest::html_text2(),
    value  = pg |> rvest::html_elements(".wreck .salvage-value") |> rvest::html_text2()
  )
  registry = rbind(registry, df)
  Sys.sleep(1)   # robots.txt asks for a pause
}

dplyr::glimpse(registry)   # 360 rows; value is text such as "12.4 MCr"

# value as a number: Section A typed str_remove() then as.numeric(), Section B parse_number()
registry = registry |>
  dplyr::mutate(value = value |> stringr::str_remove(" MCr") |> as.numeric())

by_class = registry |>
  dplyr::group_by(class) |>
  dplyr::summarise(wrecks = dplyr::n(), total_value = sum(value)) |>
  dplyr::arrange(dplyr::desc(total_value))
print(by_class)

# compare with the key written by make_exam_registry.py
key = jsonlite::fromJSON("exam_key.json")
stopifnot(
  nrow(registry) == key$n,
  all(by_class$wrecks == unlist(key$count_by_class)[by_class$class]),
  all(abs(by_class$total_value - unlist(key$value_by_class)[by_class$class]) < 0.05),
  abs(sum(registry$value) - key$value_all) < 0.05
)
cat("key matches:", nrow(registry), "wrecks, total value", sum(registry$value), "MCr\n")
