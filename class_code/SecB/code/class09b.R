

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
# [1] We need to address the NAs
# [2] We need to address the inconsistencies in our values (for both numeric and non-numeric cols)


# we used to have a value of x61, and now it is NA so we want to "impute" that value
# impute is the term we will use to replace to NA

# Where did this NA occur in the humidity col?
# We need to index where that NA happened.
# Option 1: pull up the record where the NA happened
# Option 2: find the row number where the NA happened

# starting point identify which obs/rows have NAs in our col
is.na(bike$humidity) -> nas_in_humidity
table(nas_in_humidity) # I should have 1 TRUE and 17378 FALSE

bike[nas_in_humidity, ] # print all the cols for that record (pulling up that record) (all cols be after , is empty)

which(nas_in_humidity) # which had TRUE values in that atomic vector

# replaced whatever was in that row and col with 61
bike[nas_in_humidity, 'humidity'] = 61 # this after seeing that initially it was x61 (so x is a typo) 

# if you did not see the x61, logically how would you have replaced that NA?
# you can capitalize on the fact that this dataset is in datetime, 
# this could have been your right hand side: (45+61)/2 or the overall mean (62.7; not
# recommended but by chance it worked better for this dataset)
mean(bike$humidity, na.rm = T)


# let us talk about the sources col
# one reason it is "inconsistent" is that we have some NAs there
# but that is not the only reason
table(bike$sources, useNA = 'ifany')

# My question for you, what are the 3 (or 4) inconsistencies in this col??
# based on the output from table
# [1] Twitter has two values (for any analysis, you would want to combine that)
unique(bike$sources)
# [2] AD campaign is capitalized in three different ways
# [3] The fact that we have some NAs
# [4] Optional: You can/might want to combine the Googles (
# and that depends on the goal of the analysis)

# To fix the inconsistencies in Twitter, remove trailing/extra spaces in the end
# AD Campaign: make it all lower case
# What should we do about the NAs?
# For non NA issues, we are doing data correction (if you are sure you fix it, otherwise you can convert it to NA and then impute it)
# For NA problems, you are doing imputation
# [a] "unknown" --> given that this is text, we can be honest and say we do not know
# [b] Infer what they values "can be" | make it reasonable and defendable
###### [1] Randomly impute with probabilities that correspond to the distribution without the NAs
###### [2] Omitting NAs (is dependent on what you are trying to do)
##### This will not work if you are treating the dataset as a time-series
##### [3] The most freq value (I am not a fan of that)
##### [4] Find nearby/similar observations and impute accordingly

# the twitter issue
bike$sources = stringr::str_trim(bike$sources)
table(bike$sources) # my expectation is that I will have only one Twitter > 1500

# the lower casing of AD campaign
bike$sources = tolower(bike$sources)
table(bike$sources, useNA = 'ifany')

# replace the 554 NAs, with 'unknown'
# I could have got an index and replaced those values similar to humidity
# but I will show you a different approach
bike = tidyr::replace_na(
  data = bike,
  # if you are applying it to the df
  replace = list(sources = 'unknown')
)
table(bike$sources, useNA = 'ifany')

# last piece (bonus you do not have to do it is combine all the googles)
google_index = stringr::str_detect(
  string = bike$sources, pattern = 'google'
)
# True and False; number of true should be 527 + 828 + 1553
table(google_index)
bike[google_index, 'sources'] = 'Google'
table(bike$sources, useNA = 'ifany')
