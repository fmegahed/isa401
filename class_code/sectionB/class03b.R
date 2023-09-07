
# the pipe operator |> (%>% -- needs dplyr or magrittr to be loaded)
# takes the output from the previous step (typically a function or an object)
# and passes it as the first argument to the function of the right
miami_ids = c(54789, 'c9861') |> 
  as.numeric() |> 
  mean(na.rm = TRUE)

c(54789, 'c9861') |> 
  as.numeric() |> 
  mean(na.rm = TRUE) -> fadel

m_ids = c(54789, 'c9861')
m_ids = as.numeric(m_ids)
m_i = as.numeric( c(54789, 'c9861')  )

dbl_vec = c(1L,4L, 9.7) 

int_vec1 = c(1, 4, 9) #@ this is not an integer vector

# but the one below is because we specified using L
int_vec2 = c(1L, 4L, 9L)

int_vec3 = 1:10

int_vec4 = seq(from = 1L, to = 9L, by = 2L)



# * List Subsetting -------------------------------------------------------

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)

big_list = list(first_el = lst, second_el = iris)
str(big_list)


trial1 = big_list[1]
trial2 = big_list[[1]]
trial3 = big_list[[2]]
trial4 = big_list[[2]][['Species']]


second_el = iris
second_el[1,1]
tibble::tibble(second_el)



# * Reading CSVs ----------------------------------------------------------



# * * Local File ----------------------------------------------------------

install.packages('tidyverse') # we only run this once on a given PC

burrow_df = readr::read_csv('burrow_career_stats.csv', skip = 1)

dplyr::glimpse(burrow_df)


