# Two more stand-in maps for live rubric tests (not deployed):
#   rubric_bad.png   sums the weekly running totals, default ggplot look, generic title
#   rubric_good.png  cases per 100k on a sequential scale, Butler outlined and labeled, source caption
#   "C:/Program Files/R/R-4.6.1/bin/Rscript.exe" make_rubric_maps.R   (run from tests/shots)
library(ggplot2)
cty = sf::st_read("../../../../data/ohio_counties.geojson", quiet = TRUE)
wk = readr::read_csv("../../../../data/ohio_covid_weekly.csv", show_col_types = FALSE)

summed = wk |> dplyr::group_by(county) |> dplyr::summarise(total = sum(confirmed_cases))
bad = dplyr::left_join(cty, summed, by = c("NAMELSAD" = "county"))
p_bad = ggplot(bad) + geom_sf(aes(fill = total)) + labs(title = "COVID in Ohio")
ggsave("rubric_bad.png", p_bad, width = 8, height = 6, dpi = 120, bg = "white")

last = wk |>
  dplyr::filter(date == max(date)) |>
  dplyr::mutate(rate = confirmed_cases / population * 1e5)
good = dplyr::left_join(cty, last, by = c("NAMELSAD" = "county"))
butler = dplyr::filter(good, NAME == "Butler")
p_good = ggplot(good) +
  geom_sf(aes(fill = rate), color = "white", linewidth = 0.2) +
  geom_sf(data = butler, fill = NA, color = "#C3142D", linewidth = 1.2) +
  geom_sf_label(data = butler, aes(label = "Butler: 29,627"), nudge_x = -0.9, size = 3.6, fontface = "bold") +
  scale_fill_distiller(palette = "Blues", direction = 1, name = "Cases per\n100,000 residents", labels = scales::comma) +
  labs(title = "Butler County's cumulative COVID-19 rate was close to Ohio's",
       subtitle = "Confirmed cases per 100,000 residents by county, March 2020 to December 2022",
       caption = "Source: weekly county data (ohio_covid_weekly.csv), ISA 401") +
  theme_void(base_size = 12) +
  theme(plot.title = element_text(face = "bold"))
ggsave("rubric_good.png", p_good, width = 8, height = 6, dpi = 120, bg = "white")
