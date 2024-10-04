

# * Assignment 06 ---------------------------------------------------------

df = readxl::read_excel("data/sample_shimmer.xlsx")
dplyr::glimpse(df)

df$date = lubridate::as_date(  df$`timestamp (yyyy/mm/dd hh:mm:ss.000)`  ) 

df$time = hms::as_hms( df$`timestamp (yyyy/mm/dd hh:mm:ss.000)` )
class(df$time)

tidyr::table1



# * Intro to Skim and skimr -----------------------------------------------

iris_df = iris
skimr::skim(iris_df)



# * Bike Sharing ----------------------------------------------------------

# Read Data

bike = read.csv("https://raw.githubusercontent.com/fmegahed/isa401/main/data/bike_sharing_data.csv")

# Step 0: Ensure it is tidy
dplyr::glimpse(bike)
# Yes, bec
# every column contains a single variable (assuming that you will treat datetime as datetime)
# every row corresponds to the number of users in an hour of a given day/date in the dataset

# Step 1: Check for Technical Correctness
# If any variables are misunderstood by R when you read the data, I want you to
# (i) provide me the name of the variable
# (ii) its current type and what it should be changed to

# datetime: chr --> datetime
# we have four variables that are int and we will change them to either a chr or a factor
# season
# holiday # could be converted to logical (T/F) as well (bec they are binary variables)
# workingday # could be converted to logical (T/F) as well (bec they are binary variables)
# weather
# if read.csv: humidity: converted from chr to int/numeric

# optional convert sources into a factor (considering that the num of marketing sources seem limited)
# for data viz purposes chr and factor are handled in the same way
# but you will still want to clean that column (consistency)

# [a] option 1: convert it one variable at a time
# [b] option 2: convert the four variables that need to be changed from int to factor together

# sanity check
table(bike$season)
# 1    2    3    4 
# 4242 4409 4496 4232 

table(bike$humidity, useNA = 'ifany')
# x61: 1; 42: 235 times

bike |> 
  dplyr::mutate(
    datetime = lubridate::mdy_hm(datetime),
    season = as.character(season) |> as.factor(),
    holiday = as.character(holiday) |> as.factor(),
    workingday = as.character(workingday) |> as.factor(),
    weather = as.character(weather) |> as.factor(),
    
    # the humidity change
    humidity = as.integer(humidity) # x61 will be converted to a NA
  ) -> bike

skimr::skim(bike)

# but we do not have consistent data yet (We Made it to technically correct)
