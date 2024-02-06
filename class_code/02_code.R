
# * Error examples --------------------------------------------------------

x2 = 401
x2



# * Subsetting Lists ------------------------------------------------------

# you can be intentional about the naming of the sublists (if you wanted)
lst <- list( # list constructor/creator
  nums = 1:3, # atomic double/numeric vector  of length = 3
  alpha = "a", # atomic character vector of length = 1 (aka scalar)
  true_false = c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  other_numbs = c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list


# subsetting is the idea of getting a subset from your original data

# goal is to get the true and false values as a logical vector

sol_w = lst[3] # this will return a list that contains that vector
sol_w_2 = lst['true_false'] # this will also return a list that contains that vec

# to get a vector, you need to use two [[]]
sol_c = lst[[3]]
sol_w_2 = lst[['true_false']]

# let us say that I wanted to retun the FALSE value (knowing its in pos 2)
fal1 = sol_c[2]

fal2 = lst[['true_false']][2]



# * Functions -------------------------------------------------------------

temp_high_forecast = c(86, 84, 85, 89, 89, 84, 81)
mean(temp_high_forecast, na.rm = TRUE)

?mean
