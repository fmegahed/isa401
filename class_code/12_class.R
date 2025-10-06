
people = tibble::tibble(
  name = c('Tom Cruise', 'Serena Williams', 'Taylor Swift', 'Ariana Grande', 'The Rock'),
  height = c(172, 1.75, 69.3, 154, 6.25),
  unit = c('cm', 'm', 'inch', 'cm', 'ft')
)

u <- deducorrect::correctionRules(
  expression(
    ## 1-------
    if(unit == "cm") height <- height/100,
    ## 2-------
    if(unit == "inch") height <- height/39.37,
    ## 3-------
    if(unit == "ft") height <- height/3.28,
    ## 4-------
    unit <- "m"
  ))

people_corrected = deducorrect::correctWithRules(
  rules = u, dat = people
  )

names(people_corrected)

people_clean_df = people_corrected$corrected

people_corrected[[2]]



# * Slide 9 (When Does CorrectTypos Not Work) -----------------------------

e <- editrules::editmatrix("x + y == z") # defining the rules
d <- data.frame(x = 123, y = 223, z = 246) # creating the data frame
cor <- deducorrect::correctTypos(e, d) # attempting to correct Typos
cor$corrected # new values for the data.frame
cor$corrections



# * Slide 10 --------------------------------------------------------------

for (i in 1:5) {
  e <- editrules::editmatrix("x + y == z") # defining the rules
  d <- data.frame(x = 101, y = 100, z = 200) # creating the data frame
  cor <- deducorrect::correctRounding(e, d) # attempting to correct Rounding
  print(cor$corrections) # n
  print("-----------")
}




# * Demo ------------------------------------------------------------------


iris_df = iris

dplyr::glimpse(iris)
skimr::skim(iris_df)

# we will intentionally add missing data to our data frame
iris_missing = iris_df
iris_missing$Sepal.Length[1:10] = NA # making the first 10 obs in sepal length to be missing


# Based on last class, you could have used the mean of that column to impute the missing values

# What would be the issue if you were to use the mean of that column to impute the data?

iris_imputed = VIM::kNN(iris_missing, k =5)
## KNN: How it works?
# (a) For every observation with missing data, it will calc the distance to all obs with no missing data:
# (i) if all the columns numeric, Euclidean distance 
# (ii) if not numeric, it will compute it based on Cosine similarity 
# (a distance measure that can account for non-numeric data)
# (b) sort and find the 5 closest observations
# (c) if you are imputing a numeric col --> avg (the values for that col) from the 5 obs
   # if you are imputing a categorical col -> the mode/most repeated value from the 5 obs