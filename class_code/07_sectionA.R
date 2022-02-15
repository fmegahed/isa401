# Code written in class on Feb 14, 2022
## Introduction to APIs


# * Loading the required packages -----------------------------------------
if(require(pacman)== FALSE) install.packages("pacman")
pacman::p_load(tidyverse, 
               tidycensus, # for getting the census data
               httr, jsonlite, # pkgs that we might use for API,
               janitor, # for making a column name from row 1
               magrittr) # has some pipe and extract functions that we may use



# * Census Data -----------------------------------------------------------
# * * tidycensus ----------------------------------------------------------
census_key = '' # put yours here

census_api_key(key = census_key)

butler_warren = get_decennial(geography = 'county',
                              variables = 'P1_001N',
                              year = 2020,
                              county = c('Butler County', 'Warren County'),
                              state = 'OH')
butler_warren



# * * From the Census API -------------------------------------------------

# Ref: https://api.census.gov/data/2020/dec/pl/examples.html

search_URL = paste0('https://api.census.gov/data/2020/dec/pl?get=P1_001N&for=county:017,165&in=state:39&key=',
                    census_key)
search_URL

# After copying the URL into my browser, we suspected that this is a nested data
# so it is likely that it is a JSON dataset

butler_warren_from_api = fromJSON(txt = search_URL)

# explanation of the two-way pipe (%<>%) (run ONLY one of the three lines of code below)
butler_warren_from_api %<>% janitor::row_to_names(row_number = 1) %>%   as_tibble()
butler_warren_from_api %<>% janitor::row_to_names(row_number = 1) -> butler_warren_from_api
butler_warren_from_api = as_tibble(row_to_names(dat = butler_warren_from_api, row_number = 1))



# * Accuweather -----------------------------------------------------------

# location: 340019
accu_key = '' # put your code her

accu_query_link = paste0('http://dataservice.accuweather.com/forecasts/v1/daily/5day/340019?apikey=',
                         accu_key )

accu_weather = fromJSON(txt = accu_query_link)

accu_weather$DailyForecasts
