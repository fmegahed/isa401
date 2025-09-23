

# * Trial Run: Checking Just One Webpage ----------------------------------

webpage = rvest::read_html("https://miamioh.edu/fsb/directory/?up=/query/all/all/Accountancy/all")

dept = webpage |> 
  rvest::html_elements("tr > td:nth-child(1)") |> 
  rvest::html_text2()

name = webpage |> 
  rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
  rvest::html_text2()

fac_webpage = webpage |> 
  rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
  rvest::html_attr("href")

position = webpage |> 
  rvest::html_elements("tr > td:nth-child(3) > i") |> 
  rvest::html_text2()

df = data.frame(dept, name, position, fac_webpage)



# * Multiple Webpages -----------------------------------------------------

urls = c(
  "https://miamioh.edu/fsb/directory/?up=/query/all/all/Accountancy/all",
  "https://miamioh.edu/fsb/directory/?up=/query/all/all/Economics/all",
  "https://miamioh.edu/fsb/directory/?up=/query/all/all/Entrepreneurship/all",
  "https://miamioh.edu/fsb/directory/?up=/query/all/all/Finance/all",
  "https://miamioh.edu/fsb/directory/?up=/query/all/all/Information%20Systems%20--%20Analytics/all",
  "https://miamioh.edu/fsb/directory/?up=/query/all/all/Marketing/all",
  "https://miamioh.edu/fsb/directory/?up=/query/all/all/Management/all"
  )

# Option 1: a for loop

all_data = data.frame()

for (url in urls) {
  webpage = rvest::read_html(url)
  
  dept = webpage |> 
    rvest::html_elements("tr > td:nth-child(1)") |> 
    rvest::html_text2()
  
  name = webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_text2()
  
  fac_webpage = webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_attr("href")
  
  position = webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > i") |> 
    rvest::html_text2()
  
  df = data.frame(dept, name, position, fac_webpage)
  
  all_data = rbind(all_data, df)
}


# Option 2: map_df approach

scrape_fsb_page = function(url){
  webpage = rvest::read_html(url)
  
  dept = webpage |> 
    rvest::html_elements("tr > td:nth-child(1)") |> 
    rvest::html_text2()
  
  name = webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_text2()
  
  fac_webpage = webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > strong > a") |> 
    rvest::html_attr("href")
  
  position = webpage |> 
    rvest::html_elements("tr > td:nth-child(3) > i") |> 
    rvest::html_text2()
  
  df = data.frame(dept, name, position, fac_webpage)
  
  return(df)
}

all_data2 = purrr::map_df(.x = urls, .f = scrape_fsb_page)
