
# Class 08: tidy data


# * Packages --------------------------------------------------------------

pacman::p_load(tidyverse)



# * Our 4 tables ----------------------------------------------------------

df2 = table2
df2 # from the printout, we see that the type column contains 2 variables 
# (we have a tall dataset)

df2_wider2 = pivot_wider(
  data = df2,
  names_from = type, # in plain English, the column names are the variables within type
  values_from = count) # the values are stored in the column called count


df4a = pivot_longer(
  table4a,
  cols = c(2,3), # the columns that we want to put on top of each other
  names_to = 'year', # the newly created long column from 2:3 will have the name of year
  values_to = 'cases', # the values are stored in a column titled cases
)
df4a


df3 = table3
df3_tidy = separate(df3,
                    col = 'rate', # will be divided into multiple (two) columns
                    into = c('cases', 'pop'), # their names
                    sep = '/', # the values are split based on the /
                    convert = T)
df3_tidy



# * COVID (USAFACTS) ------------------------------------------------------

covid1 = read_csv('https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.184288166.1205584504.1663594442-1591540796.1663594442')
covid1

covid2 = read.csv('https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.238699136.1205584504.1663594442-1591540796.1663594442')
covid2

covid_l = pivot_longer(covid1,
                       cols = 5:971,
                       names_to = 'date',
                       values_to = 'covid_deaths')
covid_l
