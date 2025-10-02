

# * Assignment 06 ---------------------------------------------------------

df <- readxl::read_xlsx("data/sample_shimmer.xlsx") # fix directory if needed

dplyr::glimpse(df)

df$date = lubridate::as_date(  df$`timestamp (yyyy/mm/dd hh:mm:ss.000)`  ) 

df$time = hms::as_hms( df$`timestamp (yyyy/mm/dd hh:mm:ss.000)` )

df$`timestamp (yyyy/mm/dd hh:mm:ss.000)` = NULL




# * Bike Sharing Dataset --------------------------------------------------

# [A] Is this the bike sharing dataset tidy? (Shape of the data)

# based on Libbey's approach
bike = read.csv("https://raw.githubusercontent.com/fmegahed/isa401/main/data/bike_sharing_data.csv")

dplyr::glimpse(bike)

# Assuming that you are willing to say that datetime is ok to be in one column
# because date and times are needed to figure out date/time on a continuum
# Then this dataset is tidy because:
# (a) every col would then contain a single variable
# (b) every row would contain a single observation
# Bonus: Your unit of analysis is hour in a specific day


# [B] Is it technically correct? [Check the definitions of the variables on Kaggle]
# - Are the column names reasonable? YES
# - Are the columns being read in R in the way, we want?
  # To answer are the columns being read in R in the way we want, you need to inspect every col

# OUR Dataset is NOT TECHNICALLY Correct
# Bec:
# [1] datetime needs to be datetime: datetime allows you to filter based on date values, do math
# something like 1/1/2011 0:00 is 48 hours before 1/3/2011 0:00
# [2] season, holiday, workingday, weather --> need to be converted from numeric to either a chr or a factor
# [3] if you were to use baseR, humidity for this dataset is recognized as a chr
# if you were to use readr::read_csv(), humidity is recognized as an int
# If chr, we will need to make humidity a numeric/int field


# Let us make it technically correct

table(bike$humidity)


# [1] Fix datetime 

bike_tc = bike |> 
  dplyr::mutate(
    datetime = lubridate::mdy_hm(datetime),
    
    weather = 
      as.character(weather) |> # converting weather from int to chr
      as.factor() |>       # converted from chr to factor
      # given it is factor, we are making sure that we understand what the levels refer to
      # based on definitions in https://www.kaggle.com/c/bike-sharing-demand/data
      forcats::fct_recode(clear = '1', mist = '2', light_rain = '3', heavy_rain = '4'),
    
    holiday = as.character(holiday) |> as.factor() |> 
      forcats::fct_recode(not_holiday = '0', holiday = '1'), # we used table(bike$holiday) to make that determination
    
    workingday = as.character(workingday) |> as.factor() |> 
      forcats::fct_recode(not_workingday = '0', working_day = '1'),
    
    season = as.character(season) |> as.factor() |> 
      forcats::fct_recode(spring = '1', summer = '2', fall = '3', winter = '4'),
    
    # lazy conversion of humidity to int (similar to readr approach)
    humidity = as.integer(humidity)
    
  )

dplyr::glimpse(bike_tc)

# comparing the counts of seasons (original vs tc data)
table(bike$weather) # original/raw data
table(bike_tc$weather) # tech correct data
table(bike_tc$humidity, useNA = 'ifany')


# Replace the NA (from table I know that I have one NA) in humidity
na_index_in_hum = is.na(bike_tc$humidity)

# we have two options: 
# (a) given that we know it was x61, then this value is likely just 61
# (b) if you did not know that (e.g., bec you used the readr::read_csv), what is your best guess
# for that value?

which(na_index_in_hum) # that the missing data occurs in row 14177
bike_tc$humidity[14175:14179] # showing your neighboring information
bike_tc[14175:14179, c("datetime", "humidity")]
mean( bike_tc$humidity[14176:14178] , na.rm = T)

bike_tc$humidity[na_index_in_hum] =  63 # replace the NA with whatever value bike$


# Leveraging factor and technically correct data
skimr::skim(bike_tc)

# Let us look at the sources col
table(bike_tc$sources, useNA = "ifany")

# We will fix the multiple issues in bike_tc$sources (data is already technically correct)
# (a) we have meaningful col names, and (b) it is understood correctly in our software
# optional: [c] we have meaningful factor level names (instead of 0 and 1, e.g., holiday vs not)
# BUT it is not consistent, we have missing data and multiple ways of spelling the same source

# [i] casing to be consistent
# [ii] trim extra spaces from Twitter
# [iii] replace NA with something human readable
# [iv] Optional: Combine Google into one thing

# given that I am working on a single variable; no benefit from using mutate
sources_vector = stringr::str_to_title(bike_tc$sources) |> 
  stringr::str_squish() |> 
  tidyr::replace_na('Unknown')

# detecting the index (element num in vector) where the word google occurs. Note that casing matters
google_index = sources_vector |> stringr::str_detect("google")
# subset sources_vector to only the elements that had google and then I overwrite these elements with "Google"
sources_vector[google_index] = 'Google'

# now that this worked correctly
bike_tc$sources = sources_vector




# * Fixing the four variables in a "single" pass --------------------------

colnames(bike)

bike |> 
  # previously mutate: variable (or new_variable) = some transformation
  dplyr::mutate( 
    datetime = lubridate::mdy_hm(datetime),
    dplyr::across(season:weather, as.character) 
    ) |> 
  dplyr::mutate(  dplyr::across(season:weather, as.factor)) -> 
  bike_tc_multiple

dplyr::glimpse(bike_tc_multiple)  
# from here you can continue the same processing steps

# for ordering columns: dplyr::select and dplyr::relocate are quite helpful
bike_tc_multiple |> 
  dplyr::select(datetime, weather, holiday, workingday, season, dplyr::everything()) |> 
  dplyr::select(-c(windspeed, atemp)) |> 
  dplyr::glimpse()


