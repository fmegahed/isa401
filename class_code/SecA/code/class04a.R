

# * ISA Course List (Inspect) ---------------------------------------------

# step 0 is just knowing the URL (this can be somewhat tricky if the page URL updates)
step0 = "https://bulletin.miamioh.edu/courses-instruction/isa/"

# read the HTML into R
# which is essentially putting the text in view-source:https://bulletin.miamioh.edu/courses-instruction/isa/
# into your R session
# read the HTML from the URL stored in step 0
step1 = rvest::read_html(x = step0)

# #sc_sccoursedescs > div:nth-child(1) > p.courseblocktitle > strong
# from the selector above, we will look at the impact of that nth-child(1)
step2a_not_what_we_want = rvest::html_elements(
  x = step1, 
  css = "#sc_sccoursedescs > div:nth-child(1) > p.courseblocktitle > strong"
  )
step2a_not_what_we_want # this only captures the "first" course bec of the nth-child part

step2_titles = rvest::html_elements(
  x = step1, 
  css = "#sc_sccoursedescs > div > p.courseblocktitle > strong"
)
step2_titles

# in step 3, we will make the output human readable by removing the HTML tags
step3_titles = rvest::html_text2(step2_titles)
step3_titles



# * Course Descriptions (Inspector) ---------------------------------------

# I do not need to redo steps 0 and 1 bec the URL and webpage are the same

# #sc_sccoursedescs > div:nth-child(43) > p.courseblockdesc
step2_desc = rvest::html_elements(step1, "#sc_sccoursedescs > div > p.courseblockdesc")

step3_desc = rvest::html_text2(step2_desc)

isa_df = data.frame(
  title = step3_titles, description = step3_desc
)



# * Course Desc (Selector Gadget) -----------------------------------------

step2_desc_sg = rvest::html_elements(step1, ".courseblockdesc")
step3_desc_sg = rvest::html_text2(step2_desc_sg)



# * 2024 Plane Crashes ----------------------------------------------------

"https://www.planecrashinfo.com/2024/2024.htm" |> # step 0 know the URL
  rvest::read_html() |> # step 1 where we import the raw HTML into R
  rvest::html_elements("body > div > center > table") |> # this is the selector for inspector
  rvest::html_table()

# There are multiple issues with the output above
# [1] We probably want to break the columns better (e.g., JapanJapan)
# [2] Did not save our column names (it considered them to be the first row of data)

# Let us start with number [2]
"https://www.planecrashinfo.com/2024/2024.htm" |> # step 0 know the URL
  rvest::read_html() |> # step 1 where we import the raw HTML into R
  rvest::html_elements("body > div > center > table") |> # this is the selector for inspector
  rvest::html_table(header = TRUE) -> scraped_table

scraped_table = scraped_table[[1]] # this will convert the list of 1 tibble into a tibble

# this code below cleans the data and separates columns that contained multiple variables
scraped_table |> 
  tidyr::separate(
    col = `Location / Operator`,
    into = c("location", "operator"),
    sep = ",\\s*(?=[^,]+$)"
  ) |> # but we need some additional cleaning (we will separate the operator into two columns)
  tidyr::separate(
    col = "operator",
    into = c("state/country", "operator"),
    sep = "(?<=[a-z])(?=[A-Z])"
  ) |> # here we used the default separator to non alpha-numeric chrs bec /, "(", ")"
  tidyr::separate(
    col = "Fatalities",
    into = c("fatalities", "passengers", "ground", "junk")
  ) |> 
  # we will change the Date column into date and the fatalities, passengers, ground into numeric
  dplyr::mutate(
    Date = lubridate::dmy(Date), # this will convert date from a string to a Date (func name is a function of how the date was stored)
    # we converted the three chr variables into numeric
    fatalities = as.numeric(fatalities),
    passengers = as.numeric(passengers),
    ground = as.numeric(ground)
  ) -> scraped_table
  


# * Convert the Previous Code into a function -----------------------------

scrape_crash_data = function(url){
  url |> # THIS CHANGED FROM A string of the URL to the url variable which is the func's only input
    rvest::read_html() |> # step 1 where we import the raw HTML into R
    rvest::html_elements("body > div > center > table") |> # this is the selector for inspector
    rvest::html_table(header = TRUE) -> scraped_table
  scraped_table = scraped_table[[1]] # this will convert the list of 1 tibble into a tibble
  # this code below cleans the data and separates columns that contained multiple variables
  scraped_table |> 
    tidyr::separate(
      col = `Location / Operator`,
      into = c("location", "operator"),
      sep = ",\\s*(?=[^,]+$)"
    ) |> # but we need some additional cleaning (we will separate the operator into two columns)
    tidyr::separate(
      col = "operator",
      into = c("state/country", "operator"),
      sep = "(?<=[a-z])(?=[A-Z])"
    ) |> # here we used the default separator to non alpha-numeric chrs bec /, "(", ")"
    tidyr::separate(
      col = "Fatalities",
      into = c("fatalities", "passengers", "ground", "junk")
    ) |> 
    # we will change the Date column into date and the fatalities, passengers, ground into numeric
    dplyr::mutate(
      Date = lubridate::dmy(Date), # this will convert date from a string to a Date (func name is a function of how the date was stored)
      # we converted the three chr variables into numeric
      fatalities = as.numeric(fatalities),
      passengers = as.numeric(passengers),
      ground = as.numeric(ground)
    ) -> scraped_table
  return(scraped_table) # ADDITION to PREVIOUS CODE: R functions return a single object and here it is our scraped table
}

df_2024 = scrape_crash_data(
  url = "https://www.planecrashinfo.com/2024/2024.htm"
)
df_2023 = scrape_crash_data(
  url = "https://www.planecrashinfo.com/2023/2023.htm"
)


# * Scraping Multiple Pages (R Way) ---------------------------------------

# we will generate a chr vector of URLS

urls_for_crashes = 
  paste0("https://www.planecrashinfo.com/", 2023:2024, "/", 2023:2024, ".htm" )
  
# I can use my function to scrape the data from these 4 URLS

# Approach 1: The Non R Way
crash_df1 = tibble::tibble() # initialized the df
for (i in 1:length(urls_for_crashes)) {
  URL = urls_for_crashes[i]
  df = scrape_crash_data(url = URL)
  
  output = dplyr::bind_rows(crash_df1, df)
}

# Approach 2: The R Way
crash_df2= purrr::map_df(.x = urls_for_crashes, .f = scrape_crash_data)



  
  
  
  
  