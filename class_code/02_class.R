

# * Assignment Operators --------------------------------------------------


x1 <- 5

x2 = 5

5 -> x3
print(paste0("The values of x1, x2, and x3 are ", x1, ", ", x2, ", and ", x3, " respectively"))



# * Logical Operators -----------------------------------------------------

x1 < 10

# ensure that the randomly generated numbers are the same (so you will have 7 T and 3 F)
set.seed(2025) 

x_vec = rnorm(n=10, mean = 0, sd = 1) # generate 10 standard normal obs

x_vec > 0 # R is vectorized, it will apply the ">0" for every element in x_vec
sum(x_vec > 0) # I do have 7 TRUE value



# * Integers --------------------------------------------------------------

isa = c(401L, 444L)

a_weired_atomic_vector = c(401L, 49.95)




# * Working with Lists ----------------------------------------------------

lst <- list( # list constructor/creator
  sub1 = 1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  sub3 = c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
str(lst) # printing the list



# * Subsetting Lists ------------------------------------------------------

sublist1 = lst['sub1'] # this will return a list that contains (2.3, 5.9) vector within it
extracting_the_vec = lst[['sub1']] # two squares to get the underlying data structure for sub1



# * Class Activity --------------------------------------------------------


temp_high_forecast = c(86, 84, 85, 89, 89, 84, 81, NA)
mean(x = temp_high_forecast)

mean(temp_high_forecast, na.rm = T)

mean(iris) # this returns a warning and NA because iris is a built-in data frame in R
# and this function cannot take data frames as an input