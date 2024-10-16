

# * Q3 --------------------------------------------------------------------

lst = list( 
  gdp = data.frame(year = c(2020, 2021, 2022), values = c(19200, 20500, 21300), units = "USD billions" ),
  population = list(country = "United States", year = c(2020, 2021, 2022), values = c(325, 331, 335), units = "millions"),
  indicators = c("gdp", "population", "inflation"), # Available indicators
  inflation_rate = 3.2 # Latest inflation rate as a single value
)

q3 = lst[[2]]



# * Q4-6 ------------------------------------------------------------------

hibp = jsonlite::fromJSON("data/hibp_data.json")
dplyr::glimpse(hibp)

hibp[500,]
hibp[500, 'BreachName']
hibp$BreachName[500]

stringr::str_detect(hibp$Email, "miami") |> sum() # approach 1a
stringr::str_detect(hibp$Email, "miami") |> table() # approach 1b

miami_index = stringr::str_detect(hibp$Email, "miami") # approach2
miami_df = hibp[miami_index, ]
# you could also type in miamioh in the search when you view that df # approach 3
# you could also count in the text editor # approach 4



# * Q8 --------------------------------------------------------------------

"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements(".news-lockup__body-link") |> 
  rvest::html_attr(name = 'href') -> q8a

q8a |> # optional
  rvest::url_absolute(base = "https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/") ->
  q8a_full


"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements("p a") |> 
  rvest::html_attr(name = 'href') -> q8b # this is also correct and we can follow up similar to q8a (optional)

"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements("a.news-lockup__body-link") |> 
  rvest::html_attr(name = 'href') -> q8c

"https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html" |> 
  rvest::read_html() |> 
  rvest::html_elements("a") |> 
  rvest::html_attr(name = 'href') -> q8d

q8d = q8d[21:47]



# * Q9 --------------------------------------------------------------------

mu_page = "https://miamiredhawks.com/sports/swimming-and-diving/roster" |> 
  rvest::read_html()

names = mu_page |> 
  rvest::html_elements("h3 a") |> rvest::html_text2()

names_b = mu_page |> 
  rvest::html_elements("ul > li > div > div.sidearm-roster-player-details.flex.flex-align-center.large-6.x-small-12.full.columns > div.sidearm-roster-player-pertinents.flex-item-1.column > div.sidearm-roster-player-name > h3 > a") |> 
  rvest::html_text2()

positions = mu_page |> 
  rvest::html_elements(".sidearm-roster-player-academic-year") |> 
  rvest::html_text2()

positions = positions[1:144]
positions = positions[seq(2, 144, 2)]

positions_b = mu_page |> 
  rvest::html_elements("div.sidearm-roster-player-class-hometown > span.sidearm-roster-player-academic-year") |> 
  rvest::html_text2()
positions_b = positions_b[seq(2, 144, 2)]



# * Q11 -------------------------------------------------------------------

toxic_ips = readr::read_csv("data/toxic_ips_oct2024.csv")
ips = toxic_ips$IP
ip = ips[3]

ips_fun = function(ip){
  req = paste0(
    "http://ip-api.com/json/",
    ip,
    "?fields=10022911"
  )
  
  resp = jsonlite::fromJSON(req) |> as.data.frame()
  
  return(resp)
}
  
ip_df = purrr::map_df(.x = ips, .f = ips_fun)



# * Q12 -------------------------------------------------------------------
wb_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/wb_hospital_beds.csv')

