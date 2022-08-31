

# * Assignment 03 ---------------------------------------------------------

# Question 1
pacman::p_load(tidyverse)
?readRDS
?read_rds


# Question 2
pattersona = read_rds('data/patterson_cafe_yelp_reviews.rds')
patterson_b = readRDS('data/patterson_cafe_yelp_reviews.rds')

# Question 3
class(pattersona$review_date)
class(patterson_b$review_date)

# Question 4
patterson_b[48, ]
pattersona[48, 'score']
patterson_b$score[48]


# Question 5
sum( pattersona$score >= 4 )
pattersona %>% filter(score >=4) -> q5
pattersona[ pattersona$score>=4 , ] -> q5b



# * Scraping your First Webpage -------------------------------------------

# install.packages("pacman")
pacman::p_load(rvest, tidyverse)

# * * Storing every step in an object -------------------------------------

step0_isa_link = "https://bulletin.miamioh.edu/courses-instruction/isa/"

step1_html_in_R = read_html(x = step0_isa_link)
step1_html_in_R # printing it to see what did we get

step2 = html_elements(x = step1_html_in_R,
                      css = "#sc_sccoursedescs > div > p.courseblocktitle > strong")

step2b = html_elements(x = step1_html_in_R,
                      css = "p.courseblocktitle > strong")
step2c = html_elements(x = step1_html_in_R,
                       css = "p> strong")
step2
tail(step2) # will print by default the last 6 elements


step3 = html_text2(x = step2)
step3



# * * Getting the course descriptions -------------------------------------
step2_desc = html_elements(step1_html_in_R,
                           css = "#sc_sccoursedescs > div > p.courseblockdesc")

step3_desc = html_text2(x = step2_desc)
step3_desc


step_isa_course_tbl = tibble(
  course_title = step3,
  course_desc = step3_desc
)

step_isa_course_tbl



# * Are we allowed to scrape the Miami Site -------------------------------

if(require(robotstxt)==FALSE) install.packages("robotstxt")
robotstxt::paths_allowed(paths  = "courses-instruction/isa/", domain = "miamioh.edu",
                         bot    = "*")



# * Plane crashes ---------------------------------------------------------
url_c = "http://www.planecrashinfo.com/2022/2022.htm"

step1_c = read_html(url_c)
step2 = html_element(step1_c, "table")
step3 = html_table(step2)
