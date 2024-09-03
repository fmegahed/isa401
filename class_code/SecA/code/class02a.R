

# * Assignment Operators --------------------------------------------------


x1 = 7

x2 = 5
x2



# * Vector Operators ------------------------------------------------------

# here I am asking R whether x1 is less than x2
# from the values that we have, the answer should be FALSE
x1 < x2
x2 < x1 # this is correct so it will return TRUE


set.seed(2024) # ensures that we all generate the same random numbers
x_vec = rnorm(n=10, mean = 0, sd = 1) # generating std normal dist data
x_vec > 0 # finding which elements in x are larger than 0


# atomic vector basics
mixed_vec = c( 'ISA', 401 ) # this creates a character vector 
# bec you can store 401 as a string "401"

another_chr_vec = c("ISA", 'FIN')

# numeric variable/vector
x_num = c(4, 5)
# on the other hand, the L will force it to be an INT
x_int = c(4L, 5L)


# * Subsetting Lists ------------------------------------------------------

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list

lst[1] # returns a list (and I know that) bec it returned [[1]]
# if I want to be sure that it returns a list
output_1brac = lst[1]

lst[[1]]
output_2brac = lst[[1]]



# * Data Frame vs Tibble --------------------------------------------------

# install.packages("tidyverse") # run this once if you are using the same PC

df1 <- data.frame(x = 1:3, y = letters[1:3])
df1

tbl1 = tibble::tibble(df1)
tbl1
