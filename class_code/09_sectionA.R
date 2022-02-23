# Code written in class on Feb 21, 2022
## Tidy Data


# * Loading the required packages -----------------------------------------
if(require(pacman)== FALSE) install.packages("pacman")
pacman::p_load(tidyverse,
               lubridate, # Fadel's fav date pkg in R
               magrittr) # has some pipe and extract functions that we may use


# * Look at table1 --------------------------------------------------------
df = table1 %>% 
  mutate(case_per_10000_ppl = 10000*cases/population)
df

# How you would visualize this data in R
# We will not focus on the logic today (but the fact that you can do it
# easily with this format)

df %>% 
  # comes from the ggplot2 pkg (creates a canvas)
  ggplot(aes(x = year, y = case_per_10000_ppl, color = country)) +
  geom_point(size = 2) + # creating a point for each observation, colored by country
  geom_line()



# * pivot_longer() for table4a --------------------------------------------
table4a
table4a_tidy = table4a %>% 
  pivot_longer(cols = c(2,3), # offending columns
               # name of the column that will combine the colnames for cols 2 and 3
               names_to = 'year', 
               # the name of the column that will contain their associated values
               values_to = 'cases')



# Optional -- what you did a lot in ISA 245
table4b
table4b_tidy = table4b %>% 
  pivot_longer(cols = c(2,3), # offending columns
               # name of the column that will combine the colnames for cols 2 and 3
               names_to = 'year', 
               # the name of the column that will contain their associated values
               values_to = 'population')

table_complete_tidy = left_join(x = table4a_tidy, y = table4b_tidy,
                                by = c('country' = 'country', "year" = 'year') )


# * pivot_wider() for table2 ----------------------------------------------

table2
table2_tidy = table2 %>% 
  # by looking at where the 2 variables are stored when printing table2
  pivot_wider(names_from = 'type', 
              values_from = 'count')



# * covid data ------------------------------------------------------------

# names are potentially different between the baseR and the readr read_csv functions
covid_deaths = read_csv('https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.184902507.374698070.1645465418-1265542666.1645465418')
covid_deaths_baseR = read.csv('https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.184902507.374698070.1645465418-1265542666.1645465418')

covid_deaths_baseR_tidy = covid_deaths_baseR %>% 
  pivot_longer(cols = starts_with('X'), names_to = 'date', values_to = 'counts')

covid_deaths_tidy = covid_deaths %>% 
  pivot_longer(cols = 5:762, names_to = 'date', values_to = 'counts')

# conversion of the character date column does not effect our definition of "tidy"
# however, it does make the data "cleaner", i.e., more ready for analysis

# converting the chr date to a real date in R
covid_deaths_tidy$date = ymd(covid_deaths_tidy$date) 
covid_deaths_tidy



