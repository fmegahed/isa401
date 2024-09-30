

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

# from the location key, I can use that to craft my forecast request
forecasts = jsonlite::fromJSON(
  "http://dataservice.accuweather.com/forecasts/v1/daily/5day/340019?apikey=%09mDyIYQMWJGLgEiAmGkEIlkoS3I4JYAwo"
  )

dplyr::glimpse(forecasts)

# we needed to flatten to make this a data frame of 21 obs (similar to our view of the data)
forecasts_df = forecasts$DailyForecasts |> jsonlite::flatten()




# * BTC: Approach 1 (using jsonlite) --------------------------------------

# One change; I do not want to share my api_key with you
# cc_key = "" # one option
# what we will do is we will store this as an env variable
cc_key = Sys.getenv('cc_api_key')

# specifically for this call
cc_base = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=10&api_key="
cc_full_url = paste0(cc_base, cc_key)

btc_data = jsonlite::fromJSON(cc_full_url)

btc_df = btc_data$Data$Data

# we will overwrite time with something that we can understand
btc_df$time |> lubridate::as_datetime() |> lubridate::as_date() -> btc_df$time

dplyr::glimpse(btc_df)



# * BTC (Approach 2 using httr) -------------------------------------------

# without the question mark and the query parameters
cc_true_base = "https://min-api.cryptocompare.com/data/v2/histoday"

# these are the four parameters that we need for this call
# the names of the sublists have to match the API (order does not)
params = list(
  fsym = "BTC",
  tsym = 'USD',
  limit = 10,
  api_key = cc_key
)

response = httr::GET(url = cc_true_base, query = params)

btc_list = httr::content(response)
# we got a list because everything was a list on how that parsed
# so the dplyr::bind_rows() will convert the list of 9 items into a row of data
# obviously will only work if all sublists had the same 9 items
btc_df2 = btc_list$Data$Data |> dplyr::bind_rows()
