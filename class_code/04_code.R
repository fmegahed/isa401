

# * ISA Course Titles -------------------------------------------------------


# * * Using the SelectorGadget Extension ----------------------------------

# would install rvest if it is not in your PC
if(require('rvest') == F) install.packages('rvest')


# * * * With No Pipes -----------------------------------------------------

step0 = 'https://bulletin.miamioh.edu/courses-instruction/isa/'

# essentially reads the raw HTML document into R
# view-source:https://bulletin.miamioh.edu/courses-instruction/isa/
step1 = rvest::read_html(x = step0)

# Step2 we will select pieces of the page that we are interested in
# where we will use HTML Tags / the CSS to keep only what we want to scrape
step2_titles = rvest::html_elements(
  x = step1, # the raw HTML read into a R object
  css = 'strong' # or p strong and that was based on the selector gadget
)

step2_titles[[1]] # the output here is HTML stored within the list
print(step2_titles)

# Step 3 cleans the output and makes it human readable
# html_text2() should be used when you do not have a table and 
# you are not extracting a URL
step3_titles = rvest::html_text2(x = step2_titles)
step3_titles



# * * * With pipes (do not store intermediate objects) --------------------

titles_1 = 
  step0 |> # take step0 and pass it as the first argument to the next function
  rvest::read_html() |> # the output from this line is passed as the first argument for the next function
  rvest::html_elements(css = 'strong') |> 
  rvest::html_text2()

step0 |> # take step0 and pass it as the first argument to the next function
  rvest::read_html() |> # the output from this line is passed as the first argument for the next function
  rvest::html_elements(css = 'strong') |> 
  rvest::html_text2() -> titles_2

# they are identical
head(titles_1)
step3_titles











# * * Using Inspect -------------------------------------------------

# there are several possible valid css selectors
# we got the selector below, by right clicking on a course title and then removing: nth-child()
# obviously the value within the nth-child is going to depend on which course you picked
step0 |> 
  rvest::read_html() |> 
  rvest::html_elements(css = "#sc_sccoursedescs > div > p.courseblocktitle > strong") |> # will be selected using the inspector in Chrome
  rvest::html_text2() -> titles_3

step0 |> 
  rvest::read_html() |> 
  rvest::html_elements(css = "#sc_sccoursedescs > div > p.courseblocktitle") |> # will be selected using the inspector in Chrome
  rvest::html_text2() -> titles_3b





# * Pull the ISA Course Descriptions --------------------------------------

# save them into a vector that is called course_desc
# FYI this will also have 50 elements


step1 |> # technically this is a better start so I do not read the page from the web multiple times
  rvest::html_elements(css = "div p") |> # will be selected using the inspector in Chrome
  rvest::html_text2() -> not_a_perfect_result

step1 |> # technically this is a better start so I do not read the page from the web multiple times
  rvest::html_elements(css = ".courseblockdesc") |> # will be selected using the inspector in Chrome
  rvest::html_text2() -> course_desc_b

head(course_desc_b)

step1 |> # technically this is a better start so I do not read the page from the web multiple times
  rvest::html_elements(css = "#sc_sccoursedescs > div > p.courseblockdesc") |> # will be selected using the inspector in Chrome
  rvest::html_text2() -> course_desc_c

# The purpose behind the new couple of lines is to show you that
# SOMETIMES seemingly bad results are NOT too bad
# The logic was when we printed out the not_a_perfect_result
# elements after 100 were not relevant
# odd before 100 contained course titles and the even contained their description
course_titles = not_a_perfect_result[seq(from = 1, to = 100, by =2)]
course_desc_a = not_a_perfect_result[seq(from = 2, to = 100, by =2)]



# * Let us put the results in a data frame --------------------------------

# This will only work if the vectors are of the same size

isa_courses_tbl = tibble::tibble(
  'course_title' = course_titles,
  'course_description' = course_desc_a
)

isa_courses_df = data.frame(
  'course_title' = course_titles,
  'course_description' = course_desc_a
)

readr::write_csv(x = isa_courses_tbl, file = 'data/isa_courses.csv')



# * Flight Crash Data -----------------------------------------------------

plane_webpage_in_r = rvest::read_html("https://www.planecrashinfo.com/2024/2024.htm")

plane_webpage_in_r |> 
  rvest::html_elements("body > div:nth-child(2) > center > table") |> 
  # this is only for this specific page because the header did not have a th tag
  rvest::html_table(header = 1) -> plane_2024

plane_2024 = plane_2024[[1]] # this would work


# Given that there is only one table that I am interested in 
plane_webpage_in_r |> 
  # removed the s from elements and this will automatically pick the first element
  # that matches my CSS selector
  rvest::html_element("body > div:nth-child(2) > center > table") |> 
  # this is only for this specific page because the header did not have a th tag
  rvest::html_table(header = 1) -> plane_2024_df

# In general, I do not recommend using the html_element() unless you really want
# 1 "thing" that matches your CSS selector
