
# Data correction and imputation


# * Correction Non-graded activity ----------------------------------------

pacman::p_load(tidyverse, 
               deducorrect) # editmatrix and all the correct functions

d <- data.frame(x = 173, y = 200, z = 379)

# with correct functions, you need to first define your rules 
# and then apply it to the data
cor_rules = correctionRules(
  # based on Michael's suggestion, we will change y
  x = expression(
    if(x + y != z) y = z - x # if we wanted to change z -> z = x + y
  )
)
cor_rules

cor_list = correctWithRules(
  rules = cor_rules, dat = d
)

cor_list$corrected # my new df
cor_list$corrections # track changes

d2 = cor_list$corrected # saving to a new df




# * Demo (Imputation) -----------------------------------------------------

pacman::p_load(tidyverse,
               skimr, DataExplorer, # highlight how they help with missing data
               VIM) # kNN imputation

df = iris # assigning the built in iris data to df

# Quick Exploration of Missingness in our data
skim(df) # from skimr
plot_missing(df) # from DataExplorer

# Given that I do not have any missing data, lets introduce some
df[1:10, 1:2] = NA # set the first ten obs in the first two cols to NA (missing)
plot_missing(df) # from DataExplorer

# Two Imputation approaches (replace_na; kNN)
mean_sl = mean(x = df$Sepal.Length, # the vector of interest for this example
               na.rm = T) # T so it ignores the NA
# 5.9136 is the overall mean for the Sepal.Length col from rows 11:150 (drop NAs)

# median but only for the remaining setosa
setosa_df = filter(.data = df, Species == 'setosa') # only the setosa from col 5 -> 50 obs
median_set_sw = median(x = setosa_df$Sepal.Width, na.rm = T)

# replacement
df1 = replace_na(data = df,
                 replace = list(Sepal.Length = mean_sl,
                                Sepal.Width = median_set_sw))

# What are some limitations of the previous approach?
# [1] For col1, we are using the overall mean (overall mean may not be representative for setosa)
# [2] for cols 1:2, we ignored the three variables where we have data (for col2, 2 vars)
# [3] we are doing the imputation 1 column at a time

# One of of the more advanced approaches is the kNN imputation

# for every obs with missing values, it uses the remaining columns and computes
# a distance to every remaining obs in your dataset
# sorts them in an ascending order
# uses the top k (defaults to 5), computes median for numeric columns (based on k) and
# the mode for categorical columns

df2 = kNN(data = df, k = 5)
