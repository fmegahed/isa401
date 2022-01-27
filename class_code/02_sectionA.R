x1 = 3

x1 > 5 # checking whether x1 is larger than 5 (returned FALSE)

x1 < 5 

x2



# Sublists names --------------------------------------------------------
lst <- list( # list constructor/creator
  sub1 = 1:3, # atomic double/numeric vector  of length = 3
  sub2 = "a", # atomic character vector of length = 1 (aka scalar)
  sub3 = c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  sub4 = c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list



# The mean function -----------------------------------------------------
x2 = 1:10

mean(x = x2, na.rm = TRUE, trim = 0) # will work

mean(x = x2,0, TRUE)
