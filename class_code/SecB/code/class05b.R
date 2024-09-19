


# *Q1 ---------------------------------------------------------------------

"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true" |> 
  rvest::read_html() -> mu_lost_webpage

# approach A: using the fact that there is only one table in this specific webpage
mu_lost_webpage |> rvest::html_element("table") |> rvest::html_table(header = TRUE) -> lost_found

colnames(lost_found) = lost_found[1, ]

lost_found = lost_found[-c(1,2), -1] # del first two rows and then we also exlude col 1 bec it is not helpful

# approach B: using the Inspector
mu_lost_webpage |> 
  rvest::html_element("div > div > table") |>
  rvest::html_table(header = TRUE) -> 
  lost_found2 # this can be cleaned as above

mu_lost_webpage |> 
  rvest::html_element("div > table.waffle") |>
  rvest::html_table(header = TRUE) -> 
  lost_found3 # this can be cleaned as above

mu_lost_webpage |> 
  rvest::html_element("div.ritz.grid-container > table.waffle") |>
  rvest::html_table(header = TRUE) -> 
  lost_found4 # this can be cleaned as above

# There can be multiple CSS selectors for your problem that will produce the needed result
# Try to capitalize on the inspector/selector gadget, but also think about the webpage
# data



# *Q4 ---------------------------------------------------------------------

imdb_webpage = rvest::read_html_live("https://www.imdb.com/search/title/?companies=co0144901")

imdb_webpage |> rvest::html_elements("a h3") |> rvest::html_text2() -> titles

# Processing this info
# [1] All titles look the same
# [2] I got a subset of the titles that is exactly half (not just a single title)
# [3] Hypothesis: The page did not load entirely in R before we scraped it

imdb_webpage |> 
  rvest::html_elements("#__next > main > div.ipc-page-content-container.ipc-page-content-container--center.sc-75ef699d-0.inZcnj > div.ipc-page-content-container.ipc-page-content-container--center > section > section > div > section > section > div:nth-child(2) > div > section > div.ipc-page-grid.ipc-page-grid--bias-left.ipc-page-grid__item.ipc-page-grid__item--span-2 > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > ul > li > div > div > div > div.sc-74bf520e-2.WQsRg > div.sc-b189961a-0.iqHBGn > div.sc-b189961a-7.btCcOY.dli-title-metadata > span:nth-child(1)") |> 
  rvest::html_text2() -> years


imdb_webpage |> 
  rvest::html_elements("span:nth-child(1)") |> 
  rvest::html_text2() -> years2





# * White House -----------------------------------------------------------

wh_page = rvest::read_html("https://www.whitehouse.gov/administration/cabinet/")


wh_page |> rvest::html_elements(".acctext--con") |> rvest::html_text2() -> res

names = res[seq(1,52,2)]
titles = res[seq(2,52,2)]
