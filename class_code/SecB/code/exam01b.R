

# *Q3 ---------------------------------------------------------------------

lst = list( 
  gdp = data.frame(year = c(2020, 2021, 2022), values = c(19200, 20500, 21300), units = "USD billions" ),
  population = list(
    country = "United States", 
    year = c(2020, 2021, 2022), 
    values = c(325, 331, 335), 
    units = "millions"),
  indicators = c("gdp", "population", "inflation"), # Available indicators
  inflation_rate = 3.2 # Latest inflation rate as a single value
)

q3 = lst[[2]]



# *Q4 ---------------------------------------------------------------------

hibp = jsonlite::fromJSON(
  "data/hibp_data.json"
)
# option 1: look at your env
# option 2
dplyr::glimpse(hibp)



# *Q5 ---------------------------------------------------------------------

hibp[500, ] # from the output the breachName is Adobe
hibp$BreachName[500]



# * Q6 --------------------------------------------------------------------

# option 1 is to count in your text editor

# option 2
hibp$Email |> stringr::str_detect(pattern = "@miamioh.edu") -> miami_indices
miami_indices |> sum()
miami_indices |> table()
miami_df = hibp[miami_indices, ]

# option 3
hibp$BreachName |> table()



# *Q8 ---------------------------------------------------------------------

rvest::read_html("https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html") |> 
  rvest::html_elements(".news-lockup__body-link") |> 
  rvest::html_attr(name = "href") -> mu_links_a # if you stopped here, you get full credit

mu_links_a_full = rvest::url_absolute( 
  x= mu_links_a, 
  base = "https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/"
  )


rvest::read_html("https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html") |> 
  rvest::html_elements("p a") |> 
  rvest::html_attr(name = "href") -> mu_links_b
# THIS also worked

rvest::read_html("https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html") |> 
  rvest::html_elements("a.news-lockup__body-link") |> 
  rvest::html_attr(name = "href") -> mu_links_c # based on the inspector (but not copy selector)

rvest::read_html("https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html") |> 
  rvest::html_elements("a") |> # relaxed the selector to make it more general (but that ret 116 values)
  rvest::html_attr(name = "href") -> mu_links_d 

mu_links_d = mu_links_d[21:47] 



# * Q9 --------------------------------------------------------------------

"https://miamiredhawks.com/sports/swimming-and-diving/roster" |> 
  rvest::read_html() |> 
  rvest::html_elements("h3 a") |> 
  rvest::html_text2() -> names

"https://miamiredhawks.com/sports/swimming-and-diving/roster" |> 
  rvest::read_html() |> 
  rvest::html_elements(".sidearm-roster-player-academic-year") |> 
  rvest::html_text2() -> positions
positions = positions[1:144]
positions = positions[seq(2,144,2)]

# alternatively, let use the inspector
"https://miamiredhawks.com/sports/swimming-and-diving/roster" |> 
  rvest::read_html() |> 
  rvest::html_elements("div.sidearm-roster-player-name > h3 > a") |> 
  rvest::html_text2() -> names_b

"https://miamiredhawks.com/sports/swimming-and-diving/roster" |> 
  rvest::read_html() |> 
  rvest::html_elements("div.sidearm-roster-player-class-hometown > span.sidearm-roster-player-academic-year") |> 
  rvest::html_text2() -> positions_b
positions_b = positions_b[seq(2,144,2)]



# * Q11 -------------------------------------------------------------------

ip = "39.58.115.54"

ip_api = function(ip){
  
  req = jsonlite::fromJSON(
    paste0(
      "http://ip-api.com/json/",
      ip,
      "?fields=status,message,continent,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,currency,isp,org,as,query"
    )
  )
  
  resp = as.data.frame(req)
  
  return(resp)
}

toxic_ips = readr::read_csv("data/toxic_ips_oct2024.csv")
ips = toxic_ips$IP

toxic_df = purrr::map_df(.x = ips, .f = ip_api)



# * Q12 -------------------------------------------------------------------

wb_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/wb_hospital_beds.csv')




# * Q14 -------------------------------------------------------------------

# reading the data from my github repo to avoid an issues with file location
ntse_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/ntse_endowment_us_and_canada_2020.csv')

# a glimpse of the data
# for this analysis, do NOT convert chr to factors (do not worry about this)
dplyr::glimpse(ntse_tbl)







