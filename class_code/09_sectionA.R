# Class 09: Technically Correct Data

pacman::p_load(tidyverse, # glimpse, read_csv, mutate, etc
               lubridate) # fix our datetime col

v = c(2, 5, 3, 10, 8)

# incorrect approach would be to directly use the as.factor() or from tidyverse as_factor()
incorrect_transf = as.factor(v)
incorrect_transf

v_transf = as.factor( as.character(v) )
v_transf


# * The Bike Sharing Demo -------------------------------------------------

bike1 = read.csv('data/bike_sharing_data.csv') # base R
bike2 = read_csv('data/bike_sharing_data.csv') # from readr pkg (tidyverse)

## Are the two objects the same
glimpse(bike1) # returns the number of cols/rows, their classes and shows some obs
glimpse(bike2) # humidity is recognized as dbl unlike in the bike1 case (chr)



# * Making bike1 technically correct --------------------------------------
bike1$datetime = mdy_hm(bike1$datetime) # overwrote the col after changing its class to date-time
class(bike1$datetime)

bike1 = mutate(
  # I use the bike1 dataset
  .data = bike1,
  # focused on the four variables below 
  across(c(season, holiday, workingday, weather),
         # specified the function that I want to apply on these four variables 
         as.character)
)

bike1 = mutate(
  # I use the bike1 dataset
  .data = bike1,
  # focused on the four variables below 
  across(c(season, holiday, workingday, weather),
         # specified the function that I want to apply on these four variables 
         as.factor)
)

glimpse(bike1)

# approach1: go through that column and use a function that would identify non_numeric values

# approach 2: force the conversion to numeric 
# (possible outcomes, error or it will convert the cell[s] having an issue to either a weird number or NA or NaN )

# approach 3: counts for the different values of humidity to identify possible issues
table(bike1$humidity)
bike1[bike1$humidity == 'x61']

