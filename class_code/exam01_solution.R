

# * Q3 --------------------------------------------------------------------

lst = list( 
  gdp = data.frame(year = c(2020, 2021, 2022), values = c(19200, 20500, 21300), units = "USD billions" ),
  population = list(country = "United States", year = c(2020, 2021, 2022), values = c(325, 331, 335), units = "millions"),
  indicators = c("gdp", "population", "inflation"), # Available indicators
  inflation_rate = 3.2 # Latest inflation rate as a single value
)

q3_answer = lst[[2]]



# * Q4-6 ------------------------------------------------------------------

df4 = jsonlite::fromJSON("data/hibp_data.json")
nrow(df4)

df4[500, "BreachName"]

df4$Email |> stringr::str_detect("miamioh.edu") |> table()



# * Q8 --------------------------------------------------------------------
mu_policy_page = rvest::read_html("https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html")

mu_policy_page |> 
  rvest::html_elements("div > p > a") |> 
  rvest::html_attr("href") |> 
  rvest::url_absolute("https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/")



# * Q9 --------------------------------------------------------------------

mu_swim_page = rvest::read_html("https://miamiredhawks.com/sports/swimming-and-diving/roster")

mu_swim_page |> 
  rvest::html_elements("span.s-person-card__content__person__location-item.flex.items-center") |> 
  rvest::html_text2() |> 
  stringr::str_remove("Hometown ") -> hometown


mu_swim_page |> 
  rvest::html_elements("div > a > h3") |> 
  rvest::html_text2() -> names

names = names[1:60]

swim_df = data.frame(name = names, location = hometown)



# * IP Address Question ---------------------------------------------------

ip_df = readr::read_csv("data/toxic_ips_oct2025.csv")

ips = ip_df$IP

first_part_query = "http://ip-api.com/json/"
middle_part_query = "2.217.27.61"
end_part_query = "?fields=10022911"

queries = paste0(first_part_query, ips, end_part_query)

q11_all = data.frame()
for (query in queries) {
  df = jsonlite::fromJSON(query)
  
  df_converted <- data.frame(
    status = df$status,
    continent = df$continent,
    country = df$country,
    countryCode = df$countryCode,
    region = df$region,
    regionName = df$regionName,
    city = df$city,
    district = df$district,
    zip = df$zip,
    lat = df$lat,
    lon = df$lon,
    timezone = df$timezone,
    currency = df$currency,
    isp = df$isp,
    org = df$org,
    as = df$as,
    query = df$query
  )
  
  q11_all = rbind(q11_all, df_converted)
}



# * Q12 -------------------------------------------------------------------

wb_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/wb_hospital_beds.csv')



# * Q14 -------------------------------------------------------------------
ntse_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/ntse_endowment_us_and_canada_2020.csv')

# a glimpse of the data
# for this analysis, do NOT convert chr to factors (do not worry about this)
dplyr::glimpse(ntse_tbl)

