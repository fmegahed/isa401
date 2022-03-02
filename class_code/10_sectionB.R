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


# * Inspecting the Col Types ----------------------------------------------
iris_tbl = iris %>% tibble() %>% clean_names()
iris_tbl

classes_base = sapply(iris_tbl, class)
classes_tidyverse = map_chr(iris_tbl, class)
skim(iris_tbl)
glimpse(iris_tbl)



# * Bike Sharing Example --------------------------------------------------
bike_tbl = read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/Data/bike_sharing_data.csv')

# based on the warning message, lets check problems
problems()
glimpse(bike_tbl)
bike_tbl[14177, 8] # this NA

bike_df = read.csv('https://raw.githubusercontent.com/fmegahed/isa401/main/Data/bike_sharing_data.csv')
glimpse(bike_df)
bike_df[14177, 8] # this get treated as "x61"

# * Col Types -------------------------------------------------------------

# * * Lets Make the data tidy ---------------------------------------------

bike_df %<>%
  mutate(datetime = mdy_hm(datetime), # made it datetime instead of chr
         # this will extract only the date from datetime
         date = datetime %>% as_date,
         # extract the hms from datetime and then pull just the hour
         hour = datetime %>% as_hms %>% hour())

# optional: probably drop datetime and move the other two cols to the front

bike_df %<>% select(-datetime) %>% relocate(date, hour) 



# * Data Validation Report on Column Types --------------------------------
act = action_levels(warn_at = 0.01, notify_at = 0.01)

agent = create_agent(tbl = bike_df, actions = act) %>% 
  col_is_date(columns = vars(date)) %>% 
  col_is_factor(columns = vars(hour, season, holiday, workingday, weather)) %>% 
  col_is_numeric(columns = vars(temp, atemp, humidity, windspeed, casual, registered, count)) %>% 
  col_is_character(columns = vars(sources))

results = interrogate(agent = agent, sample_limit = nrow(bike_df) )  

results  %>% pointblank::export_report(filename = 'results.html')
  
  
  
  
  
  
  

