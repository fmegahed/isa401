# Introduction to R


# * Operators and Retrieval -----------------------------------------------

x1 = 10
x1

X1 # This will also result in an error because x1 is lower and not upper case
x # this is likely a typo where I missed a letter

x1 + 7

isa_names = c('ISA 401', 'ISA 501', 'ISA 444')
'ISA 321' %in% isa_names # %in% is often used to check for whether a string is in a character vector


# * Data Types ------------------------------------------------------------

int_vec_ex = c(1L, 5L, 10L)
int_vec_ex2 = 1:10
typeof(int_vec_ex)
class(int_vec_ex)

# atomic vectors have to be of the same type
numeric_vec = c(20, 5L, 10L)
typeof(numeric_vec)
class(numeric_vec)

# What happens here?
vec_ex = c('ISA', 401, 501) # R defines the class to be the most generalizable from the classes you have
vec_ex2 = as.numeric(vec_ex)
vec_ex2


# * Data Structures -------------------------------------------------------


# * * Lists ---------------------------------------------------------------

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9), # atomic double/numeric vector of length =3
  c('ISA', '401')
)
lst # printing the list

str(lst) # str returns the internal structure of the object

# In R, we use square brackets [] for subsetting objects
sublist1 = lst[1] # one [] returns a list
sublist1b = lst[[1]] # two will return the underlying form of data


# * * Matrices ------------------------------------------------------------

set.seed(2022) # ensures that we all have the same random numbers
x_mat = matrix( sample(1:10, size = 4), nrow = 2, ncol = 2 ) 
str(x_mat) # its structure?
x_mat

# indexing in a matrix
x_mat[1, 2] # first row and second col
x_mat[ , ] # this means print all rows (because its empty before the comma) and all cols (empty after)
x_mat[1, ]



# * Data Frames vs Tibbles ------------------------------------------------
install.packages('tidyverse')
library(tidyverse)

df1 <- data.frame(x = 1:3, y = letters[1:3])
df1
str(df1)

df2 <- tibble(x = 1:3, y = letters[1:3])
df2

subset_df2 = df2[1,1]
subset_df2b = df1[1,1]



# * Functions -------------------------------------------------------------

?mean
