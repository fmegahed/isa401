

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



# * Crypto Compare API ----------------------------------------------------

# needs to either be in your R project
cc_key = Sys.getenv('api_key') # altern. you can just paste your key here in ""
# e.g.
# cc_key = 'ABCDEF'

base_url = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=10&api_key="

full_url = paste0(base_url, cc_key)

btc_data = jsonlite::fromJSON(full_url)

btc_df = btc_data$Data$Data # based on viewing the output we knew the names of the sublists

# based on viewing the output, we knew that the first data is sublist 6
# within that sublist 6, the fourth element contained our data frame
btc_df2 = btc_data[[6]][[4]] 




# * JASMY Example ---------------------------------------------------------

# I will use an alternative library to do this; just to help you out in case you use an AI tool

# these are the query parameters for your API
params = list(
  fsym = "JASMY",
  tsym = "USD",
  limit = 100,
  api_key = cc_key
)
params

# api's main URL (ends with which part of the API we are calling)
cc_base_url = "https://min-api.cryptocompare.com/data/v2/histoday"

response = httr::GET(url = cc_base_url,  query = params)

dplyr::glimpse(response)

jasmy_data = httr::content(response)

jasmy_df = jasmy_data$Data$Data |> dplyr::bind_rows()


# * JASMY 2 ---------------------------------------------------------------

jasmy_base_url = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=JASMY&tsym=USD&limit=100&api_key="

jasmy_full_url = paste0(jasmy_base_url, cc_key)

jasmy_df2 = jsonlite::fromJSON(jasmy_full_url)$Data$Data

jasmy_df2$time |> head() # this is UNIX time (number of seconds since Jan 1, 1970)

jasmy_df2$time |> lubridate::as_datetime() |> lubridate::as_date() -> jasmy_df2$time

dplyr::glimpse(jasmy_df2)