
# * R Operators -----------------------------------------------------------

x1 = 7

# if I were to show an example of an Error
X1 # what is the value of X1? This will return an error bec R is case sens

# we need to use the correct casing
x1 # works bec x is lower case on line 4

x2 = 5
x2


# I could ask R whether x2 is larger than x1
# if this is true, it would return TRUE; otherwise, FALSE
x2 > x1
x2 < x1



# * R Syntax --------------------------------------------------------------

set.seed(2024) # this will ensure that the generated random numbers are the same for us

x_vec = rnorm(n=10, mean = 0, sd = 1) # generating std normal dist data
x_vec > 0 # finding which elements in x are larger than 0
sum(x_vec > 0 )


# * Data Types ------------------------------------------------------------

mixed_vec = c("ISA", 401) # this produces a chr vector bec this is the more general storage representation for this data
class(mixed_vec)

int_vec = c(401, 419) # this will not produce an int vector per the global env and the class() fun
class(int_vec)

int_vec2 = c(401L, 419L) # the L makes it  an int
class(int_vec2)

# as the mixed_vec
mixed_vec2 = c(401L, 419)

# chr vec
chr_vec = c('ISA', "FIN")
chr_vec


# lst
lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list

str(lst)

two_brackets = lst[[4]] # returns the data in its own shape c(2.3, 5.9) i.e. a num vec
one_bracket = lst[4] # returns a list of size 1 (because I only have 1 number) --> sublist here is a numeric vector



# * Tibble vs a data frame ------------------------------------------------

df1= iris
df1


tbl1 = tibble::tibble(df1)
tbl1
