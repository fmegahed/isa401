# Code written in class on Feb 02, 2022
## Introduction to Web Scraping


# * Loading the required packages -----------------------------------------
pacman::p_load(tidyverse, 
               rvest, # for web scraping in R 
               magrittr) # has some pipe and extract functions that we may use



# * Some pointers for the assignment --------------------------------------

?readRDS
?read_rds



# * Scraping the ISA Website ----------------------------------------------


# * * Approach 1 (Saving all intermediate steps) --------------------------


step0 = "https://bulletin.miamioh.edu/courses-instruction/isa/"

# use r to get the entire page source into your PC
step1 = read_html(x = step0) # x gets assigned to the link
step1 # see object of type list


# specify which parts of the page that I am interested in
## for starters: we will scrape all course titles
step2_course_titles = html_elements(
  x = step1, 
  css = "p.courseblocktitle > strong"
  )
step2_course_titles

# make the obtained text easier to read and understand by an actual person
step3_course_titles = html_text2(x = step2_course_titles)
step3_course_titles



# * * Approach 2 (Using the Pipe) -------------------------------------------
### use a different HTML/CSS selector to show you that the solution is not 
### unique

# renaming step 1 to something meaningful
# you only need to read a given page once
isa_course_page = step1


isa_course_page %>% 
  # select relevant elements (for the titles)
  html_elements(css = "div.courseblock > p.courseblocktitle > strong") %>% 
  html_text2() -> 
  isa_titles

# showing you here that there are no differences between the object from
# approach 1 and approach 2
setdiff(isa_titles, step3_course_titles)




# * * Getting the Course Descriptions -------------------------------------
isa_course_page %>% 
  # select the relevant html elements based on inspecting the doc on Edge
  html_elements(css = "p.courseblockdesc") %>% 
  # converting it to readable text
  html_text2() ->
  isa_course_descriptions

isa_course_descriptions



# * * Not a unique selector (but reasonable results) ----------------------

isa_course_page %>% 
  # select the relevant html elements based on inspecting the doc on Edge
  html_elements(css = "p") %>% 
  # converting it to readable text
  html_text2() ->
  isa_all

head(isa_all, 10)

isa_course_descriptions_2 = isa_all[seq(from = 2, to = 110, by = 2)]
isa_course_titles_2 = isa_all[seq(from = 1, to = 110, by = 2)]


# Cleaning the "\n" from the course descriptions
# we replaced it with a space. 
isa_course_descriptions_cleaned = str_replace_all(
  string = isa_course_descriptions_2,
  pattern = "\\n", # used an extra \ as "\" is an escape seq so
  # I am telling R that I am intentionally looking for "\n"
  replacement = " "
)

# solely dependent on having both vectors to be of the same size
# if not you will get an error
isa_courses = tibble(course_title = isa_course_titles_2,
                     course_descriptions = isa_course_descriptions_2)

# exporting the results
write_csv(x = isa_courses,
          file = "Data/isa_courses.csv")
