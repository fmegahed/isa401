


# * HW 4 ------------------------------------------------------------------

isa_url = 'https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all'

robotstxt::paths_allowed(paths = '/fsb/directory/', domain = 'https://miamioh.edu' )

# Given that I was not very specific, multiple correct answers exist for the question
# related to pull ISA faculty 

isa_url |> 
  # gives me the HTML (which we can see using page source in Chrome)
  rvest::read_html() |> 
  # select the entire table
  rvest::html_element("#sidebar-main > div > table") |> 
  # given that I pulled the entire table
  # I can clean it using html_table()
  rvest::html_table() -> fac_table



# * HW 5 ------------------------------------------------------------------


# What is Different from the previous question?
# [1] Pull multiple pages
# [2] We have specific things we want to have in our output:
### [a] department
### [b] person's name
### [c] their title
### [d] webpage

scrape_fsb = function(url){
  # lets import the HTML of the page into R
  input_page = rvest::read_html(url)
  
  dept = input_page |> 
    rvest::html_elements("tr > td:nth-child(1)") |> 
    rvest::html_text2()
  dept
  
  fac_name = input_page |> 
    # go to column 3 of the table, get everything that is bolded and hyperlinked
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    # give me human readable output based on what we see on the page
    rvest::html_text2()
  
  fac_url <- input_page |>
    # the selector above has to include a
    rvest::html_nodes("tr > td:nth-child(3) > strong > a") |>
    # get me the value for the href element
    rvest::html_attr("href")
  fac_url
  
  fac_title = input_page |> 
    # go to column 3 of the table, get everything that is italicized
    rvest::html_elements("tr > td:nth-child(3) > i") |> 
    # give me human readable output based on what we see on the page
    rvest::html_text2()
  
  fac_df = tibble::tibble(dept, fac_name, fac_title, webpage = fac_url)
  
  return(fac_df)
}

# obviously for the assignment, the URLs will correspond to all departments
urls = c('https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all',
         "https://miamioh.edu/fsb/directory/?up=/query/all/all/Economics/all")

fsb_df = purrr::map_df(.x = urls, .f = scrape_fsb)




# * For Loop --------------------------------------------------------------

fsb_df2 = data.frame() # initialized
count = 0 # set counter for 0 only for printing it
for (url in urls) {
  input_page = rvest::read_html(url)
  
  dept = input_page |> 
    rvest::html_elements("tr > td:nth-child(1)") |> rvest::html_text2()
  
  fac_name = input_page |> 
    # go to column 3 of the table, get everything that is bolded and hyperlinked
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    # give me human readable output based on what we see on the page
    rvest::html_text2()
  
  fac_url <- input_page |>
    rvest::html_nodes("tr > td:nth-child(3) > strong > a") |>
    rvest::html_attr("href")
  
  fac_title = input_page |> 
    # go to column 3 of the table, get everything that is italicized
    rvest::html_elements("tr > td:nth-child(3) > i") |> 
    # give me human readable output based on what we see on the page
    rvest::html_text2()
  
  fac_df = tibble::tibble(dept, fac_name, fac_title, webpage = fac_url)
  fsb_df2 = rbind(fsb_df2, fac_df)
  count = count +1
  print( paste("The fsb_df at the end of url #", count) )
  print(fsb_df2)
  print("----------")
}



# * Kahoot ----------------------------------------------------------------

df = readr::read_rds(file = 'data/phi_hat_tbl.rds')

robotstxt::paths_allowed(
  domain = "https://www.rotowire.com/",
  paths = "football/article/"
)


"https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507" |> 
  rvest::read_html() |> 
  rvest::html_element("table") |> 
  rvest::html_table() -> output1


"https://www.rotowire.com/football/article/top-150-roundtable-2022-fantasy-football-consensus-rankings-update-65507" |> 
  rvest::read_html() |> 
  rvest::html_elements("table") |> 
  rvest::html_table() -> output2


















