
# * Plane Crash Example ---------------------------------------------------

rvest::read_html("https://www.planecrashinfo.com/2020/2020.htm") |> 
  # the css selector as copied from the inspector in Chrome
  rvest::html_elements('body > div:nth-child(2) > center > table') |> 
  # remove the html tags
  # for this specific example, we can see from the printout that the 
  # table header is saved in the first row of the output
  rvest::html_table(header = 1) -> crash_tbl

# we learned in subsetting a list that [[1]], will allow me to get the underlying
# structure for that first sublist (remember the pepper container example)

# option 1:
crash_df = crash_tbl[[1]]

rvest::read_html("https://www.planecrashinfo.com/2020/2020.htm") |> 
  # the css selector as copied from the inspector in Chrome
  rvest::html_elements('body > div:nth-child(2) > center > table') |> 
  # remove the html tags
  # for this specific example, we can see from the printout that the 
  # table header is saved in the first row of the output
  rvest::html_table(header = 1) |> 
  # this is essentially a function that does [[]]
  magrittr::extract2(1) -> crash_df2

# We can address the Date being a chr; to have the right class for it
# the lubridate pkg in R allows you to quickly fix date issues (from chr to Date)
# based on the printout we have day, month, year

crash_df$Date = lubridate::dmy(crash_df$Date)
crash_df


step0 = 'https://www.planecrashinfo.com/2020/2020.htm'
step1 = rvest::read_html(step0)
step2 = rvest::html_elements(step1, "body > div:nth-child(2) > center > table")
step3 = rvest::html_table(step2)
step4 = step3[[1]]

rvest::html_elements(rvest::read_html("https://www.planecrashinfo.com/2020/2020.htm"), "table")


# * Goal to scrape all crashes from 2013:2020 -----------------------------

scrape_crashes = function(x){
  # using the prior logic, we will allow the URL to change and we will define the argument as x
  rvest::read_html(x) |> 
    # the css selector as copied from the inspector in Chrome
    rvest::html_elements('body > div:nth-child(2) > center > table') |> 
    # remove the html tags
    # for this specific example, we can see from the printout that the 
    # table header is saved in the first row of the output
    rvest::html_table(header = 1) |> 
    # this is essentially a function that does [[]]
    magrittr::extract2(1) -> crash_df2
  
  return(crash_df2)
}

# Optional (saves a ton of time): next step is to create a way to dynamically generate the URLs
years = 2013:2020 # alternatively we could have seq(2013, by = 1, to=2020)

# paste0: puts strings next to each other with no space
urls = paste0("https://www.planecrashinfo.com/", years, "/", years, '.htm')

# we will apply the list of urls to our function
# given that we are passing a list to a function, we can:
# (a) use loops to iterate over the list (I will do that in Python)
# (b) preferred approach in R, is to use the purrr::map_something() to do what you want
# base R equivalent is the apply family of functions but they do not have consistent notation

# since I want a data frame back, I will use the purrr::map_df

all_crashes = purrr::map_df(.x = urls, .f = scrape_crashes )
tail(all_crashes) # shows the last 6 observations (head show first 6)
