pacman::p_load(jsonlite)

fromJSON("https://api.apartments.com/v1/api/reviews?pageSize=100&pageNumber=1") -> temp

pacman::p_load(COVID19, tidyverse)

df = covid19(country = 'US', level = 2, start = '2020-03-15', 
             end = '2022-11-01')

df_small = df %>% 
  select(administrative_area_level_2, id:deaths, population) %>% 
  filter(!administrative_area_level_2 %in% c('American Samoa', 'Alaska', 'Guam', 'Hawaii',
                                             'Northern Mariana Islands', 
                                             'Puerto Rico', 'Virgin Islands')) %>% 
  mutate(date = lubridate::ymd(date)) %>% select(-id) %>%
  group_by(administrative_area_level_2) %>% 
  arrange(administrative_area_level_2, date) %>% 
  mutate(confirmed = pmax(confirmed - lag(confirmed), 0),
         deaths = pmax(deaths - lag(deaths), 0) ) %>% 
  drop_na()

write_csv(x = df_small, file = 'data/exam02_covid19_states.csv')
# Provide a plot that will allow us to examine the relationship between confirmed cases (confirmed)
# and deaths for each of the 48 continental states and DC

# Provide a plot that shows the population for each of the states 
# (while ensuring that the population numbers are shown)

# Provide a plot for Ohio's Number of Confirmed COVID-19 Cases Per Population



# * Other Dataset ---------------------------------------------------------

pacman::p_load(Lock5withR) # make sure pacman is installed
df <- ACS
df %>% na.omit() -> df
write.csv(df,"data/acs_exam02.csv") # Save CSV to your working directory

