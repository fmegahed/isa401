

# * Assignment 03 ---------------------------------------------------------
if(require(pacman) == FALSE) install.packages("pacman")
pacman::p_load(tidyverse)

?read_rds
?readRDS

# question 2
df_readr = read_rds('data/patterson_cafe_yelp_reviews.rds')
df_base = readRDS('data/patterson_cafe_yelp_reviews.rds')

# question 3
class(df_readr$review_date)
class(df_base$review_date)

# question 5
sum(df_readr$score >= 4)
rows_gte_4 = df_base[ df_base$score >=4, ] 
df_readr %>% filter(score >=4) -> rows_gte_4_b




# * Reading your First Webpage --------------------------------------------

pacman::p_load(tidyverse, rvest)

step0_mu_link = "https://bulletin.miamioh.edu/courses-instruction/isa/"

step1_mu_bulletin = read_html(step0_mu_link)
step1_mu_bulletin

step2_titles = html_elements(
  x = step1_mu_bulletin,
  css = "#sc_sccoursedescs > div > p.courseblocktitle > strong")

step2_titles_sel_gadget = html_elements(
  x = step1_mu_bulletin,
  css = "p.courseblocktitle > strong"
)

step2_titles
tail(step2_titles)
#sc_sccoursedescs > div:nth-child(5) > p.courseblocktitle > strong


step3_titles = html_text2(step2_titles)
step3_titles


# * * Can we do the same for the course descriptions? ---------------------
step2_desc = html_elements(
  x = step1_mu_bulletin,
  css = "#sc_sccoursedescs > div > p.courseblockdesc")

step3_desc = html_text2(step2_desc)
step3_desc


# * * Combine the results -------------------------------------------------
# prereq: number of elements have to be equal
isa_courses_tbl = 
  tibble(
    course_title = step3_titles,
    `course description` = step3_desc
  )



# * Plane Crashes ---------------------------------------------------------

step0_plane = "http://www.planecrashinfo.com/2022/2022.htm"

step1_plane = read_html(step0_plane)

step2_plane = html_elements(step1_plane, "table")

step3_plane = html_table(step2_plane)[[1]]

write_csv(step3_plane, 'data/plane_crashes22.csv')


# * You should not always scrape a webpage --------------------------------
if(require(robotstxt)==FALSE) install.packages("robotstxt")

robotstxt::paths_allowed(paths  = "courses-instruction/isa/", 
                         domain = "miamioh.edu", bot    = "*")
