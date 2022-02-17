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
usethis::edit_r_profile(scope = 'project')

census_key = '' # put yours here

# linking the API key to the package
census_api_key(census_key)

butler_warren = get_decennial(geography = 'county',
                              variables = 'P1_001N',
                              state = 'OH',
                              year = 2020)

# I can get just the data for Butler and Warren Counties as follows
butler_warren_1 = butler_warren %>% # has 88 counties
  filter(NAME %in% c('Butler County, Ohio', 'Warren County, Ohio'))


# The approach above is inefficient since you request more data than you need to
butler_warren_2 = get_decennial(geography = 'county',
                                variables = 'P1_001N',
                                state = 'OH',
                                county = c('017', '165'), # guessing that FIPS as char will work
                                year = 2020)

butler_warren_3 = get_decennial(geography = 'county',
                                variables = 'P1_001N',
                                state = 'OH',
                                county = c('Butler County', 'Warren County'), # county name
                                year = 2020)


# * * Using the API Directly ----------------------------------------------
# How the actual API works
# Based on https://api.census.gov/data/2020/dec/pl/examples.html
# Example link for LA County, CA from the link above

search_url = paste0('https://api.census.gov/data/2020/dec/pl?get=P1_001N&for=county:017,165&in=state:39&key=',
                    census_key)

butler_warren_from_api = fromJSON(txt = search_url)
glimpse(butler_warren_from_api) # check the data structure

butler_warren_from_api %>% as_tibble() %>% 
  janitor::row_to_names(row_number = 1)

butler_warren_from_api_1 = butler_warren_from_api %>% as_tibble() %>% 
  janitor::row_to_names(row_number = 1)

butler_warren_from_api %>% as_tibble() %>% 
  janitor::row_to_names(row_number = 1) -> butler_warren_from_api_2

# if I am okay with overwritting butler_warren_from_api
butler_warren_from_api %<>% as_tibble() %>% 
  janitor::row_to_names(row_number = 1)

# DO NOT RUN
##### Explanation
butler_warren_from_api %>% as_tibble() %>% 
  janitor::row_to_names(row_number = 1) -> butler_warren_from_api

butler_warren_from_api = as_tibble(
  janitor::row_to_names(dat = butler_warren_from_api, row_number = 1)
)






# * Accuweather -----------------------------------------------------------

accu_key = '' # Put yours here

# From the locations API, key for Oxford Ohio is 340019

# To get the 5 day weather forecast
accu_search = paste0("http://dataservice.accuweather.com/forecasts/v1/daily/5day/340019?apikey=",
                     accu_key)

accu_results = fromJSON(txt = accu_search)
glimpse(accu_results) # list of 2

# three options to pull this information [[]] to convert from list to data.frame (or whatever that second item type is)
weather1 = accu_results$DailyForecasts # extracting the sublist by its name
weather2 = accu_results[['DailyForecasts']] # also extracting it bty name
weather3 = accu_results[[2]] # second sublist since the first one was called headline

weather1$Link[5]
