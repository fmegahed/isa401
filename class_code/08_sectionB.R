# Code written in class on Feb 16, 2022
## Introduction to APIs


# * Loading the required packages -----------------------------------------
if(require(pacman)== FALSE) install.packages("pacman")
pacman::p_load(tidyverse, 
               tidycensus, # for getting the census data
               httr, jsonlite, # pkgs that we might use for API,
               janitor, # for making a column name from row 1
               lubridate, # Fadel's fav time pkg in R
               magrittr) # has some pipe and extract functions that we may use



# * Crypto Compare Example for Single Coin --------------------------------

cc_key = '' # Insert your key here

request_url = paste0('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD,JPY,EUR,EGP,ETH&api_key=',
                     cc_key)

btc_price = fromJSON(request_url) # from the browser this looked like a JSON object


# Optional if you wanted to clean this
#------------------------------------------------------------------------------
btc_price_vec = btc_price %>% unlist() # unlist is from base R

# create a tibble containing two columns (one for currency name and the other 
# for price)
btc_price_tibble = tibble(currency = names(btc_price_vec),
                          price = btc_price_vec)

# ------------------------------------------------------------------------------


# * Getting 101 Days of Shib ----------------------------------------------

request_url2 = paste0('https://min-api.cryptocompare.com/data/v2/histoday?fsym=SHIB&tsym=USD&limit=99&api_key=',
                     cc_key)

shib_list = fromJSON(request_url2)
glimpse(shib_list) # seeing what is in the list (should mimic the str we talked about)

shib_df = shib_list$Data$Data # by observing the glimpse (from the API)

# Making the time understandable
shib_df$time %<>% # following two functions come from lubridate
  as_datetime() %>% # will make it a human readable date time object (defaults to UTC)
  as_date()
