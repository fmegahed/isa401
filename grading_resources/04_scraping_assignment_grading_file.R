pacman::p_load(gradeR, testthat, tidyverse, rvest)


# * Question 1 ------------------------------------------------------------

yelp_robots_sol = 
  robotstxt::paths_allowed(paths  = "biz/pattersons-cafe-oxford/", domain = "https://www.yelp.com/", bot    = "*")

test_that('Yelp Reviews',
          {
            expect_equal(object = yelp_robots, expected = FALSE)
          })


# * Question 2 ------------------------------------------------------------

mu_page = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true'


mu_page %>% read_html() %>% 
  html_elements('table.waffle') %>% 
  html_table() %>% magrittr::extract2(1) -> lost_found_sol

class_lf = class(lost_found_sol)

test_that('Lost and Found Database : Found & Impounded Property Test',
          {
            expect_gte(object = dim(lost_found)[1], expected =  dim(lost_found_sol)[1])
            expect_equal(object = dim(lost_found)[2], expected = dim(lost_found_sol)[2])
            expect_equal(object = colnames(lost_found), expected = colnames(lost_found_sol))
          })


# * Question 3 ------------------------------------------------------------

isa_fac_sol = 'https://www.miamioh.edu/fsb/academics/isa/about/faculty-staff/index.html' %>% 
  read_html() %>% html_element('table') %>% html_table()

test_that('ISA Faculty Table',
          {
            expect_equal(object = dim(isa_fac)[1], expected = dim(isa_fac_sol)[1])
            expect_equal(object = dim(isa_fac)[2], expected = dim(isa_fac_sol)[2])
            expect_equal(object = colnames(isa_fac), expected = colnames(isa_fac_sol))
          })



# * Question 4 ------------------------------------------------------------

netflix = "https://www.imdb.com/search/title/?companies=co0144901"

netflix_pg = read_html(netflix)

title = netflix_pg %>%
  html_elements('div.lister-item-content > h3 > a') %>% 
  html_text2()

years = netflix_pg %>%
  html_elements('h3 > span.lister-item-year.text-muted.unbold') %>% 
  html_text2()

summary = netflix_pg %>% 
  html_elements('#main > div > div.lister.list.detail.sub-list > div > div > div.lister-item-content > p:nth-child(4)') %>% 
  html_text2()

netflix_sol = tibble(title, years, summary)

test_that('Netflix Table',
          {
            expect_equal(object = dim(netflix)[1], expected = dim(netflix_sol)[1])
            expect_equal(object = dim(netflix)[2], expected = dim(netflix_sol)[2])
            expect_true(object = "The Sandman" %in% netflix$title)
          })
