# Example from Slide 11

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
  )
  )

people_corrected = deducorrect::correctWithRules(
  rules = u, dat = people)

people_corrected$corrected # returns the tibble with the changed values (height and unit columns)

people_corrected$corrections



# * Class Activity --------------------------------------------------------

d <- data.frame(x = 173, y = 200, z = 379)

# Focus on the correctWithRules()
?deducorrect::correctWithRules

# Based on the help, there are two required inputs for this function:
## [1] rules: object of class correctionRules
## [2] dat: data.frame 

rule = deducorrect::correctionRules(
  x = expression( # x here is not the var but the name of the argument for the function
    # logical -- if my summation does not equal what I want
    # make a decision about which variable to change
    if(x + y != z) {
      z = x + y
      }
    # I could have written the above statement to change any of the other variables
    # e.g., if(x + y != z) {y = z - x}
  )
)

rule

corrected_lst = deducorrect::correctWithRules(
  rules = rule, dat = d
)

corrected_lst


e = editrules::editmatrix("x + y == z")

other_example = deducorrect::correctRounding(
  E = e,
  dat = data.frame(x = 174, y = 200, z = 373)
)

other_example$corrections




# * The Iris Dataset ------------------------------------------------------

iris_df = iris

# checks for missing data in a specific column and will return a vector of T/F
is.na(iris_df$Sepal.Length)
num_missing_in_sepal_length = is.na(iris_df$Sepal.Length) |> sum()

# look at the percentage of missing values in a given col
pct_missing = function(x){
  num_missing = is.na(x) |> sum() # number of missing obs in the input vector x
  
  # to compute pct * multiple by 100 and divide by the total number of obs in x
  pct_missing = 100*num_missing/length(x)
  
  return(pct_missing)
}

# return a data.frame with each column and its corresponding pct_missing
pct_missing_df = purrr::map_df(.x = iris_df, .f = pct_missing)

# a third way of checking for missing 
install.packages("DataExplorer")
DataExplorer::plot_missing(iris_df)


# how would any of this look like if you have missing data
# we will induce missing data for our example

iris_missing = iris_df # just a copy of the data for now
iris_missing[1:10, 1] = NA # make the first 10 rows in col1 to be NA

purrr::map_df(.x = iris_missing, .f = pct_missing)
DataExplorer::plot_missing(iris_missing)


# If you were to impute, utilizing information from the other columns for imputation is helpful
# will probably lead to more explainable imputations
install.packages("VIM")

# this function will impute the data based on the 5-nearest observations to it
# nearest is defined using the Gower distance
# i.e., the numeric columns as well as the categorical species to find the 5 obs
# that look most similar
# for numeric variable (our case bec we are imputing the Sepal.Length),
# it uses the median value for that Column from those five obs to impute our missing value
# for a categorical variable, it will use the maxCat (i.e., the most freq category)
iris_imputed = VIM::kNN(data = iris_missing)
 


