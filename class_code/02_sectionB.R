
# Operators ---------------------------------------------------------------



x1 = 5

x2 <- 5

5 -> x3

x2

x1 < 3



# Atomic vectors ----------------------------------------------------------



x_vec = rnorm(n=10, mean = 0, sd = 1) # generating std normal dist data
x_vec > 0 # finding which elements in x are larger than 0

sum(x_vec > 0) -> sum_x

sum_x
sum_x[1]


# list --------------------------------------------------------------------

lst <- list( # list constructor/creator
  sublist1 = 1:3, # atomic double/numeric vector  of length = 3
  sublist2 = "a", # atomic character vector of length = 1 (aka scalar)
  sublist3 = c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  sublist4 = c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list



# * The mean function -----------------------------------------------------



