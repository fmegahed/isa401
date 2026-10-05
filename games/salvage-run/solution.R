# Salvage Run: instructor key (ISA 401, Class 11, Web Scraping II)
# Every stage, the way we want students to solve it. Run top to bottom.
# To test against the local dev server: Sys.setenv(SALVAGE_BASE = "http://localhost:4010")

base = Sys.getenv("SALVAGE_BASE", "https://isa401-salvage.vercel.app")

# ---- Stage 1: pick the right CSS selector ------------------------------------
page1 = rvest::read_html(paste0(base, "/registry?start=1"))

classes = page1 |> rvest::html_elements(".wreck .ship-class") |> rvest::html_text2()
length(classes)                                                     # 50
sum(classes == "Dreadnought")                                       # stage 1 answer

# ---- Stage 2: how does the URL change? ----------------------------------------
# Click Next: start=1 becomes start=51. start is the number of the first wreck
# on the page, so it goes up by 50 (the page size): 1, 51, 101, ..., 351.
next_href = page1 |> rvest::html_element("a.next") |> rvest::html_attr("href")
next_href                                                           # "/registry?start=51"
readr::parse_number(sub(".*start=", "", next_href)) - 1             # stage 2 answer: 50

# ---- Stage 3: a for loop over every page -------------------------------------
starts = seq(from = 1, to = 351, by = 50)
registry = vector("list", length(starts))
for (i in seq_along(starts)) {
  pg = rvest::read_html(paste0(base, "/registry?start=", starts[i]))
  registry[[i]] = data.frame(
    hull  = pg |> rvest::html_elements(".wreck .hull-id") |> rvest::html_text2(),
    class = pg |> rvest::html_elements(".wreck .ship-class") |> rvest::html_text2(),
    value = pg |> rvest::html_elements(".wreck .salvage-value") |> rvest::html_text2() |> readr::parse_number()
  )
  Sys.sleep(1)                                                      # robots.txt asks for a pause
}
registry = dplyr::bind_rows(registry)
nrow(registry)                                                      # 400
sum(registry$value[registry$class == "Dreadnought"])                # stage 3 answer

# ---- Finished early: the stage 3 scrape as a function plus map --------------
scrape_page = function(start) {
  pg = rvest::read_html(paste0(base, "/registry?start=", start))
  Sys.sleep(1)
  data.frame(
    hull  = pg |> rvest::html_elements(".wreck .hull-id") |> rvest::html_text2(),
    class = pg |> rvest::html_elements(".wreck .ship-class") |> rvest::html_text2(),
    value = pg |> rvest::html_elements(".wreck .salvage-value") |> rvest::html_text2() |> readr::parse_number()
  )
}
registry2 = purrr::map(starts, scrape_page) |> purrr::list_rbind()
identical(registry2$hull, registry$hull)                            # TRUE
