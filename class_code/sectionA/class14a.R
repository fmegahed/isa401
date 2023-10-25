
# * Q3 --------------------------------------------------------------------

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list

q3 = lst[2]



# * Q4 --------------------------------------------------------------------

q4 = jsonlite::fromJSON('food_recipes.json')

q4[38,]



# * Q8 --------------------------------------------------------------------

"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements("a.newsEntryHeadline") |> 
  rvest::html_attr(name = 'href')



# * Q9 --------------------------------------------------------------------



# * Market API ------------------------------------------------------------

request = 'http://api.marketstack.com/v1/eod?access_key=e5d7f69cb77d229bebbbedb01d5797c8&symbols=AAPL,GOOG,TSLA&date_from=2023-07-03&date_to=2023-09-29'

response = jsonlite::fromJSON(request)

data1 = response$data

request2 = 'http://api.marketstack.com/v1/eod?access_key=e5d7f69cb77d229bebbbedb01d5797c8&symbols=AAPL,GOOG,TSLA&date_from=2023-07-03&date_to=2023-09-29&limit=1000'

response2 = jsonlite::fromJSON(request2)

data2 = response2$data



# * Tidy or NOT -----------------------------------------------------------

wb_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/wb_hospital_beds.csv')

# reading the data from my github repo to avoid an issues with file location
ntse_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/ntse_endowment_us_and_canada_2020.csv')

# a glimpse of the data
# for this analysis, do NOT convert chr to factors (do not worry about this)
dplyr::glimpse(ntse_tbl)
