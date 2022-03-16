# Code written in class on March 14, 2022
## Exam 01 - Review

pacman::p_load(tidyverse,
               magrittr,
               rvest,
               deducorrect)


# * Q2 --------------------------------------------------------------------
isa_pg = read_html("https://bulletin.miamioh.edu/courses-instruction/isa/")

isa_pg %>% html_element("p.courseblocktitle > strong")  -> element
isa_pg %>% html_element("p.courseblocktitle > strong")  -> elements
str(elements)



# * Q3 --------------------------------------------------------------------
df <- data.frame(x = 50, y = NA, total = 53)
E <- editset("x + y == total")

corrections = correctRounding(E, df)
corrections$corrected
corrections$corrections


# * Q4 --------------------------------------------------------------------

df = data.frame (x= c(1,2,3,4), y = c(1, 1, 1, 1), total = c(NA, NA, NA, NA) )
imputations = deduImpute(E, dat = df)
imputations$corrected
imputations$corrections



# * Q6 --------------------------------------------------------------------
"https://miamioh.edu/covid19/dashboard/index.html" %>% read_html() %>% html_elements('img') %>% 
  html_attr(name = 'alt')


# * Q7 --------------------------------------------------------------------
pacman::p_load(robotstxt)
robotstxt::paths_allowed(paths = 'jobs/search?q=Business-Analyst&where=Ohio&page=1',
                         domain = 'https://www.monster.com/')
robotstxt::paths_allowed(paths = 'https://www.monster.com/jobs/search?q=Business-Analyst&where=Ohio&page=1')

# incorrect solution
robotstxt::paths_allowed(paths = 'search?q=Business-Analyst&where=Ohio&page=1',
                         domain = "https://www.monster.com/jobs/")


# * Q8 --------------------------------------------------------------------
pacman::p_load(quantmod)
getSymbols(Symbols = 'GOOG', from = '2022-01-01', to = '2022-03-05')



# * Q9 --------------------------------------------------------------------
"https://www.whitehouse.gov/covidplan/" %>% read_html() %>% 
  html_elements("span.accordion__control_title.h4alt.acctext--con") %>% 
  html_text2() -> wh_stuff

"https://www.whitehouse.gov/covidplan/" %>% read_html() %>% 
  html_elements("span.accordion__control_title.h4alt.acctext--con") %>% 
  html_text() -> wh_stuff2



# * Q10 -------------------------------------------------------------------
pacman::p_load(edgar)
google_filling_info = getFilingInfo(
  firm.identifier = 'GOOGLE', 
  filing.year = 2021, 
  useragent = "fmegahed@miamioh.edu"
)

google_q2 = getFilingsHTML(cik.no = 1824723,
                           filing.year = 2021,
                           useragent = 'abcd@miamioh.edu')



# * Chicago ---------------------------------------------------------------
chicago = read_csv("https://data.cityofchicago.org/api/views/s4vu-giwb/rows.csv?accessType=DOWNLOAD")
glimpse(chicago)
is.na(chicago) %>% colSums()
DataExplorer::plot_missing(chicago)


chicago_clean = chicago %>% 
  mutate(`CHECK DATE` = lubridate::mdy(`CHECK DATE`),
         day_of_week = lubridate::wday(`CHECK DATE`, label = T),
         year = lubridate::year(`CHECK DATE`))
glimpse(chicago_clean)

chiacago_mon = chicago_clean %>% filter(day_of_week == 'Mon')
mean(chiacago_mon$AMOUNT)

chiacago_2020 = chicago_clean %>% filter(year == 2020)
sum(chiacago_2020$AMOUNT)

