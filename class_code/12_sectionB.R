# Code written in class on March 02, 2022
## Data Correction and Imputation

pacman::p_load(tidyverse, deducorrect, editrules)



# * Showcase Potential Inconsitencies with correctRounding() --------------

E = editset(editrules = "x + y == z")
E # from the output (we have a singular rule for numeric data)

d = data.frame(x = 101, y = 100, z = 200)

corr = correctRounding(E = E, dat = d)
corr$corrected
corr$corrections


# * Non-graded activity ---------------------------------------------------
d <- data.frame(x = 173, y = 200, z = 379)

nq = correctTypos(E = E, dat = d)
nq


# based on the editset 
nq_edit = correctWithRules(E, dat = d)

u = correctionRules(
  x = expression(
    # assuming you wanted to change z
    if(x + y != z) z = x + y
  )
)

nq_3 = correctWithRules(rules = u, dat = d)
nq_3




# * Iris Dataset ----------------------------------------------------------

df = iris %>% tibble()
df

# total nas in my data
total_na = is.na(df) %>% sum()

# nas by column
nas_by_column_approach1 = is.na(df) %>% colSums()
nas_by_column_approach2 = map_df(.x = df, .f = is.na) %>% colSums()

# make some fake data
df_missing = df
df_missing[1:10, 1:2] = NA
df_missing

# popular but not a great imputation approach
mean_sl = mean(df_missing$Sepal.Length, na.rm = T)
median_sw = median(df_missing$Sepal.Length, na.rm = T)

# intentionally just printing it out so that I can reimpute it 
df_missing %>% 0
  replace_na(
    # replace the NAs in col1 by the overall mean for col1
    list(Sepal.Length = mean_sl,
         # replace the NAs in col2 by the overall median for col2
         Sepal.Width = median_sw))

  
# Suggestion use a method that accounts for the remaining variables in your data
pacman::p_load(VIM)

# kNN method does;
## for every observation that has a missing data, it computes the distance between
## that observation and the remaining observations
### ranks the observations based on min distance
### picks the top 5 (changeable) observation
### if I had a numeric column, uses the median of the five observations for imputing
### if I had a cat column, uses the maxCat of the five observations for imputing

df_complete = kNN(df_missing)
df_complete %>% tibble()
