# This is the introductory code we wrote in class 02


# Operators -------------------------------------------------------------

x1 = 5

x1 + 3  -> y1 # reusing x1 (retrieving its value)


# Data Types and Data Structures ------------------------------------------

dept = c('ACC', 'ECO', 'FIN', 'ISA', 'MGMT')

nfaculty = c(18L, 19L, 14L, 25L, 22L)

nfaculty_non_int = c(18, 19L, 14L, 25L, 22L)

mixed_vec = c('ISA', 401)



# * * Lists ---------------------------------------------------------------

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list

sub_list_1_lst = lst[1]
sub_list_1_vec = lst[[1]]

lst[5] # will return NULL bec it does not exist


# * * Matrices ------------------------------------------------------------
set.seed(2022) # ensures that your random numbers are the same as mine
x_mat = matrix( sample(1:10, size = 4), nrow = 2, ncol = 2 ) 
str(x_mat) # its structure?

x_mat[ , ] # all rows (since before the comma is empty) and all cols (bec after the comma is empty)
x_mat[1, 2] # row 1 and col = 2
x_mat[c(1,2), 1] # pick rows 1 and 2 (you can use this if you wanted to pick rows 1, 3 and 4) and col 1

x_mat[1, 2] = 8 # overwriting this cell to a new value of 8
x_mat[1, 2] # print it



# * * Data frames vs tibbles ----------------------------------------------

if( require(pacman)==FALSE ) install.packages('pacman')
pacman::p_load(tidyverse) # load (or install and then load) the pkgs

df1 = data.frame(x = 1:3, y = letters[1:3])
df1_subset = df1[1,2] # if you were to have a single cell, R will change it to a singular value

df2 = tibble(x = 1:3, y = letters[1:3])
class(df2)
df2_subset = df2[1,2]
df2


# * Functions -------------------------------------------------------------
temp_high_forecast = c(86, 84, 85, 89, 89, 84, 81)
mean(x = temp_high_forecast)

mean(df1) # returns NA because the input x is not a numeric, date or logical vector
