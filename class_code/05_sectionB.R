# Code written in class on Feb 07, 2022
## Introduction to Web Scraping


# * Loading the required packages -----------------------------------------
if(require(pacman)== FALSE) install.packages("pacman")
pacman::p_load(tidyverse, 
               rvest, # for web scraping in R 
               magrittr) # has some pipe and extract functions that we may use

# * Scraping Plane Crashes ------------------------------------------------


# * * Singular Table ------------------------------------------------------

read_html("http://www.planecrashinfo.com/2021/2021.htm") %>% 
  html_elements("table") %>% 
  html_table() %>% .[[1]] -> crashes2020a

read_html("http://www.planecrashinfo.com/2021/2021.htm") %>% 
  html_elements("table") %>% 
  html_table() %>% extract2(1) -> crashes2020b

crashes2020a


# * * Approach 1 based on Benen's Suggestion ------------------------------
read_html("http://www.planecrashinfo.com/2021/2021.htm") %>% 
  html_elements("table") %>% 
  html_table(header = 1) %>% .[[1]] -> crashes2020_cleaned1



# * * Approach 2 - Subsetting ---------------------------------------------

# we will update the 2020a as an example
# Step 1 - rename column names to first row
colnames(crashes2020a) = crashes2020a[1, ]
crashes2020a

# Step 2 - what do we need to do next?
# remove first row from the tibble
crashes2020a = crashes2020a[2:10, ]
# crashes2020a = crashes2020a[-1, ] would have also worked

write_csv(x = crashes2020_cleaned1,
          file = 'Data/05_plane_crashes2020.csv')



# * Scraping 5 Years of Crashes -------------------------------------------


# * * Approach 1: For Loops -----------------------------------------------

# for loop
for (i in 1:3) {
  print(i)
  print("_____")
}


# to increment the url
base_url = "http://www.planecrashinfo.com/"
years = 2017:2021

# initialize an empty tibble
all_crashes = tibble()

for (i in 1:5) {
  crash_url = paste0(base_url,
                     years[i],
                     "/",
                     years[i],
                     ".htm"
                     )
  
  read_html(crash_url) %>% 
    html_elements("table") %>% 
    html_table(header = 1) %>% .[[1]] -> temp_crashes
  
  all_crashes = rbind(all_crashes,
                      temp_crashes)
}


# * Approach 2: Vectorization ---------------------------------------------

scrape_crashes = function(x){
  read_html(x) %>% 
    html_elements("table") %>% 
    html_table(header = 1) %>% .[[1]]
}

# all what I need to do is give it a vector of URLs

crash_urls = paste0(base_url,
                   2017:2021,
                   "/",
                   2017:2021,
                   ".htm"
)
crash_urls

# Vectorized R
all_crashes2 = map_df(.x = crash_urls,
                      .f = scrape_crashes)

setdiff(all_crashes, all_crashes2)



# * Downloading all the pdfs for this class -------------------------------

## Wrinkle 1: Different Site
## Wrinkle 2: We do not need the text (we need an attribute)

"https://github.com/fmegahed/isa401/tree/main/PDFs" %>% 
  read_html() %>% 
  html_elements("div.flex-auto.min-width-0.col-md-2.mr-3 > span > a") %>% 
  # we want to extract the attribute link/href
  html_attr('href') %>% 
  # making the url complete
  url_absolute(base = 'https://github.com/') %>% 
  # we will replace blob with raw per observing the actual webpage
  str_replace(pattern = 'blob', replacement = 'raw') -> pdf_links

pdf_links = pdf_links[1:5]


# Downloading via the for loop
# simple file names
file_names1 = paste0("0", 1:5, ".pdf")

# complicated file names
list_strings = str_split(string = pdf_links,
          pattern = '/')

# we want the nineth element from each list
# we learned that it is the 9th element in each list by printing 
# list_strings
file_names2 = map_chr(.x = list_strings, .f = extract2, 9) %>% .[1:5]



for (i in 1:5) {
  download.file(url = pdf_links[i],
                destfile = file_names2[i],
                mode = 'wb')
}

# looping over two inputs for the download function with a third
# argument being fixed
map2(.x = pdf_links, .y = file_names1, .f = download.file,
     mode = 'wb')


