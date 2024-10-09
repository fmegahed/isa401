

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

table(bike_tbl$holiday) # counts of holidays
# odd rows in the output are the values you have for that col
# even rows are the corresponding counts
# from an interpretation view, our belief in the meaning of that variable changed
# because 0: corresponds to no holiday; 1 corresponds to a holiday (to make this make sense)

table(bike_tbl$workingday) 

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


# question for you is do we have consistent data?
# [1] We have one missing value in humidity
# How can we find that singular missing value in humidity?
# is.na() -> this will return TRUE or FALSE 
# I can technically use that to find the row of interest in one of two ways:
# [a] through subsetting -- since row = TRUE, would help me identify datetime
# [b] identify the row number through a base R function that is called which()

na_humidity = is.na(bike_tbl$humidity)
table(na_humidity) # expectation only one true which was correct

bike_tbl[na_humidity, ] # print that specific row and all columns bec after , is empty

which(na_humidity) # which is TRUE (and the answer is row 14177)

# what should that NA value be?
# Using logic
# one option is to use the mean of that col (but that is not a great option)
# because we have more context
# if you want to use the mean, I would average the value before it and the one after it
(45+61)/2 # averaging the values before it and after it
mean(bike_tbl$humidity, na.rm = T) # the mean of the entire col

bike_tbl[na_humidity, 'humidity'] = (45+61)/2  # overwrite the NA


# let us look at the sources col
# it had NAs, but it is a chr col so let us look at its values
table(bike_tbl$sources, useNA = "ifany") # to show me the count of NAs

# you should not like the output from table above (why?)
# [1] AD campaign needs to be consolidated (we want to make our dataset more consistent)
# Optional: Combine all the Googles 
# Comment: Twitter has 1745 values

# [i] convert the entire col to a consistent casing (whether upper/lower or some other case style)
# this will by default merge the first 3 values
# [ii] detect the second and third option and change them to the first option
# [iii] convert this col to factor and collapse the factor levels to match what you want

# let us convert ad campaign to lower case (do it in a mutate statement or directly to the col)
bike_tbl$sources = tolower(bike_tbl$sources) #  3472+851+894 = 5217
table(bike_tbl$sources, useNA = "ifany")

# now to show you the logic for the second option [ii], let us consolidate google
google_index = stringr::str_detect(
  string = bike_tbl$sources, pattern = "google"
) # if this works I expect 1553 + 527 + 828 = how many TRUEs I have
table(google_index)
bike_tbl$sources[google_index] = 'Google' # replace everything with Google
table(bike_tbl$sources, useNA = "ifany")

# technically, we do not have consistent data, but we can figure out how to replace 
# the NAs for the rest of the col (imputation)
# let us impute the NAs in bike_tbl using "unknown"

# you can find the index for all the NAs and replace them similar to humidity
# I will show you a different way so you can have something else in your code
bike_tbl = tidyr::replace_na(
  data = bike_tbl, replace = list(sources = 'unknown')
  )
table(bike_tbl$sources, useNA = 'always')
