

# * Assignment 04: Q1 -----------------------------------------------------

robotstxt::paths_allowed("https://www.yelp.com/biz/pattersons-cafe-oxford")
# Returns False, which means per the robots.txt file for the yelp site, we should not use a bot to scrape this info



# * Assignment 04: Q2 -----------------------------------------------------

# Skip this since the reading of the Google Sheet returns no answers

rvest::read_html_live("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true") |> 
  rvest::html_element("table") |> 
  rvest::html_table()


# * Assignment 04: Q3 -----------------------------------------------------

rvest::read_html_live("https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all") |> 
  rvest::html_element("table") |> 
  rvest::html_table() -> isa_fac



# * Assignment 04: Q4 -----------------------------------------------------

imdb_webpage = rvest::read_html_live("https://www.imdb.com/search/title/?companies=co0144901")

titles = imdb_webpage |> rvest::html_elements("a h3") |> rvest::html_text2()

years = imdb_webpage |> 
  rvest::html_elements("div.sc-15ac7568-6.fqJJPW.dli-title-metadata > span:nth-child(1)") |> 
  rvest::html_text2()

summary = imdb_webpage |> 
  rvest::html_elements("#__next > main > div.ipc-page-content-container.ipc-page-content-container--center.sc-485f20b3-0.fEfVUk > div.ipc-page-content-container.ipc-page-content-container--center > section > section > div > section > section > div:nth-child(2) > div > section > div.ipc-page-grid.ipc-page-grid--bias-left.ipc-page-grid__item.ipc-page-grid__item--span-2 > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > ul > li > div > div > div > div.sc-9d52d06f-1.bDNbpf > div > div") |> 
  rvest::html_text2()

df = data.frame(title = titles, year = years, summary)
