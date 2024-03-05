

# * Demonstrate the names() for changing the name of a col ----------------
iris_tbl = tibble::tibble(iris)

# print out shows col names (Title.Case sep by a dot)
# also shows col types and the first few observations
dplyr::glimpse(iris_tbl) 

# return a chr vector of the colnames for that df/tibble
names(iris_tbl)

names(iris_tbl)[1] = 'column_1'
names(iris_tbl)

# you can use this approach to figure out the correct index and overwrite the col
names(iris_tbl)[ names(iris_tbl)=='Species' ] = 'column_5'
names(iris_tbl)

# the rename is nice because you can use it in a pipe
iris_tbl = 
  iris_tbl |> 
  dplyr::rename(column_2 = Sepal.Width, column_3 = Petal.Length)
  
names(iris_tbl)




# * Skim function ---------------------------------------------------------
if(require(skimr)==F) install.packages("skimr"); library(skimr)

# reload the data because I want to use the original names
iris_tbl = tibble::tibble(iris)

skimr::skim(iris_tbl)



# * The as.character() |> as.factor() -------------------------------------

num_vec = c(50, 250, 25, 100, 200)

incorrect_conversion1 = as.factor(num_vec)
incorrect_conversion1 # this is actually correct (it used to give you different values)

incorrect_conversion2 = forcats::as_factor(num_vec)
incorrect_conversion2 # this is actually correct (it used to give you different values)

as_chr = as.character(num_vec) |> as.factor()
as_chr




# * The bike sharing dataset ----------------------------------------------

bike_link ="https://raw.githubusercontent.com/fmegahed/isa401/main/data/bike_sharing_data.csv" 

bike1 = readr::read_csv(bike_link)
bike2 = read.csv(bike_link)

# note the difference in the class for humidity between both functions
# readr::read_csv() and read.csv()
dplyr::glimpse(bike1)
dplyr::glimpse(bike2)


# Let us talk about each col
# -------------------------
# for the sake of this example, I will use bike1
# datetime is currently a chr. We would like to convert this into a datetime object

# applying the mdy_hm (by inspecting the data) to my datetime column
# overwritting the original column by assigning it back to bike1$datetime
bike1$datetime = lubridate::mdy_hm(bike1$datetime)
class(bike1$datetime) # "POSIXct" "POSIXt" indicate a time series (which is correct)

# now let us talk about the season:weather columns 
dplyr::glimpse(bike1)

# For the sake of showing you something different, I will convert all four columns in
# one step (you do not have to do this; you can do what we did in line 76 -> 4 times)

bike1 = bike1 |> 
  dplyr::mutate(
    # inside mutate, which changes/overwrites the columns we have
    # I used the across function,
    # use the as.factor() and apply to all the columns from season to weather
    dplyr::across(season:weather, .fns = as.factor)
  )

# optional: change the names of the factors
# ------------------------------------------
bike1$season = factor(
  x = bike1$season, 
  levels = c("1", "2", "3", "4"), 
  labels = c('spring', "summer", "fall", "winter")
)
table(bike1$season)
table(bike2$season) # this is the df that we did not touch and they match


dplyr::glimpse(bike1)


# Let us talk about the bike2 dataset
# ---------------------------------------------------

# why is the humidity a chr in bike2 vs numeric in bike1?
# to check why there is an issue in humidity, I will print out a table of 
# the values and their counts
table(bike2$humidity)
table(is.na( bike1$humidity) ) # read_csv() guesses the column classes and # it converted this "outlier" to NA

