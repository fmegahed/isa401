# Code written in class on Feb 07, 2022
## Introduction to Web Scraping


# * Loading the required packages -----------------------------------------
pacman::p_load(tidyverse, 
               rvest, # for web scraping in R 
               lubridate, # fix the date column
               magrittr) # has some pipe and extract functions that we may use


# * Plane Crash Table for 2021 --------------------------------------------

read_html("http://www.planecrashinfo.com/2021/2021.htm") %>% 
  # select html elements of interest (the only table)
  html_elements("table") %>% 
  # we clean tables via html_table and not html_text2
  html_table() -> crashes2021

# Given that the output is a list of 1, we will extract that out
# the result should be a tibble of 10 obs and 4 var
# based on inspecting global environment
crashes2021 = crashes2021[[1]] 
crashes2021


# * * Fixing the column names issue ---------------------------------------

# Approach 1
### Rename the column names to row 1, and then
### Delete the first row

colnames(crashes2021) = crashes2021[1, ] # the first row
crashes2021[-1, ]
crashes2021 = crashes2021[2:10, ]

# optional - implemented based on a comment in class
# we will do this in the future as well
crashes2021$Date = dmy(crashes2021$Date)
glimpse(crashes2021) # prints the structure of the tibble

# Approach 2
read_html("http://www.planecrashinfo.com/2021/2021.htm") %>% 
  # select html elements of interest (the only table)
  html_elements("table") %>% 
  # we clean tables via html_table and not html_text2
  html_table(header = 1) %>% # header = 1 (use first row as header)
  # extract2 from magrittr is equivalent of [[]]
  # extract the first sublist [[1]]
  extract2(1) -> 
  crashes2021b




# * For loops -------------------------------------------------------------

# Very basic description of what a for loop does
# repeat the operation below 10 times while incrementing i by 1
for (i in 1:10) {
  print("----")
  print(i)
  print("---")
}



# * * For Scraping --------------------------------------------------------

base_url = "http://www.planecrashinfo.com/"
years = 2017:2021 # 5 years (as an example)

# initializing the results object
crashes_5yrs = tibble()

for (i in 1:5) {
url_interest = paste0(base_url,
                      years[i],
                      "/",
                      years[i],
                      ".htm")  

read_html(url_interest) %>% 
  # select html elements of interest (the only table)
  html_elements("table") %>% 
  # we clean tables via html_table and not html_text2
  html_table(header = 1) %>% # header = 1 (use first row as header)
  # extract2 from magrittr is equivalent of [[]]
  # extract the first sublist [[1]]
  extract2(1) ->
  temp_tbl

# I will overwrite temp_tbl as I increment in the loop
# so need to save the results somehow
  crashes_5yrs = rbind(crashes_5yrs, temp_tbl)

}


# Approach 2 - write your own function
## follows the good practice of do not copy your code more than twice

scrape_crash_site = function(x){
  read_html(x) %>% 
    # select html elements of interest (the only table)
    html_elements("table") %>% 
    # we clean tables via html_table and not html_text2
    html_table(header = 1) %>% # header = 1 (use first row as header)
    # extract2 from magrittr is equivalent of [[]]
    # extract the first sublist [[1]]
    extract2(1) -> results
  
  return(results)
}

# we checked that the function is working here
scrape_crash_site(x = "http://www.planecrashinfo.com/2021/2021.htm")

# with a bit of luck, I was able to create the vector of webpages (urls)
vector_of_urls = paste0(base_url,
                         2017:2021,
                         "/",
                         2017:2021,
                         ".htm")    


# We will be applying the function repeatedly with the data above
# We want to return a data frame object
# We will use a function called map_df from purrr (loaded with tidyverse)

crashes_5yrsb = map_df(.x = vector_of_urls,
                       .f = scrape_crash_site)






# * Scraping all the pdfs -------------------------------------------------

"https://github.com/fmegahed/isa401/tree/main/PDFs" %>% 
  # reading the html as always
  read_html() %>% 
  # specifying the css selector
  html_elements("div.flex-auto.min-width-0.col-md-2.mr-3 > span > a") %>% 
  # extracting the hyperlinks
  html_attr('href') %>% 
  # making it a full link
  url_absolute(base = 'https://github.com/') -> 
  pdf_links


pdf_links = str_replace(string = pdf_links,
            pattern = "blob",
            replacement = "raw") 

pdf_links[1]
"https://github.com/fmegahed/isa401/raw/main/PDFs/01_Introduction.pdf"

number_do_pdf_vec = paste0("0", 1:5, ".pdf")

map2(.x = pdf_links[1:5], 
     .y = number_do_pdf_vec,
     .f = download.file,
     mode = "wb")


download.file(url = pdf_links[1:5],
              destfile = number_do_pdf_vec,
              mode = "wb")




