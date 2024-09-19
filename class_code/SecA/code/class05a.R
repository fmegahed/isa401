
"https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true&pli=1" |> 
  rvest::read_html() -> mu_webpage

# all three of the selectors below will work
# Multiple CSS Selectors can often return the correct result
mu_webpage |> rvest::html_element("div > table") |> rvest::html_table()  
mu_webpage |> rvest::html_element("table") |> rvest::html_table()  
mu_webpage |> rvest::html_element("table.waffle") |> rvest::html_table()  

# storing the output in table_mu
mu_webpage |> rvest::html_element("table.waffle") |> rvest::html_table()  -> table_mu

# we noticed that the first row should be the column names and the second row contains no data
colnames(table_mu) = table_mu[1, ]
table_mu = table_mu[-c(1,2), ] # alternatively, you could have said table_mu[3:nrow(table_mu), ]

# header = T option
mu_webpage |> rvest::html_element("table.waffle") |> rvest::html_table(header = T)  -> table_mu2
colnames(table_mu2) = table_mu2[1, ]
# and also delete the first column if you want
table_mu2 = table_mu2[-c(1,2), -1] # alternatively, you could have said table_mu[3:nrow(table_mu), ]



# * Question 4 ------------------------------------------------------------

# we used the read_html_live() bec
# [1] The selector we had returned exact;y 25 results
# [2] The selector seemed valid for all titles (they look exactly the same) and it was general enough
# (select hyperlinks that are also third level headers)
# [3] Based on [1] and [2], I suspected that the page did not load appropriately before we scraped it
imdb_webpage = rvest::read_html_live("https://www.imdb.com/search/title/?companies=co0144901")

imdb_webpage |> rvest::html_elements("a h3") |> rvest::html_text2() -> titles

imdb_webpage |> rvest::html_elements(
  "#__next > main > div.ipc-page-content-container.ipc-page-content-container--center.sc-75ef699d-0.inZcnj > div.ipc-page-content-container.ipc-page-content-container--center > section > section > div > section > section > div:nth-child(2) > div > section > div.ipc-page-grid.ipc-page-grid--bias-left.ipc-page-grid__item.ipc-page-grid__item--span-2 > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > ul > li > div > div > div > div.sc-74bf520e-2.WQsRg > div.sc-b189961a-0.iqHBGn > div.sc-b189961a-7.btCcOY.dli-title-metadata > span:nth-child(1)"
) -> years

# this will also return 50 years (I am not saving it)
imdb_webpage |> rvest::html_elements(
  "div.sc-b189961a-7.btCcOY.dli-title-metadata > span:nth-child(1)"
)
