

# * Tidy data assignment --------------------------------------------------

df = readxl::read_excel("data/sample_shimmer.xlsx")
dplyr::glimpse(df)

df$date = lubridate::as_date(  df$`timestamp (yyyy/mm/dd hh:mm:ss.000)`  ) 
df$time = hms::as_hms( df$`timestamp (yyyy/mm/dd hh:mm:ss.000)` )
class(df$time)

tidyr::table1



# * Demo the skimr package ------------------------------------------------

iris_df = iris

# the tools you know
str(iris_df)
dplyr::glimpse(iris_df) # very similar to the str(); provides better printed info when the no. cols is large

skimr::skim(iris_df)




# * Demo Bike Sharing -----------------------------------------------------

# Please read the data either from the GitHub link or from Canvas

bike_tbl = readr::read_csv(
  "https://raw.githubusercontent.com/fmegahed/isa401/main/data/bike_sharing_data.csv"
  )


# [1] Check all column types from the dataset
dplyr::glimpse(bike_tbl)

# [1 Bonus] Is it tidy? 
# Yes, if you are willing to treat the datetime column as datetime.

# [2] Tell me the list of column(s) whose type need to be changed (and to what "new" type)

# [a] Obviously, datetime needs to change from chr to datetime.
# [b] season can be a factor/chr 
# (factor is a way of telling R; that this is a categorical variable whose values are limited to 4 options)
# [c] the same with holdiay, workingday and weather
# that holiday and working day can be treated as: chr, factor, or logical (T / F)

# this is all based on the definitions of those variables in https://www.kaggle.com/c/bike-sharing-demand/data


# Now let us make the dataset technically correct
# [i] Change the dataset one variable at a time (you can either use $, or four steps inside the mutate function)
bike_tbl$datetime = lubridate::mdy_hm(bike_tbl$datetime ) # the base R solution (i.e., no mutate and no piping)

# [ii] change them all the to-be factor columns "at once" assuming that you will follow the same logic 
bike_tbl |> 
  dplyr::mutate(
    dplyr::across(season:weather, as.character) # scooping the variables
  ) |> 
  dplyr::mutate(
    dplyr::across(season:weather, as.factor)
  ) -> bike_tbl 


# alter. you could write four lines of code inside mutate
# you could also have wrote your own function that would apply as.character and then as.factor

# NOTE I REread the data because we overwrote it
bike_tbl = readr::read_csv(
  "https://raw.githubusercontent.com/fmegahed/isa401/main/data/bike_sharing_data.csv"
)

table(bike_tbl$holiday)

bike_tbl = bike_tbl |> 
  dplyr::mutate(
    datetime = lubridate::mdy_hm(datetime),
    season = as.factor( as.character(season) ),
    holiday = as.character(holiday) |> as.factor(),
    workingday = as.character(workingday) |> as.factor(),
    weather = as.character(weather) |> as.factor()
  )

dplyr::glimpse(bike_tbl)

skimr::skim(bike_tbl)
# the results of the transformation in terms of count of holiday is consistent with line 77


# NOW we have technically correct data but not consistent based on the output from skimr
# we have one missing value in humidity (which we will dig for next class)