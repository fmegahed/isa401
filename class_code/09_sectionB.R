# Code written in class on Feb 21, 2022
## Tidy Data


# * Loading the required packages -----------------------------------------
if(require(pacman)== FALSE) install.packages("pacman")
pacman::p_load(tidyverse,
               lubridate, # Fadel's fav date pkg in R
               magrittr) # has some pipe and extract functions that we may use


# * table1 ----------------------------------------------------------------
table1


# * * Beauty of tidy format (calc fields) ---------------------------------

tb_tbl = table1 # a tubercluosis (tb) of type tibble (naming convention)

tb_tbl %<>% 
  mutate(cases_per_pop = cases/population,
         cases_per_10000_ppl = 10000 * cases_per_pop)

tb_tbl


# * * Beauty of tidy format (ggplots) -------------------------------------

tb_tbl %>%
  # function called ggplot (from ggplot2 pkg, loaded with tidyverse)
  # do not care too much about this plot, but this is a demo of the utility
  # of the tidy format
  ggplot(aes(x = year, y = cases_per_10000_ppl, color = country)) +
  # lets add a layer of points representing our data in a 2D space
  # points representing the data (x=year, y= cases_per_10000_ppl, color = country)
  geom_point(size = 3) + 
  # connecting the dots (to showcase the rate of increase)
  # but it is generally not recommended to fit a line when you have two obs
  # since you are forcing the trend to be linear
  geom_line() 



# * tables 4a and 4b ------------------------------------------------------

table4a # printing it for your ref
table4a_tidy = table4a %>% 
  pivot_longer(cols = c(2,3), # offending cols
               names_to = "year", # new col containing yr to be named year
               values_to = "cases") # new col containing the values -> cases
table4a_tidy


table4b # printing it for your ref
table4b_tidy = table4b %>% 
  pivot_longer(cols = c(2,3), # offending cols
               names_to = "year", # new col containing yr to be named year
               values_to = "population") # new col containing the values -> population
table4b_tidy

# incase you wanted to recreate table1
# flashback to ISA 245 (left_join)

table_complete_tidy = left_join(x = table4a_tidy, y = table4b_tidy,
                                # specifying two cols to be my "key"
                                by = c('country' = 'country',
                                       'year' = 'year'))
table_complete_tidy




# * table2 ----------------------------------------------------------------

table2
table2_tidy = table2 %>% 
  pivot_wider(
    names_from = 'type',
    values_from = 'count'
  )
table2_tidy



# * The COVID Dataset -----------------------------------------------------

url_deaths = 'https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.147129205.374698070.1645465418-1265542666.1645465418'

# using the read.csv function from baseR to read the csv data
deaths_base = read.csv(file = url_deaths)
glimpse(deaths_base) # checking the variables

deaths_base_tidy = deaths_base %>% 
  pivot_longer(cols = starts_with('X'), # a cool trick from dplyr
               names_to = 'date',
               values_to = 'count')
deaths_base_tidy

# Alternative way of reading the data
deaths_readr = read_csv(file = url_deaths)
glimpse(deaths_readr)

deaths_readr_tidy1 = deaths_readr %>% 
  pivot_longer(cols = starts_with('2'),
               names_to = 'date',
               values_to = 'count')

deaths_readr_tidy2 = deaths_readr %>% 
  pivot_longer(cols = 5:762,
               names_to = 'date',
               values_to = 'count')

# comparing them
setdiff(deaths_readr_tidy1, deaths_readr_tidy2)

# fix the date
deaths_readr_tidy1$date %<>% lubridate::ymd() 
deaths_readr_tidy1


# fixing the date for the base r data

deaths_base_tidy$date %<>% 
  str_replace_all(pattern = 'X', replacement = "") %>% 
  lubridate::ymd()




