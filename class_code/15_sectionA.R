# Code written in class on March 14, 2022
## Exam 01 - Review

pacman::p_load(tidyverse,
               magrittr,
               rvest,
               deducorrect)


# * Q2 --------------------------------------------------------------------
isa_pg = read_html("https://bulletin.miamioh.edu/courses-instruction/isa/")

isa_elements = isa_pg %>% html_elements('p.courseblocktitle > strong')
isa_element = isa_pg %>% html_element('p.courseblocktitle > strong')


# * Q3 --------------------------------------------------------------------
## logically, it should be NO since this is an imputation rather than
# correction problem
df <- data.frame(x = 50, y = NA, total = 53)
E <- editset("x + y == total")

corrections = correctRounding(E, dat = df)
corrections$corrected
corrections$corrections


# * Q4 Try the functions in R ---------------------------------------------

df = data.frame (x= c(1,2,3,4), y = c(1, 1, 1, 1), total = c(NA, NA, NA, NA) )

imputations = deduImpute(E, df)
imputations$corrected
imputations$corrections



# * Q6 --------------------------------------------------------------------

mu_page = read_html("https://miamioh.edu/covid19/dashboard/index.html")

mu_page %>% html_elements("img") %>% html_attr(name = 'alt')



# * Q7 --------------------------------------------------------------------
pacman::p_load(robotstxt)
robotstxt::paths_allowed(paths = 'jobs/search?q=Business-Analyst&where=Ohio&page=1',
                         domain = 'https://www.monster.com/')

pacman::p_load(quantmod)
getSymbols(Symbols = 'GOOG', from = '2022-01-01', to = '2022-03-05')



# * White House -----------------------------------------------------------
wh_pg = read_html("https://www.whitehouse.gov/covidplan/")

wh_pg %>% html_elements("span.accordion__control_title.h4alt.acctext--con") %>% 
  html_text2()



# * Edgar -----------------------------------------------------------------
pacman::p_load(edgar)
google_filling = getFilingInfo(firm.identifier = 'GOOGLE',
                               filing.year = 2021,
                               quarter = c(1, 2, 3, 4),
                               useragent = 'fmegahed@miamioh.edu')

filings = getFilingsHTML(1824723, filing.year = 2021, 
                         useragent = 'fmegahed@miamioh.edu') 


# * Chicago ---------------------------------------------------------------
chicago = read_csv("https://data.cityofchicago.org/api/views/s4vu-giwb/rows.csv?accessType=DOWNLOAD")
glimpse(chicago)

DataExplorer::plot_missing(chicago)
is.na(chicago) %>% colSums()

chicago_clean = chicago %>% 
  mutate(`CHECK DATE` = lubridate::mdy(`CHECK DATE`),
         day_of_week = lubridate::wday(`CHECK DATE`, label = T),
         year = lubridate::year(`CHECK DATE`))

glimpse(chicago_clean)

# Extract only the data which has Mondays
chicago_clean %>% filter(day_of_week == 'Mon') -> monday
mean(monday$AMOUNT, na.rm = T)

chicago_clean %>% filter(year == 2020) -> chic_2020
sum(chic_2020$AMOUNT, na.rm = T)

 
