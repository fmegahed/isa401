
# Class 06: Revisiting scraping multiple webpages & Intro to APIs --------



# * Last Week Recap -------------------------------------------------------

pacman::p_load(tidyverse, rvest)

step0_fb = 'https://en.wikipedia.org/wiki/Miami_RedHawks_football' 
step1_fb = read_html(step0_fb)
step2_fb_element = html_element(
  step1_fb,
  "#mw-content-text > div.mw-parser-output > table:nth-child(57)")
step3_fb_element = html_table(step2_fb_element)

# a potential error -- in class we have talked about how elements would return a list
# in step3
step2_fb_elements = html_elements(
  step1_fb,
  "#mw-content-text > div.mw-parser-output > table:nth-child(57)")
step3_fb_elements = html_table(step2_fb_elements)
step4_fb_elements = step3_fb_elements[[1]]

## the error would be
step4_fb_element = step3_fb_element[[1]]


## the more generic description
step2_fb_generic = html_elements(step1_fb,
                                 "#mw-content-text > div.mw-parser-output > table")

step3_fb_generic = html_table(step2_fb_generic)

coaches_result = step3_fb_generic[[4]]
div_champs = step3_fb_generic[[3]]


# * Multiple Webpages -----------------------------------------------------

# Approach 1 - change the URLs within the loop
## adv: if you can do that and there are a large number of webpages you want
# to scrape

imdb_solution = tibble() # initialization
for (i in seq(1, 251, 50) ) {
  # making the url
  middle_url = i
  start_url = 'https://www.imdb.com/search/title/?companies=co0144901&start='
  end_url = '&ref_=adv_nxt'
  
  complete_url = paste0(start_url, middle_url, end_url)
  
  
  step1_imdb = read_html(complete_url)
  
  step2_imdb_title = 
    html_elements(
      step1_imdb,
      "#main > div > div.lister.list.detail.sub-list > div > div > div.lister-item-content > h3 > a")
  step3_imdb_title = html_text2(step2_imdb_title)
  
  step3_iumdb_urls = html_attr(x = step2_imdb_title, name = 'href')
  step4_imdb_urls = rvest::url_absolute(x = step3_iumdb_urls,
                                        base = 'https://www.imdb.com/')
  
  temp_df = tibble(title = step3_imdb_title,
                   url = step4_imdb_urls)
  
  imdb_solution = rbind(imdb_solution, temp_df)
}


# Approach 2: Predefine your URLs
imdb_urls = c('https://www.imdb.com/search/title/?companies=co0144901&start=1&ref_=adv_nxt',
              'https://www.imdb.com/search/title/?companies=co0144901&start=51&ref_=adv_nxt',
              'https://www.imdb.com/search/title/?companies=co0144901&start=101&ref_=adv_nxt',
              'https://www.imdb.com/search/title/?companies=co0144901&start=151&ref_=adv_nxt',
              'https://www.imdb.com/search/title/?companies=co0144901&start=201&ref_=adv_nxt',
              'https://www.imdb.com/search/title/?companies=co0144901&start=2511&ref_=adv_nxt')

imdb_solution2 = tibble() # initialization
for (i in 1:length(imdb_urls) ) {
  # making the url
  
  complete_url = imdb_urls[i]
  
  step1_imdb = read_html(complete_url)
  
  step2_imdb_title = 
    html_elements(
      step1_imdb,
      "#main > div > div.lister.list.detail.sub-list > div > div > div.lister-item-content > h3 > a")
  step3_imdb_title = html_text2(step2_imdb_title)
  
  step3_iumdb_urls = html_attr(x = step2_imdb_title, name = 'href')
  step4_imdb_urls = rvest::url_absolute(x = step3_iumdb_urls,
                                        base = 'https://www.imdb.com/')
  
  temp_df = tibble(title = step3_imdb_title,
                   url = step4_imdb_urls)
  
  imdb_solution2 = rbind(imdb_solution2, temp_df)
}
