

# * Kahoot ----------------------------------------------------------------

x_vec = rnorm(n = 5)

temp = c('ISA', 401)


df = readr::read_rds("data/phi_hat_tbl.rds")

robotstxt::paths_allowed(domain = "https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507") # not my fav approach
robotstxt::paths_allowed(paths = "football/article/", domain = "https://www.rotowire.com/") # preferred; no warnings


"https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507" |> 
  rvest::read_html() |> 
  rvest::html_element("table") |> 
  rvest::html_table() -> element

"https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507" |> 
  rvest::read_html() |> 
  rvest::html_elements("table") |> 
  rvest::html_table() -> elements

elements_a = elements[[1]]
elements_b = elements |> magrittr::extract2(1)



# * Accuweather API -------------------------------------------------------

location = jsonlite::fromJSON("http://dataservice.accuweather.com/locations/v1/cities/search?apikey=mDyIYQMWJGLgEiAmGkEIlkoS3I4JYAwo&q=Oxford%20Ohio")
