# in class code for scraping multiple webpages


# * Kahoot ----------------------------------------------------------------

#q1

q1 = readRDS('data/phi_hat_tbl.rds')
?readr::read_rds


#q3
library(rvest)
isa_pg = 'https://bulletin.miamioh.edu/courses-instruction/isa/'
step1 = read_html(isa_pg)
step2 = html_elements(step1, "div.courseblock > p")
step3 = html_text2(step2)
step3

titles = step3[seq(1, 104, by = 2)]
titles
descs = step3[seq(2, 104, by = 2)]
descs


#q5
robotstxt::paths_allowed(paths = '/football/', domain = 'https://www.rotowire.com')
robotstxt::paths_allowed(paths = 'https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507')



# * Assignment 04 ---------------------------------------------------------

#q1
robotstxt::paths_allowed(paths = 'https://www.yelp.com/biz/pattersons-cafe-oxford')

#q2
step0_mu = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true'

step1_mu = read_html(step0_mu)

step2_mu_singular = html_element(step1_mu, 'table')
step3_mu_singular = html_table(step2_mu_singular)
colnames(step3_mu_singular) = step3_mu_singular[1, ]
step3_mu_singular = step3_mu_singular[-c(1,2), ]

# showing the diff between elements and element
step2_mu_p = html_elements(step1_mu, 'div > table')
step3_mu_p = html_table(step2_mu_p)
step4_mu = step3_mu_p[[1]]

# q3
isa_step0 = 'https://www.miamioh.edu/fsb/academics/isa/about/faculty-staff/index.html'
step1_isa = read_html(isa_step0)
step2_isa = html_element(step1_isa, 'table')
step3_isa = html_table(step2_isa)


# q4
step0_imdb = 'https://www.imdb.com/search/title/?companies=co0144901'
step1_imdb = read_html(step0_imdb)

step2_summary = html_elements(step1_imdb, 
                              '#main > div > div.lister.list.detail.sub-list > div > div > div.lister-item-content > p:nth-child(4)')
step2_summary

step3_summary = html_text2(step2_summary)
step3_summary



# * Plane Crash Info ------------------------------------------------------
if(require(pacman)==F) install.packages("pacman")
pacman::p_load(lubridate)

url_c = "http://www.planecrashinfo.com/2022/2022.htm"

step1_c = read_html(url_c)
step2_c = html_element(step1_c, "table")
# only put header = T if the column names are not correct and are generic
# X1, X2, etc (bec the webpage did not use the th tags)
step3_c = html_table(step2_c, header = TRUE)
step3_c$Date = dmy(step3_c$Date)

str(step3_c)



# * Multiple Pages --------------------------------------------------------

base_url = 'http://www.planecrashinfo.com/'

crashes_tbl = data.frame()

for (counter in 2013:2022) {
  current_url = 
    paste0(base_url, counter, '/', counter, '.htm')

  step1_c = read_html(current_url)
  step2_c = html_element(step1_c, "table")
  # only put header = T if the column names are not correct and are generic
  # X1, X2, etc (bec the webpage did not use the th tags)
  step3_c = html_table(step2_c, header = TRUE)
  step3_c$Date = dmy(step3_c$Date)
  
  crashes_tbl = rbind(
    crashes_tbl,
    step3_c
  )
}
