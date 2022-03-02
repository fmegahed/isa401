# Code written in class on Feb 28, 2022
## Data Validation


# * Loading the required packages -----------------------------------------
if(require(pacman)== FALSE) install.packages("pacman")

pacman::p_load(tidyverse,
               skimr,
               DataExplorer,
               lubridate, hms, # for dates and times respectively
               janitor, # used only for the clean_names() function
               pointblank, # for data validation reports in R
               magrittr) # has some pipe and extract functions that we may use

bike_tbl = read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/Data/bike_sharing_data.csv')
problems()

glimpse(bike_tbl) # from the dplyr pkg (same as str but prints better)
bike_tbl[14177:14179 ,8] # printing 3 values from column 8 around the row number from problems()


# * * Make the data tidy --------------------------------------------------

# This data looks tidysh (if we wanted to make it tidy we will need to fix the datetime col)

# create two new cols and convert datetime from chr to dttm object
bike_tbl %<>% mutate(datetime = mdy_hm(datetime),
                    date = as_date(datetime),
                    hours = hour(datetime)) 
glimpse(bike_tbl)

# remove the datetime variable and moving the date, hours column to be the first
# two cols
bike_tbl %<>% select(-datetime) %>% relocate(date, hours) 
glimpse(bike_tbl)

# Now we have tidy data because we no longer have a column that has two values




# * * Make the data technically correct ---------------------------------------

## change multiple columns in a single step (mutate_at()) from dplyr

bike_tbl %>% mutate_at(.vars = vars(hours, season, holiday, workingday, weather),
                       .funs = as.character) %>% 
  # converts from char to factor
  mutate_at(.vars = vars(hours, season, holiday, workingday, weather),
            .funs = as.factor) -> bike_tbl

glimpse(bike_tbl) # from this output I can now say that we have technically correct data

bike_tbl %<>% mutate(holiday = recode(holiday, '0' = 'Yes', '1' = 'No'),
                    workingday = recode(workingday, '0' = 'No', '1' = 'Yes'))


# * Make the data consistent ----------------------------------------------

# A step - figure out which cells have some issues (we will capitalize on pointblank pkg here)

act = action_levels(warn_at = 0.01, notify_at = 0.01)

agent = create_agent(tbl = bike_tbl, actions = act) %>% 
  col_vals_between(columns = vars(temp, atemp), left = -20, right = 45) %>% 
  col_vals_gte(columns = vars(humidity), value = 0) %>% 
  col_vals_expr(expr = expr(count == registered + casual) ) %>% 
  # fictious check that all sources should have contained google
  col_vals_expr(expr = ~ str_detect(sources, pattern = 'google'),
                label = 'non_google_sources')

interrogate(agent, sample_limit = nrow(bike_tbl))  

col_vals