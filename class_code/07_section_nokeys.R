

# * Demo 2: Accuweather ---------------------------------------------------
pacman::p_load(tidyverse, jsonlite)

source('data/accuweather_key.R')

accu_url = 
  paste0(
    "http://dataservice.accuweather.com/forecasts/v1/daily/5day/340019?apikey=",
    accu_key
  )

ox_json = fromJSON(accu_url)
ox_forecasts = ox_json[[2]]



# * Demo 3: Cyrptocompare API ---------------------------------------------
pacman::p_load(lubridate)

pacman::p_load(tidyverse, jsonlite, lubridate)

source(file = 'data/cryptocompare_key.R')

# the URL
base_call = 'https://min-api.cryptocompare.com/data/v2/histoday?fsym=SHIB&tsym=USD&limit=99&api_key='
full_request = paste0(base_call, cc_key)

shib_data = fromJSON(txt = full_request)
shib_data

shib_df = shib_data$Data$Data
shib_df2 = shib_data[[6]][[4]]

shib_df
str(shib_df)

# To convert the time to a date
time_to_date = as_date( as_datetime(shib_df$time) ) # sanity check

shib_df$date = as_date( as_datetime(shib_df$time) )


