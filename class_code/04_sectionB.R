# Code written in class on Feb 02, 2022
## Introduction to Web Scraping


# * Loading the required packages -----------------------------------------
pacman::p_load(tidyverse, 
               rvest, # for web scraping in R 
               magrittr) # has some pipe and extract functions that we may use



# * Some pointers for the assignment --------------------------------------
??read_rds
?readRDS
?read_rds


# * Scraping ISA Course Titles --------------------------------------------


# * * Approach 1 (No piping) ----------------------------------------------

# getting the HTML page source into your R environment
step1_isa_webpage =  read_html(
  "https://bulletin.miamioh.edu/courses-instruction/isa/"
)
step1_isa_webpage # output must be a list of 2 (if its correct)
# list of 2 does not mean it is correct, but not being a list of 2 = wrong

# We will be selecting the parts of the webpage that we are interested in
# from the Edge Inspector -> we identified the tags/elements of interest
step2_course_titles = html_elements(
  x = step1_isa_webpage,
  css = "p.courseblocktitle > strong"
)
step2_course_titles # returned a list of 55 sublists
tail(step2_course_titles, n= 10) # printing last 10 sublists


# Cleaning the data to make it understandable by people
step3_course_titles = html_text2(x = step2_course_titles)
step3_course_titles # a character vector of 55 elements



# * * Approach 2 (Via the Pipe Operator) ----------------------------------
## Also an excuse for using a different selector (not unique)

# starting with the read_html document
step1_isa_webpage %>%
  # selecting the relevant HTML elements
  html_elements(css = "div.courseblock > p.courseblocktitle > strong") %>% 
  # cleaning the text
  html_text2() ->
  # save that to an object called isa_titles
  isa_titles

# confirming that the two approaches are identical
setdiff(isa_titles, step3_course_titles) # 0 differences


# * * Getting the Course Descriptions (a Focused Selector) ----------------

step1_isa_webpage %>% 
  html_elements(css = "p.courseblockdesc") %>% 
  html_text2() ->
  isa_course_desc



# * What to do if you used a not great selector? --------------------------

step1_isa_webpage %>%
  # selecting the relevant HTML elements
  html_elements(css = "p") %>% # saw that this resulted in 112 results
  # lets clean them
  html_text2() -> isa_all

isa_titles_2 = isa_all[seq(from = 1, to = 110, by = 2)]
isa_course_desc_2 = isa_all[seq(from = 2, to = 110, by = 2)]



# * Save your Results -----------------------------------------------------
isa_results = tibble(
  course_titles = isa_titles,
  `course descriptions` = isa_course_desc
)

write_csv(x = isa_results,
          file = "Data/isa_results_secB.csv")
