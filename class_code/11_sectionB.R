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

bike_tbl[14177:14179, 8]

glimpse(bike_tbl)



# * Making the Data Tidy --------------------------------------------------

## Extract the date and hours from datetime and then delete the datetime col
bike_tbl %<>% mutate(datetime = mdy_hm(datetime),
                    date = as_date(datetime),
                    hour = hour(datetime)) %>% 
  relocate(date, hour) %>% 
  select(-c(datetime))



# * Make the data technically correct -------------------------------------
glimpse(bike_tbl)

## Needed is to change season, holiday, workingday and weather to factors
## Probably reasonable to also change hour to a factor variable (but that depends on your analysis)

from_int_factor = function(x){
  x = as.character(x) %>% as.factor()
  return(x)
}

bike_tbl %<>% mutate_at(.vars = vars(hour, season, holiday,
                                    workingday, weather, hour),
                       .funs = from_int_factor)
glimpse(bike_tbl)  

bike_tbl %<>% mutate(
  # example showing how to recode character or factor values
  # not necessarily saying that this is correct for our data
  holiday = recode(holiday, "0" = 'Yes', '1' = 'No'),
  workingday = recode(workingday, "0" = 'No', '1' = 'Yes')
)

# now we have technically correct data based on the col names, types and factor levels
# are reasonable



# * Check for Consistency -----------------------------------------------

act = action_levels(warn_at = 0.01, notify_at = 0.01)

agent = create_agent(tbl = bike_tbl, actions = act) %>% 
  # using 20 to 80 as possible values for the temp (not necessarily saying that
  # these values are possible)
  col_vals_between(columns = vars(temp, atemp), left = 20, right = 80) %>% 
  col_vals_between(columns = vars(atemp), left = -20, right = 45) %>% 
  # numbers of riders are greater than or equal 0
  col_vals_gte(columns = vars(casual, registered, count), 
               value = 0) %>%
  # sum of riders = count
  col_vals_expr(expr = expr(count == registered + casual)) %>% 
  # lets say that we were only interested in google data for ads
  col_vals_expr(expr = ~ str_detect(string = sources,
                                    pattern = 'google')) %>% 
  col_vals_not_null(columns = names(bike_tbl))


interrogate(agent)
