

# * Kahoot ----------------------------------------------------------------

df = readr::read_rds("data/phi_hat_tbl.rds")

robotstxt::paths_allowed(paths = "https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507")

webpage = rvest::read_html(
  "https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507"
  )

webpage |> rvest::html_element("table") |> rvest::html_table() -> singular
webpage |> rvest::html_elements("table") |> rvest::html_table() -> pl

pl_to_df = pl[[1]]




# * Crypto Compare API ----------------------------------------------------

full_request_url = "https://data-api.coindesk.com/index/cc/v1/historical/days?market=cadli&instrument=BTC-USD&limit=101&api_key=ff593c160dddb412914538d8414afa53c93609d4343103a4a4617c316f887697"


# using the JSON output (default)

# [1] Read it as JSON

crypto_data = jsonlite::fromJSON(full_request_url)

names(crypto_data)

crypto_df = crypto_data$Data # same as saying crypto_data[[1]] or crypto_data[['Data']]

crypto_df$TIMESTAMP = lubridate::as_datetime(crypto_df$TIMESTAMP) |> lubridate::as_date()


# [2] Read it as a CSV
crypto_df_csv = readr::read_csv( paste0(full_request_url, "&response_format=CSV")  )


# Using HTTR

base_url = "https://data-api.coindesk.com/index/cc/v1/historical/days?"

params = list(
  market= "cadli",
  instrument = "BTC-USD",
  limit = 100
)

resp = httr::GET(base_url, query = params)

crypto = httr::content(resp) # identical to crypto_data

# clean it as above
