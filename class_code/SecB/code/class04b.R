

# * Scraping Course Titles (Inspector) ------------------------------------

# knowing your URL; this can get a bit complicated if the URL changes when you load data
step0 = "https://bulletin.miamioh.edu/courses-instruction/isa/"

# Step1 : Read the HTML Page in R (this is the raw HTML and not the rendered page)
# essentially reading this view-source:https://bulletin.miamioh.edu/courses-instruction/isa/
step1 = rvest::read_html(x = step0) # this reads the data from the URL and saves what we saw in view-source in R in step1


# #sc_sccoursedescs > div:nth-child(1) > p.courseblocktitle > strong
# #sc_sccoursedescs > div:nth-child(2) > p.courseblocktitle > strong
step2_not_what_we_want = rvest::html_elements(
  x = step1, # the object where we stored the raw HTML
  css = "#sc_sccoursedescs > div:nth-child(1) > p.courseblocktitle > strong"
)

# del :nth-child(1) because I want to get all the course titles and not just the1st course
step2_titles = rvest::html_elements(
  x = step1, # the object where we stored the raw HTML
  css = "#sc_sccoursedescs > div > p.courseblocktitle > strong"
)

# step 3, we will clean the output by removing the HTML tags and saving this to a chr vec instead of list
step3_titles = rvest::html_text2(step2_titles )




# * Course Desc (Inspector) -----------------------------------------------

# no need to repeat steps 0 and 1 because we are reading the same URL and same raw HTML

# #sc_sccoursedescs > div:nth-child(1) > p.courseblockdesc

step2_desc = rvest::html_elements(x = step1, css = "#sc_sccoursedescs > div > p.courseblockdesc")

step3_desc = rvest::html_text2(step2_desc)

isa_df = data.frame(title = step3_titles, description = step3_desc)



# * Course Titles (selector gadget) ---------------------------------------
step2_titles_sg = rvest::html_elements(
  x = step1, # the object where we stored the raw HTML
  css = "strong"
)

step3_titles_sg = rvest::html_text2(step2_titles_sg)



# * Pulling the 2024 Data -------------------------------------------------

"https://www.planecrashinfo.com/2024/2024.htm" |>  # step0
  rvest::read_html() -> step1_crashes

step1_crashes |> 
  rvest::html_elements(css = "body > div:nth-child(2) > center > table") |> # step2 selecting a specific part of page
  rvest::html_table() # essentially step3 (we use html_table instead of html_text2 bec the selector is a table)

# what is wrong with the output below?
# [1] Some of the columns, e.g., the Location Operator column are read a bit "weird"
# e.g., Japan the country and Japan Airlines the airline are "squished" together
# [2] we did not read the column headers correctly
# This is in fact due to how THIS SPECIFIC WEBPAGE was coded

# We will start with problem [2]
step1_crashes |> 
  rvest::html_elements(css = "body > div:nth-child(2) > center > table") |> # step2 selecting a specific part of page
  rvest::html_table(header = TRUE)  -> scraped_table # made it a 7 by 4 tibble with row 1 being identified as colnames

# option 1 to convert the list into a tibble
scraped_tibble1 = scraped_table[[1]]

# option 2 would be to change the func _elements to _element
step1_crashes |> 
  rvest::html_element(css = "body > div:nth-child(2) > center > table") |> # step2 selecting a specific part of page
  rvest::html_table(header = TRUE)  -> 
  scraped_tibble2


# Fixing Issues with the actual table
scraped_tibble2

# Everything after Line 86 is per your special request
# needed if you were to read this data into Tableau/PowerBI
# but you do not have to do this in R

# Let us take the `Location / Operator` column
# we will EVENTUALLY Split into 3 columns
# [a] location as in Tokyo or as Fort Smith, NWT
# [b] Country/State
# [c] the Operator

# data needs to be a data frame so this is why we will not use the scraped_table and we will use _tibble2
tidyr::separate(data = scraped_table, col = `Location / Operator`, into = c('location', 'operator'))


scraped_tibble2 |> 
  tidyr::separate(col = `Location / Operator`, into = c('location', 'operator'), sep = ", (?=[^,]+$)") |> 
  # now we will split the operator col into two: 
  # the logic we have a lower case letter followed by an Upper case letter with no space
  tidyr::separate(operator, into = c("country", "airline"), sep = "(?<=[a-z])(?=[A-Z])") |> 
  # here we used the default sep of non alphanumeric chrs for separating the column
  tidyr::separate(Fatalities, into = c("fatalities", "passengers", "ground"), extra = 'drop') |> 
  dplyr::mutate(
    Date = lubridate::dmy(Date), # based on the fact that the date was DAY, MONTH, YR
    fatalities = as.numeric(fatalities),
    passengers = as.numeric(passengers),
    ground = as.numeric(ground)
  )


scrape_crash = function(plane_crash_url){
  
  plane_crash_url |>  # step0: MAIN CHANGE making the URL general
    rvest::read_html() -> step1_crashes
  
  step1_crashes |> 
    rvest::html_element(css = "body > div:nth-child(2) > center > table") |> # step2 selecting a specific part of page
    rvest::html_table(header = TRUE)  -> 
    scraped_tibble2
  
  scraped_tibble2 |> 
    tidyr::separate(col = `Location / Operator`, into = c('location', 'operator'), sep = ", (?=[^,]+$)") |> 
    # now we will split the operator col into two: 
    # the logic we have a lower case letter followed by an Upper case letter with no space
    tidyr::separate(operator, into = c("country", "airline"), sep = "(?<=[a-z])(?=[A-Z])") |> 
    # here we used the default sep of non alphanumeric chrs for separating the column
    tidyr::separate(Fatalities, into = c("fatalities", "passengers", "ground"), extra = 'drop') |> 
    dplyr::mutate(
      Date = lubridate::dmy(Date), # based on the fact that the date was DAY, MONTH, YR
      fatalities = as.numeric(fatalities),
      passengers = as.numeric(passengers),
      ground = as.numeric(ground)
    ) -> output # ADDITION: SAVE the output
  
  return(output) # return it to make it clear what we are returning
}

df2024 = scrape_crash(plane_crash_url = "https://www.planecrashinfo.com/2024/2024.htm")
df2023 = scrape_crash(plane_crash_url = "https://www.planecrashinfo.com/2023/2023.htm")


# * Multiple Being 2 URLs -------------------------------------------------
urls1 = c("https://www.planecrashinfo.com/2024/2024.htm", "https://www.planecrashinfo.com/2023/2023.htm")

urls2 = paste0("https://www.planecrashinfo.com/", 2023:2024, "/", 2023:2024, ".htm")

# THE R WAY
# applying our custom function to every element of the urls2 chr vector
crash_data = purrr::map_df(.x = urls2, .f = scrape_crash)

# For loops
for (i in 1:length(urls2)) {
  URL = urls2[i]
  print(URL)
  
  df = scrape_crash(URL)
  
  # how to not overwrite the 2023 data
}


