# Class 06: Revisiting Webscraping


# * Miami FB --------------------------------------------------------------
pacman::p_load(rvest, tidyverse)


# * * Using html_element --------------------------------------------------

step0_wiki = 'https://en.wikipedia.org/wiki/Miami_RedHawks_football'
step1_wiki = read_html(step0_wiki)
step2_wiki_sing = 
  html_element(
    step1_wiki,
    "#mw-content-text > div.mw-parser-output > table:nth-child(61)"
  )

step3_wiki_sing = html_table(step2_wiki_sing)
step3_wiki_sing



# * * What happens if I were to subset the output using [[1]]? ------------
str(step3_wiki_sing)
step3_wiki_sing[[1]] # with a tibble that would return data in that specific col
step3_wiki_sing[1, ] # would return the first row


# * * Let us talk about pulling all tables --------------------------------

step2_all_tables = html_elements(step1_wiki,
                                 "#mw-content-text > div.mw-parser-output > table > tbody")

step3_all_tables = html_table(step2_all_tables)

step4_bowl_games = step3_all_tables[[5]]
step4_coaches = step3_all_tables[[4]]



# * Scraping Multiple Webpages --------------------------------------------

# * * Approach 1: Changing the URL inside the for loop --------------------
imdb_solution = tibble() # initialization
for (counter in seq(from = 1, to = 251, by = 50)) {
  # challenge 1: change the URL in the loop
  url_start = 'https://www.imdb.com/search/title/?companies=co0144901&start='
  url_middle = counter
  url_end = '&ref_=adv_nxt'
  
  complete_url = paste0(url_start, url_middle, url_end)
  
  step1_imdb = read_html(complete_url)
  
  step2_imdb = 
    html_elements(
      step1_imdb,
      "#main > div > div.lister.list.detail.sub-list > div > div > div.lister-item-content > h3 > a")
  #main > div > div.lister.list.detail.sub-list > div > div:nth-child(1) > div.lister-item-content > h3 > a
  
  step3_imdb = html_text2(step2_imdb)
  
  step3_url = html_attr(step2_imdb, name = 'href')
  step4_url = url_absolute(step3_url, base = 'https://www.imdb.com/')
  step4_url
  
  # challenge 2: do not overwrite your final answer
  imdb_df = tibble(title = step3_imdb, url = step4_url)
  imdb_solution = rbind(imdb_solution, imdb_df)
}


# * * Approach 2 ----------------------------------------------------------
imdb_links = 
  c("https://www.imdb.com/search/title/?companies=co0144901&start=1&ref_=adv_nxt",
    "https://www.imdb.com/search/title/?companies=co0144901&start=51&ref_=adv_nxt",
    "https://www.imdb.com/search/title/?companies=co0144901&start=101&ref_=adv_nxt",
    "https://www.imdb.com/search/title/?companies=co0144901&start=151&ref_=adv_nxt",
    "https://www.imdb.com/search/title/?companies=co0144901&start=201&ref_=adv_nxt",
    "https://www.imdb.com/search/title/?companies=co0144901&start=251&ref_=adv_nxt")

imdb_links[3]

imdb_solution2 = tibble()
for (counter in 1:length(imdb_links)) {
  complete_url = imdb_links[counter]
  print(complete_url)
  
  step1_imdb = read_html(complete_url)
  
  step2_imdb = 
    html_elements(
      step1_imdb,
      "#main > div > div.lister.list.detail.sub-list > div > div > div.lister-item-content > h3 > a")
  #main > div > div.lister.list.detail.sub-list > div > div:nth-child(1) > div.lister-item-content > h3 > a
  
  step3_imdb = html_text2(step2_imdb)
  
  step3_url = html_attr(step2_imdb, name = 'href')
  step4_url = url_absolute(step3_url, base = 'https://www.imdb.com/')
  step4_url
  
  # challenge 2: do not overwrite your final answer
  imdb_df = tibble(title = step3_imdb, url = step4_url)
  imdb_solution2 = rbind(imdb_solution2, imdb_df)
}
