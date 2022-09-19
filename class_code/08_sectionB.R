
# Class 08: Tidy Operations in R


# * Packages --------------------------------------------------------------
pacman::p_load(tidyverse) # primarily focused on tidyr


# * Tables ----------------------------------------------------------------
?table2

df2 = table2
df2 # print it (tibble; 12 obs and 4 variables)
# we will want to make this table wider by taking the type column and creating cols based on its values

df2_wide =
  pivot_wider(
    data = df2,
    names_from = type, # names of the new columns will come from the values stored in the type col
    values_from = count # values for cases and population are stored in the count column
  )
df2_wide


df4b = table4b

df4b_longer =
  pivot_longer(
    data = df4b,
    cols = `1999`:`2000`, # alternatively, you can use the column numbers 2:3 (or c(2,3) ) instead of their names
    names_to = 'year', # name of the new column containing 1999 and 2000
    values_to = 'population' # the name of the new column containing the population counts
  )
df4b_longer


df3 = table3
df3

df3_tidy = separate(
  data = df3,
  col = 3, # showing you that you can use the col num instead of name
  into = c('TB_cases', 'pop'), # names of the new columns
  sep = '/', # separate the columns based on /
  convert = T # convert the new columns to numeric if you can
)
df3_tidy



# * COVID Deaths ----------------------------------------------------------

covid1 = read_csv(
  'https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.137610160.1205584504.1663594442-1591540796.1663594442'
) # output from the read_csv (readr, part of tidyverse) is a tibble
covid1

covid2 = read.csv(
  'https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.137610160.1205584504.1663594442-1591540796.1663594442'
) # output is a dataframe with column names having an X for dates
covid2

covid1_l =
  pivot_longer(
    data = covid1,
    cols = 5:971,
    names_to = 'date'
  )
covid1_l
