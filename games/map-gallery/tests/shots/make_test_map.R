# A stand-in student map for browser tests of the submit screen (not deployed).
#   "C:/Program Files/R/R-4.6.1/bin/Rscript.exe" make_test_map.R   (run from tests/shots)
library(ggplot2)
cty = sf::st_read("../../../../data/ohio_counties.geojson", quiet = TRUE)
wk = readr::read_csv("../../../../data/ohio_covid_weekly.csv", show_col_types = FALSE)
last = wk |>
  dplyr::filter(date == max(date)) |>
  dplyr::mutate(rate = confirmed_cases / population * 1e5)
m = dplyr::left_join(cty, last, by = c("NAMELSAD" = "county"))
p = ggplot(m) +
  geom_sf(aes(fill = rate), color = "white", linewidth = 0.2) +
  geom_sf(data = dplyr::filter(m, NAME == "Butler"), fill = NA, color = "black", linewidth = 1.1) +
  scale_fill_gradient2(midpoint = 28296, low = "#2166ac", mid = "#f7f7f7", high = "#b2182b", name = "Cases per 100k") +
  labs(title = "Butler County ran just above Ohio's rate",
       subtitle = "COVID-19 cases per 100,000 residents, through Dec 31, 2022",
       caption = "Source: ohio_covid_weekly.csv") +
  theme_void(base_size = 13)
ggsave("test_map.png", p, width = 8, height = 6, dpi = 120, bg = "white")
