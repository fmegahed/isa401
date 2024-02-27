

# * Accuweather API -------------------------------------------------------

weather_api_key = 'put_key_here'

# optional: seeing how the locations result looks like in R
# being lazy, I will just use the request I got from the cURL tab in
# the API

location_result = jsonlite::fromJSON(
  "http://dataservice.accuweather.com/locations/v1/cities/search?apikey=",
  # optional, but it always us to move from a nested data frame to a data frame where every col has a single col
    flatten = T # in plain English, we can now have 36 cols in our global env instead of the 15 we had
  )

location_result$Key # this information was very clear in the browser so we do not really to run it in R

# from this step, we will use the Key in the Forecast API 
# per https://developer.accuweather.com/apis

forecast_results = jsonlite::fromJSON(
  "http://dataservice.accuweather.com/forecasts/v1/daily/5day/340019?apikey=",
  flatten = T
)

# shows the contents of the list
dplyr::glimpse(forecast_results)

# from that output (or by just clicking on the arrow next to the list in your global env)
# we know that our data is going to be in the second sublist, which is a data frame
# named DailyForecasts

forecasts_df1 = forecast_results$DailyForecasts
forecasts_df2 = forecast_results[[2]]
forecasts_df3 = forecast_results[['DailyForecasts']]



# * CC API ----------------------------------------------------------------

cc_key = 'put_key_here'

cc_request = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=SHIB&tsym=USD&limit=100&api_key="

crypto_lst = jsonlite::fromJSON(cc_request)
names(crypto_lst) # an alternative to str or dplyr::glimpse --> will only give me the names of the sublists

# naming conventions for that API are not great
# so within crypto_lst we have a sublist that is called 'Data'
# within Data we have a data frame that is called 'Data'
# first [['Data']] -> gets you the sublist and then we add the 2nd [['Data']]
# we get the data frame
crypto_df = crypto_lst[['Data']][['Data']]

dplyr::glimpse(crypto_df)

crypto_df = crypto_df |> 
  dplyr::mutate(
    datetime = lubridate::as_datetime(time),
    date = lubridate::as_date(datetime)
  )

tail(crypto_df)
