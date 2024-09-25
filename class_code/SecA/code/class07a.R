

# * Kahoot ----------------------------------------------------------------

df = readr::read_rds("data/phi_hat_tbl.rds")

robotstxt::paths_allowed(domain = "https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507")
robotstxt::paths_allowed(paths = 'football/article', domain = 'www.rotowire.com')

"https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507" |> 
  rvest::read_html() |> rvest::html_element('table') |> rvest::html_table() -> el

"https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507" |> 
  rvest::read_html() |> rvest::html_elements('table') |> rvest::html_table() -> els

els_a = els[[1]] 

"https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507" |> 
  rvest::read_html() |> rvest::html_elements('table') |> rvest::html_table() |> 
  magrittr::extract2(1) -> els_b



# * AccuWeather API -------------------------------------------------------

city_request = jsonlite::fromJSON("http://dataservice.accuweather.com/locations/v1/cities/search?apikey=mDyIYQMWJGLgEiAmGkEIlkoS3I4JYAwo&q=Oxford%2C%20OH")
city_request$Key


forecast_data = jsonlite::fromJSON("http://dataservice.accuweather.com/forecasts/v1/daily/5day/340019?apikey=mDyIYQMWJGLgEiAmGkEIlkoS3I4JYAwo")

forecast_df = forecast_data$DailyForecasts |> jsonlite::flatten()
forecast_df
