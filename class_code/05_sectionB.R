# class05 - scraping multiple pages

pacman::p_load(tidyverse, rvest)


# * Kahoot ----------------------------------------------------------------


#q1
q1_base = readRDS('data/phi_hat_tbl.rds')
q1_readr = read_rds('data/phi_hat_tbl.rds')


#q3
isa_courses = 'https://bulletin.miamioh.edu/courses-instruction/isa/'
step1_isa = read_html(isa_courses)
step2_isa = html_elements(step1_isa, 'div.courseblock > p')
step2_isa
step3_isa = html_text2(step2_isa)
step3_isa

step4_titles = step3_isa[ seq(1, 104, by = 2) ]
step4_descs = step3_isa[ seq(2, 104, by = 2) ]

# q4
robotstxt::paths_allowed(paths = '/football/', domain = 'https://www.rotowire.com')
robotstxt::paths_allowed(paths = 'https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507')



# * Assignment 04 ---------------------------------------------------------

#q2
mu_lf = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true'
step1_lf = read_html(mu_lf)

step2_lf_sing = html_element(step1_lf, 'table.waffle')
step3_lf_sing = html_table(step2_lf_sing)
step3_lf_sing

colnames(step3_lf_sing) = step3_lf_sing[1, ]
step3_lf_sing = step3_lf_sing[-c(1,2) , ]


step2_lf_p = html_elements(step1_lf, 'table.waffle')
step3_lf_p = html_table(step2_lf_p)
step3_lf_p = step3_lf_p[[1]]

#q3
step0_fac = 'https://www.miamioh.edu/fsb/academics/isa/about/faculty-staff/index.html'
step1_fac = read_html(step0_fac)
step2_fac = html_element(step1_fac, 'body > div > main > section > div.bodyCopy.translationCopyEnglish > table')
step3_fac = html_table(step2_fac)


# q4
step0_imdb = 'https://www.imdb.com/search/title/?companies=co0144901'
step1_imdb = read_html(step0_imdb)

step2_imdb_summaries = 
  html_elements(
    step1_imdb,
    '#main > div > div.lister.list.detail.sub-list > div > div > div.lister-item-content > p:nth-child(4)')
step2_imdb_summaries

step3_imdb_summaries = html_text2(step2_imdb_summaries)



# * Plane Crash Dataset from Last Class -----------------------------------
if(require(pacman)==F) install.packages('pacman')
pacman::p_load(lubridate)

step0_plane = "http://www.planecrashinfo.com/2022/2022.htm"

step1_plane = read_html(step0_plane)

step2_plane = html_elements(step1_plane, "table")

# works if and only if the table does not have a table header tag <th>
# my recommendation do not have it unless the output does not look right
step3_plane = html_table(step2_plane, header = T)[[1]]

step3_plane$Date = dmy(step3_plane$Date)
str(step3_plane)


# * Scraping 2013-2022 ----------------------------------------------------

all_crashes = data.frame()

for (i in 2013:2022) {
  current_url = paste0(
    'http://www.planecrashinfo.com/', i, '/', i, '.htm'
  )
  
  step1_plane = read_html(current_url)
  
  step2_plane = html_elements(step1_plane, "table")
  
  # works if and only if the table does not have a table header tag <th>
  # my recommendation do not have it unless the output does not look right
  step3_plane = html_table(step2_plane, header = T)[[1]]
  
  step3_plane$Date = dmy(step3_plane$Date)
  
  all_crashes = rbind(
    all_crashes,
    step3_plane
  )
}

