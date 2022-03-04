# Code written in class on March 02, 2022
## Data Correction and Imputation

pacman::p_load(tidyverse, deducorrect, editrules, VIM)


# * Examining the Correct Rounding Package --------------------------------

E = editset("x + y == z")
df = data.frame(x = 101, y = 100, z = 200)

corrected_data = correctRounding(E, dat = df)

# answer will be correct but potentially diff than the slides
corrected_data$corrected 



# * Good Data -------------------------------------------------------------

df = data.frame(x = 100, y = 100, z = 200)

corrected_data = correctRounding(E, dat = df)

# answer will be correct but potentially diff than the slides
corrected_data$corrected 
corrected_data$corrections


# * Correct with Rules (Trying to Make it Work) ---------------------------

d <- data.frame(x = 173, y = 200, z = 379) #
correctWithRules(rules = E, d) # no changes based on the output

u = correctionRules(x = expression(
  if(x + y != z) z = x + y
))

correctWithRules(rules = u, d)



# * Demo ------------------------------------------------------------------

df = iris %>% tibble()
df

# how many missing values do we have in the entire data
total_missing = is.na(df) %>% sum()

df[1:5, 1:2] = NA # making some fake missing data
df

sl_mean = mean(df$Sepal.Length, na.rm = T)
sw_median = median(df$Sepal.Width, na.rm = T)

df_completed1 = df %>% 
  replace_na(
    # replacing the NAs in Col 1 with their mean
    list(Sepal.Length = sl_mean, 
         # replacing the NAs in Col 2 with their median    
         Sepal.Width = sw_median)
  )



df_completed1



# * Suggestion (If you SHOULD impute, use a method that capitalize --------

# if your dataset is very large, kNN is extremely inefficient
# for every observation containing missing data, it will compute a dist
# to all the remaining observations in your data
# rank the observations
# it will use the top 5 observations (ones with the least dist)
# for numeric data, it defaults to using the median of the 5 obs
# for imputing it
# for categorical, it will use the mode (most freq value)
df_completed2 = VIM::kNN(data = df, k = 5)


