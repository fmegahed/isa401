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

# my request URL from the documentation, with my cc_key appended
request_url = paste0('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD,JPY,EUR&api_key=',
                     cc_key)

# used my observation that the API is returning a JSON object
# so I am reading the JSON from the web based on the fromJSON()
btc_3conversions = fromJSON(request_url)

# Optional if you wanted to clean this
#------------------------------------------------------------------------------
btc_3conversions = unlist(btc_3conversions, 
                          recursive = F) # set to False as I wanted to keep the names

# from the named vector, I pull the names using the base R names()
# values are just the values in the newly created numeric vector
btc_single_tibble = tibble(name = names(btc_3conversions),
                           price = btc_3conversions)

# ------------------------------------------------------------------------------


# * Getting 101 Days of Shib ----------------------------------------------

request_url = paste0('https://min-api.cryptocompare.com/data/v2/histoday?fsym=SHIB&tsym=USD&limit=100&api_key=',
                     cc_key)

shib_list = fromJSON(request_url)
shib_list %>% glimpse() # showing the str of the list

shib_tibble = shib_list$Data$Data # based on the fact that we have a Data df under the data sublist
shib_tibble_2 = shib_list[['Data']][['Data']] # an alternative approach to the line above

# Not piping per the request in class
shib_tibble$time = as_datetime(shib_tibble$time)
class(shib_tibble$time) # technically a date time object 
shib_tibble$time = as_date(shib_tibble$time)
shib_tibble$time # printing this (no UTC in the output)


