
# * Office Hours (rvest Miami Site) ---------------------------------------

pacman::p_load(tidyverse, magrittr, rvest)

acc_link = 'https://www.miamioh.edu/fsb/academics/accountancy/about/faculty-staff/index.html'

acc_page = acc_link %>% read_html()

dept_name = acc_page %>% html_elements("td") %>% 
  html_text2()
dept_name = dept_name[seq(from = 1, to = 69, by = 3)]

prof_name = acc_page %>% html_elements('strong > a') %>% html_text2()

positions = acc_page %>% html_elements("td > i") %>% html_text2()

web_page = acc_page  %>% html_elements('strong > a') %>% html_attr('href')




scrape_miami_fn = function(x){
  page = x %>% read_html()
  
  dept_name = page %>% html_elements("td") %>% 
    html_text2()
  
  dept_name = dept_name[seq(from = 1, to = length(dept_name), by = 3)]
  
  prof_name = page %>% html_elements('strong > a') %>% html_text2()
  
  position = page %>% html_elements("td > i") %>% html_text2()
  
  web_page = page  %>% html_elements('strong > a') %>% html_attr('href')
  
  results = tibble(dept_name, prof_name, position, web_page)
  
  return(results)
}

depts = c('accountancy', 'isa', 'finance', 'economics')
full_links = paste0('http://www.miamioh.edu/fsb/academics/', depts,
                    '/about/faculty-staff/index.html') %>% as.character()

full_results = map_df(.x = full_links, .f = scrape_miami_fn)
