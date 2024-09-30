

# * Q1 ---------------------------------------------------------------------

yelp_robots = robotstxt::paths_allowed(paths = 'biz/', domain = 'https://www.yelp.com')



# * Q2 --------------------------------------------------------------------

rvest::read_html("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true") |> 
  rvest::html_element("table") |> 
  rvest::html_table() -> lost_table

colnames(lost_table) = lost_table[1, ]

lost_found = lost_table[-c(1,2), -1]



# * Q3 --------------------------------------------------------------------

rvest::read_html("https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all") |> 
  rvest::html_element('table') |> 
  rvest::html_table() -> isa_fac


# * Q4 --------------------------------------------------------------------

imdb_web = rvest::read_html_live("https://www.imdb.com/search/title/?companies=co0144901")

imdb_web |> 
  rvest::html_elements("#__next > main > div.ipc-page-content-container.ipc-page-content-container--center.sc-75ef699d-0.inZcnj > div.ipc-page-content-container.ipc-page-content-container--center > section > section > div > section > section > div:nth-child(2) > div > section > div.ipc-page-grid.ipc-page-grid--bias-left.ipc-page-grid__item.ipc-page-grid__item--span-2 > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > ul > li > div > div > div > div.sc-74bf520e-2.WQsRg > div.sc-b189961a-0.iqHBGn > div.ipc-title.ipc-title--base.ipc-title--title.ipc-title-link-no-icon.ipc-title--on-textPrimary.sc-b189961a-9.bnSrml.dli-title > a > h3") |> 
  rvest::html_text2() -> title

imdb_web |> 
  rvest::html_elements("#__next > main > div.ipc-page-content-container.ipc-page-content-container--center.sc-75ef699d-0.inZcnj > div.ipc-page-content-container.ipc-page-content-container--center > section > section > div > section > section > div:nth-child(2) > div > section > div.ipc-page-grid.ipc-page-grid--bias-left.ipc-page-grid__item.ipc-page-grid__item--span-2 > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > ul > li > div > div > div > div.sc-74bf520e-2.WQsRg > div.sc-b189961a-0.iqHBGn > div.sc-b189961a-7.btCcOY.dli-title-metadata > span:nth-child(1)") |> 
  rvest::html_text2() -> year

imdb_web |> 
  rvest::html_elements("#__next > main > div.ipc-page-content-container.ipc-page-content-container--center.sc-75ef699d-0.inZcnj > div.ipc-page-content-container.ipc-page-content-container--center > section > section > div > section > section > div:nth-child(2) > div > section > div.ipc-page-grid.ipc-page-grid--bias-left.ipc-page-grid__item.ipc-page-grid__item--span-2 > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > ul > li > div > div > div > div.sc-74bf520e-2.WQsRg > div.sc-b189961a-0.iqHBGn > div.sc-b189961a-7.btCcOY.dli-title-metadata > span") |> 
  rvest::html_text2() -> years_and_other_info

imdb_web |> 
  rvest::html_elements("#__next > main > div.ipc-page-content-container.ipc-page-content-container--center.sc-75ef699d-0.inZcnj > div.ipc-page-content-container.ipc-page-content-container--center > section > section > div > section > section > div:nth-child(2) > div > section > div.ipc-page-grid.ipc-page-grid--bias-left.ipc-page-grid__item.ipc-page-grid__item--span-2 > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > ul > li > div > div > div > div.sc-74bf520e-1.Cxrmk > div") |> 
  rvest::html_text2() -> summary

netflix = tibble::tibble(title, year, summary)
