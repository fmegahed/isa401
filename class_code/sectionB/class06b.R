

# * Single Webpage --------------------------------------------------------

rvest::read_html("https://www.planecrashinfo.com/2020/2020.htm") |> 
  # we want to select specific elements/nodes from that HTML
  rvest::html_elements(css = 'body > div:nth-child(2) > center > table') |> 
  # we will clean the table from the HTML tags to make it readable by a person
  # using the rvest::html_table() instead of the rvest::html_text2()
  # row 1 needs to be our header [SPECIFIC to THIS WEBPAGE]
  # I learned from the printed output
  rvest::html_table(header = 1)  |> 
  # I want to pull the df/tibble from the list
  # recall our pepper container example [[1]], will pull the first sublist
  # and will have it in its underlying data structure (tibble/df)
  #extract2 is the equivalent of [[]] and 1 is the first sublist
  magrittr::extract2(1) -> crash_data

# lubridate is a pkg in R to fix dates
crash_data$Date = lubridate::dmy(crash_data$Date)
crash_data


# no Pipe solution
step1 = rvest::read_html('https://www.planecrashinfo.com/2020/2020.htm')
step2 = rvest::html_elements(step1, css = 'body > div:nth-child(2) > center > table')
step3 = rvest::html_table(step2, header = 1)
step4 = step3[[1]]
step4$Date = lubridate::dmy(step4$Date)



# * All crashes from 2013:2020 --------------------------------------------

# Use for loops
# Uses custom_functions and a vectorized solution / list comprehension in Py

scrape_fun = function(crash_url){
  rvest::read_html(crash_url) |> 
    # we want to select specific elements/nodes from that HTML
    rvest::html_elements(css = 'body > div:nth-child(2) > center > table') |> 
    # we will clean the table from the HTML tags to make it readable by a person
    # using the rvest::html_table() instead of the rvest::html_text2()
    # row 1 needs to be our header [SPECIFIC to THIS WEBPAGE]
    # I learned from the printed output
    rvest::html_table(header = 1)  |> 
    # I want to pull the df/tibble from the list
    # recall our pepper container example [[1]], will pull the first sublist
    # and will have it in its underlying data structure (tibble/df)
    #extract2 is the equivalent of [[]] and 1 is the first sublist
    magrittr::extract2(1) -> crash_data
  
  # lubridate is a pkg in R to fix dates
  crash_data$Date = lubridate::dmy(crash_data$Date)
  
  return(crash_data)
}

# how do the URLs change (for a few URLs; c("", ""))
years = 2013:2020 # also seq(2013, by = 1, to = 2020)
urls = paste0("https://www.planecrashinfo.com/", years, '/', years, '.htm')

# I will apply the vector of URLs to my function
# the purrr library is installed with tidyverse
# from there we will be using the map_something group of functions that allow us 
# to take a vector and apply every element of that vector (iteratively/sequentially)
# to a given function (custom or not) and save the results based on _something
# here we are saving to a df/tibble
all_crashes = purrr::map_df(.x = urls, .f = scrape_fun)



