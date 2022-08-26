# This code is written to scrape the Yelp reviews for Patterson cafe
# The generated data will be used for an assignment on the third class

if(require(pacman)==FALSE) install.packages("pacman")

pacman::p_load(tidyverse, rvest, magrittr)

urls = paste0("https://www.yelp.com/biz/pattersons-cafe-oxford?osq=Restaurants&start=",
              seq(from=0,to = 100, by = 10))

scrape_yelp = function(x){
  read_page = read_html(x)
  
  reviewer = read_page %>% 
   html_nodes("div > div.arrange-unit__09f24__rqHTg.arrange-unit-fill__09f24__CUubG.border-color--default__09f24__NPAKY > div.user-passport-info.border-color--default__09f24__NPAKY > span > a") %>% html_text()
  
  old_review = read_page %>% 
    html_nodes("div > div.margin-t1__09f24__w96jn.margin-b1-5__09f24__NHcQi.border-color--default__09f24__NPAKY > div") %>% 
    html_text() %>% str_detect('Previous review')
  
  index_old = which(old_review == TRUE)
  
  review_date = read_page %>% 
    html_nodes("div > div.arrange-unit__09f24__rqHTg.arrange-unit-fill__09f24__CUubG.border-color--default__09f24__NPAKY > span.css-chan6m") %>% 
    html_text() %>% magrittr::extract(1:length(reviewer))
  
  score = read_page %>% 
    html_nodes("div > div.margin-t1__09f24__w96jn.margin-b1-5__09f24__NHcQi.border-color--default__09f24__NPAKY > div > div > span > div") %>% 
    html_attr('aria-label') %>% parse_number()
  
  if(length(score) > length(reviewer)) score = score[-index_old]
  
  comment =  read_page %>% 
    html_nodes("div > div.margin-b2__09f24__CEMjT.border-color--default__09f24__NPAKY > p > span") %>% 
    html_text()
  
  results = tibble(reviewer, review_date, score, comment)
  
  return(results)
    
}

patterson_reviews = map_df(.x = urls, .f = scrape_yelp)

write_rds(patterson_reviews,
          file = 'data/patterson_cafe_yelp_reviews.rds')
