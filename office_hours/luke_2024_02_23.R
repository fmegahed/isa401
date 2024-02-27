"https://en.wikipedia.org/wiki/Miami_Hurricanes_football" |> 
  rvest::read_html() |> 
  rvest::html_element("h3 span") |> 
  rvest::html_text2() -> one_element

"https://en.wikipedia.org/wiki/Miami_Hurricanes_football" |> 
  rvest::read_html() |> 
  rvest::html_elements("h3 span.mw-headline") |> 
  rvest::html_text2() ->  multiple_elements



# * Example highlighting the difference between datetime and date ---------

crypto_list = jsonlite::fromJSON("https://min-api.cryptocompare.com/data/v2/histohour?fsym=BTC&tsym=USD&limit=50&api_key=0327a7419d40e3044ed709ae540da577c8c8c3253ed95cff77e6d952e68e8fbf")

hourly_df = crypto_list$Data$Data

hourly_df = hourly_df |> 
  dplyr::mutate(
    datetime = lubridate::as_datetime(time),
    date = lubridate::date(datetime)
  )

luke = "2024-02-23"
class(luke)

luke = lubridate::ymd(luke)
class(luke)

fake_data = c('Oxford', 'Ohio', "Mason", "Ohio")

data_keep = seq(from= 2, to = 4, by = 2)
fake_data[data_keep]




# * Purrr vs for loop -----------------------------------------------------

# ** For loop

"https://www.planecrashinfo.com/2024/2024.htm" |> 
  rvest::read_html() |> 
  rvest::html_element("table") |> 
  rvest::html_table(header = 1) -> plane_crash

urls = c("https://www.planecrashinfo.com/2024/2024.htm", "https://www.planecrashinfo.com/2023/2023.htm")

plane_crash_df = data.frame()
for (link in urls) {
  link |> 
    rvest::read_html() |> 
    rvest::html_element("table") |> 
    rvest::html_table(header = 1) -> plane_crash
  
  print(plane_crash)
  plane_crash_df = rbind(plane_crash, plane_crash_df)
}

# ** Purrr
luke_scrape = function(link){
  link |> 
    rvest::read_html() |> 
    rvest::html_element("table") |> 
    rvest::html_table(header = 1) -> plane_crash
  
  return(plane_crash)
}

all_crashes = purrr::map_df(.x = urls, .f = luke_scrape)
