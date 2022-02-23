
# * Netflix info ----------------------------------------------------------

pacman::p_load(tidyverse, magrittr, rvest)

imdb_page = read_html('https://www.imdb.com/search/title/?companies=co0144901')

increments = seq(1, to = 301, by = 50)

titles = vector()
certificate = vector()
star_ratings = vector()

for (i in 1:length(increments)) {
  page_url = paste0('https://www.imdb.com/search/title/?companies=co0144901&start=',
                    increments[i],'&ref_=adv_nxt')
  
  imdb_page = read_html(page_url)
  
  title_names = imdb_page %>% 
    html_elements('div.lister-item-content > h3 > a') %>% html_text2()
  
  pg_or_not = imdb_page %>% 
    html_elements('span.certificate') %>% html_text2()
  
  stars = imdb_page %>% 
    html_elements('div.inline-block.ratings-imdb-rating > strong') %>% html_text2()
  
  # probably simpler than what we did in class
  # concatenating the vectors and then if they match after all pages
  # you can put them in a tibble AFTER the for loop
  titles = c(titles, title_names)
  certificate = c(certificate, pg_or_not)
  star_ratings = c(star_ratings, stars)
}


tibble(title_names, pg_or_not, stars)
