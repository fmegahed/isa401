# Data correction and imputation class


# * Load the Packages -----------------------------------------------------
pacman::p_load(tidyverse,
               deducorrect, # for all the correct functions
               editrules) # editmatrix function


# * Non-graded class activity ---------------------------------------------

d <- data.frame(x = 173, y = 200, z = 379) # creating the data frame

# we talked about making the correctWithRules() function work
# so as the first step, I will need to define the rules using the
# correctionRules()

my_rules = correctionRules(
  x = expression(
    if( x + y != z) z = x + y # x = z - y
  )
)
my_rules

corr = correctWithRules(rules = my_rules,
                 dat = d)

# saving the corrected (either by overwriting your data or save to new obj)
d_new = corr$corrected




# * Missing Data Demo -----------------------------------------------------

# Objectives
# Identify Number of Missing
# Discuss different imputation strategies

pacman::p_load(tidyverse, 
               skimr,
               DataExplorer,
               VIM)

df = iris # loading a dataset as an example
glimpse(df) # summary of the first few few obs, num rows, cols and their types

plot_missing(df) # plot the pct of missing per column

skim(df) # will show some nice summary tables for the data

# create some "fake" missing data

df[1:5, 1:2] = NA # first five rows and cols 1:2 = NA
df


# Two imputation approaches (replace_na; kNN approach)

# [1] replace_na
## For this example, we will replace the Sepal.length by the overall mean
### replace the Sepal.With by the median of the setosa's

sepal_l_mean = mean(x = df$Sepal.Length, na.rm = T)
setosa_df = filter(.data = df, Species == 'setosa') # new df called setosa_df
sepal_w_median = median(x = setosa_df$Sepal.Width, na.rm = T)

df_comp1 = 
  replace_na(
    data = df,
    replace = list(
      Sepal.Length = sepal_l_mean, # replace missing data in that col w overall mean
      Sepal.Width = sepal_w_median # median of the sw for setosa
    )
  )

df_comp1

# Limitations of the Approach above

# [1] We ignored the values within the three remaining columns
# [2] We used overall mean or median for the group (which is better than nothing)
# but not necessarily the best approach (since all our imputed values are the same)
# [3] Imputed each column separately


# to overcome these limitations, we will consider kNN imputation (as a potential sol)

# Disclaimer: approach is terrible (computationally expensive) for large data

# for every obs having missing data, you use your remaining columns and all the other obs
# rank all the other obs based on a distance measure
# will get your top k obs (use the median to impute num cols and the mode to impute cat cols)
# default is nearest five obs

df_comp2 = kNN(df)
