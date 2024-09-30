


# * ISA Faculty -----------------------------------------------------------

url = 'https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all'

webpage = rvest::read_html(url)

webpage |> 
  rvest::html_elements("tr > td:nth-child(1)") |> 
  rvest::html_text2() -> department

webpage |> 
  rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
  rvest::html_text2() -> name

webpage |> 
  rvest::html_elements("tr > td:nth-child(3) > i") |> 
  rvest::html_text2() -> position

webpage |> 
  rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
  rvest::html_attr(name = 'href') -> website



# * Custom Function for purrr::map_df -------------------------------------

scrape_fac_data = function(url){
  
  webpage = rvest::read_html(url)
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(1)") |> 
    rvest::html_text2() -> department
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_text2() -> name
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > i") |> 
    rvest::html_text2() -> position
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_attr(name = 'href') -> website
  
  df = data.frame(department, name, position, website)
  
  return(df)
}



# * Option 1: purrr::map_df solutions --------------------------------------

urls = c(
  'https://miamioh.edu/fsb/directory/?up=/query/all/all/Accountancy/all',
  'https://miamioh.edu/fsb/directory/?up=/query/all/all/Economics/all',
  'https://miamioh.edu/fsb/directory/?up=/query/all/all/Entrepreneurship/all',
  'https://miamioh.edu/fsb/directory/?up=/query/all/all/Finance/all',
  'https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all',
  'https://miamioh.edu/fsb/directory/?up=/query/all/all/Marketing/all',
  'https://miamioh.edu/fsb/directory/?up=/query/all/all/Management/all'
)

fac_df1 = purrr::map_df(urls, scrape_fac_data)



# * Option 2: For loop with the function ----------------------------------

fac_df2 = data.frame()

for (counter in 1:length(urls)) {
  url = urls[counter]
  
  df = scrape_fac_data(url)
  
  fac_df2 = rbind(fac_df2, df)
  
}



# * Option 3: For Loop without the Custom Function ------------------------

fac_df3 = data.frame()

for (counter in 1:length(urls)) {
  url = urls[counter]
  
  webpage = rvest::read_html(url)
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(1)") |> 
    rvest::html_text2() -> department
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_text2() -> name
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > i") |> 
    rvest::html_text2() -> position
  
  webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_attr(name = 'href') -> website
  
  df = data.frame(department, name, position, website)
  
  fac_df3 = rbind(fac_df3, df)
  
}

