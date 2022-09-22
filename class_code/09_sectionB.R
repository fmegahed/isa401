# Class 09: Technically Correct Data



# * Packages --------------------------------------------------------------
pacman::p_load(tidyverse, # read_csv, glimpse, mutate, ...
               lubridate) # fix the date-time col


# * The Bike Sharing Dataset ----------------------------------------------

bike1 = read.csv('data/bike_sharing_data.csv') # base R
bike2 = read_csv('data/bike_sharing_data.csv') # readr pkg loaded with tidyverse

problems() # used this based on the output from the read_csv function (line 13)



# * Are bike1 and bike2 the same? (from a technically correct pers --------
class(bike1)
class(bike2)

# specific column (class function on that specific column)
class(bike1$datetime)

# for all columns (glimpse)
glimpse(bike1) # from the dplyr pkg (fix the first 5 columns + humidity -> output and the variable description)
glimpse(bike2) # it prints all column types nicely



# * Fixing the Datetime ---------------------------------------------------

bike1$datetime = mdy_hm(bike1$datetime)
class(bike1$datetime)



# * Fix the next four variables -------------------------------------------

bike1$season = as.factor( as.character(bike1$season) ) # apply chr vec transf -> make it a factor

bike1 = mutate(
  .data = bike1,
  # will convert all three variables to character
  across(.cols = c(holiday, workingday, weather), .fns = as.character)
)
glimpse(bike1) # all three are indeed chr

bike1 = mutate(
  .data = bike1,
  # will convert all three variables to factor
  across(.cols = holiday:weather, .fns = as.factor)
)
glimpse(bike1) # all three are indeed fct



# * How would you identify the culprit in humidity? ----------------------

# approach 1: identify 'things' (characters) that are non-numeric

# approach 2: force this into numeric

