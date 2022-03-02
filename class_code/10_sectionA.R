# Code written in class on Feb 23, 2022
## Data Validation


# * Loading the required packages -----------------------------------------
if(require(pacman)== FALSE) install.packages("pacman")
pacman::p_load(tidyverse,
               skimr,
               DataExplorer,
               lubridate, hms, # for dates and times respectively
               janitor,
               pointblank, # for data validation reports in R
               magrittr) # has some pipe and extract functions that we may use



# * Checking Col Types ----------------------------------------------------



iris_tbl = tibble(iris) %>% clean_names()

glimpse(iris_tbl)

skim(iris_tbl)

plot_str(iris_tbl)



# * The Bike Sharing Dataset ----------------------------------------------

## why the read_csv() is better for this dataset
bike_tbl = read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/Data/bike_sharing_data.csv')
glimpse(bike_tbl)

problems() # investigating the problems based on the warning message

bike_tbl[14178, 8] # investigating how the read_csv fixed this issue


## What does the base R function do?
bike_base = read.csv('https://raw.githubusercontent.com/fmegahed/isa401/main/Data/bike_sharing_data.csv')
glimpse(bike_base)


# From now on, we will work with the bike_tbl (for the sake of having a unified
# example in class)

# Goal 1: Making the data tidy
bike_tbl %<>% mutate(datetime = mdy_hm(datetime, tz = 'America/New_York'))

glimpse(bike_tbl)

bike_tbl %<>% mutate(date = datetime %>% as_date,
                     hour = datetime %>% as_hms() %>% hour()) 
# making the data tidy by removing the datetime column which had two variables
bike_tbl %<>% select(-datetime) %>% 
  relocate(date, hour) # this will move date and hour to be your first two cols



# * Lets Create a Report for What the Variables Should Be -----------------
bike_tbl = read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/Data/bike_sharing_data.csv')
bike_tbl %<>% mutate(datetime = mdy_hm(datetime, tz = 'America/New_York'))

bike_tbl %<>% mutate(date = datetime %>% as_date,
                     hour = datetime %>% as_hms() %>% hour()) 
# making the data tidy by removing the datetime column which had two variables
bike_tbl %<>% select(-datetime) %>% 
  relocate(date, hour) # this will move date and hour to be your first two cols


glimpse(bike_tbl)

act = action_levels(warn_at = 0.01, notify_at = 0.01, stop_at = NULL)


agent = create_agent(tbl = bike_tbl, actions = act) %>% 
  col_is_date(columns = vars(date)) %>% 
  col_is_factor(columns = vars(hour, season, holiday, workingday)) %>% 
  col_is_numeric(columns = c(weather, temp, atemp, humidity, 
                             windspeed, casual, registered, count))

col_type_valid_results =  interrogate(agent = agent, 
                                      sample_limit = nrow(bike_tbl))

col_type_valid_results



# * Fixing the Columns (Moving to Technically Correct Data) ---------------
bike_tbl$hour =  as.factor(as.character(bike_tbl$hour))

bike_tbl %<>% mutate_at(.vars = vars(season, holiday, workingday, weather),
                        .funs = as.character) # made the four cols chr
bike_tbl %<>% mutate_at(.vars = vars(season, holiday, workingday, weather),
                        .funs = as.factor) # from chr to factor

# Change the labels for one of the factors
bike_tbl$workingday %<>% recode('0' = "not_working_day" , "1" = "working_day") 
levels(bike_tbl$workingday)
