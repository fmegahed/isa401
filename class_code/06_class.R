"https://docs.google.com/spreadsheets/u/0/d/e/2PACX-1vQ3uk9AJOMODxS9fUgX_4vnEMj-Di7ulkTXWzPUmaHvHbaII63xmKmRu3VaBvOXrwQhtkOUlL9fxLMB/pubhtml?gid=1104208671&single=true&pli=1" |> 
  rvest::read_html() |> 
  rvest::html_element("table.waffle") |> 
  rvest::html_table()   -> mu_page

mu_page



# * IMDB Question ---------------------------------------------------------

q4_webpage = rvest::read_html_live("https://www.imdb.com/search/title/?companies=co0144901")

q4_webpage |> 
  rvest::html_elements(".ipc-title__text--reduced") |> 
  rvest::html_text2() -> titles

titles = titles[2:51]
titles


q4_webpage |> 
  rvest::html_elements("div.sc-15ac7568-6.fqJJPW.dli-title-metadata > span:nth-child(1)") |> 
  rvest::html_text2() -> years


years |> stringr::str_detect(pattern = "Metascore") -> metascore_index





# * Assignment 04 Instructions --------------------------------------------

# (a) if you cannot read the page; 404 error (try a different network/computer)
# (b) For Q2 ignore --> full credit
# (c) For Q4, focus on only the titles and the summaries []





# * Assignment 04: Q3 / Assignment 05 Starter ---------------------------------------------------------

"https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all" |> 
  rvest::read_html() |> rvest::html_element("table") |> rvest::html_table() -> isa_table

"https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all" |> 
  rvest::read_html() -> isa_fac

isa_fac |> rvest::html_elements("tr > td:nth-child(1)") |> 
  rvest::html_text2() -> dept

isa_fac |> rvest::html_elements("td:nth-child(3) > i") |> 
  rvest::html_text2()

person_position

person_web





# * Scrape FCC from Wikipedia (Roster) ------------------------------------

# Comment 1: There are multiple tables in the page
# We want the existing roster

"https://en.wikipedia.org/wiki/FC_Cincinnati" |> rvest::read_html() -> fcc_wiki_page

# uses the inspect from Chrome and we removed earlier parts of the selector
# out of convenience to be able read it
# but that worked for the full selector: #mw-content-text > div.mw-content-ltr.mw-parser-output > table:nth-child(99) > tbody > tr > td:nth-child(1) > table

fcc_wiki_page |> 
  rvest::html_element("table:nth-child(99) > tbody > tr > td:nth-child(1) > table") |> 
  rvest::html_table() -> left_player_table

fcc_wiki_page |> 
  rvest::html_element("table:nth-child(99) > tbody > tr > td:nth-child(2) > table") |> 
  rvest::html_table() -> right_player_table

players = rbind(left_player_table, right_player_table)


# Approach 2

fcc_wiki_page |> rvest::html_elements("table") |> rvest::html_table() -> all_fcc_tables

# after printing it out; our data is in tables [[5]] and [[6]]

players2 = rbind(all_fcc_tables[[5]], all_fcc_tables[[6]]) 


  