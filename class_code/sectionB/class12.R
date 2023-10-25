
# * Q3 --------------------------------------------------------------------

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list

q3 = lst[2]



# * Recipes ---------------------------------------------------------------

food = jsonlite::fromJSON("food_recipes.json")
food[38,]



# * MU Policies -----------------------------------------------------------

## using the inspector

"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements("a.newsEntryHeadline") |> 
  rvest::html_attr(name = 'href') -> sol1
sol1

"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements(".newsEntryHeadline") |> 
  rvest::html_attr(name = 'href') -> sol2
sol2

"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements("div a") |> 
  rvest::html_attr(name = 'href') -> sol3
sol3 = sol3[37:66]




# * Market API ------------------------------------------------------------

request = "http://api.marketstack.com/v1/eod?access_key=e5d7f69cb77d229bebbbedb01d5797c8&symbols=AAPL,GOOG,TSLA&date_from=2023-07-03&date_to=2023-09-29&limit=1000"
example_response = jsonlite::fromJSON(request)

data1 = example_response$data

avi = "http://api.marketstack.com/v1/eod/2023-09-29?access_key=e5d7f69cb77d229bebbbedb01d5797c8&symbols=AAPL,GOOG,TSLA&limit=1000"
resp = jsonlite::fromJSON(avi)[['data']]



# * WB tbl ----------------------------------------------------------------

wb_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/wb_hospital_beds.csv')



# * Endowment -------------------------------------------------------------

# reading the data from my github repo to avoid an issues with file location
ntse_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/ntse_endowment_us_and_canada_2020.csv')

# a glimpse of the data
# for this analysis, do NOT convert chr to factors (do not worry about this)
dplyr::glimpse(ntse_tbl)
