



# * Question 10 -----------------------------------------------------------

toxic_df = read.csv("data/toxic_ips.csv")[[1]]


start_url = 'https://ipinfo.io/'
end_url = "/json?token=e5b161f3dda916"

q10_df = data.frame()

for (i in 1:5) {
  ip = toxic_df[i] # this assumes that you converted it to a vec
  request = jsonlite::fromJSON( paste0(start_url, ip, end_url) )
  request = request |> data.frame() |> dplyr::select(ip, city, country)
  
  q10_df = rbind(q10_df, request) # so you do not overwrite the result and return a df of 5 obs
  
}


#as a list 
q10_lst = list()

for (i in 1:5) {
  ip = toxic_df[i] # this assumes that you converted it to a vec
  request = jsonlite::fromJSON( paste0(start_url, ip, end_url) ) 
  
  q10_lst[[ip]] = request
  
}



# * Question 12 -----------------------------------------------------------

esg = readr::read_csv(
  "https://raw.githubusercontent.com/fmegahed/isa401/main/data/Data_Extract_FromEnvironment%20Social%20and%20Governance%20(ESG)%20Data.csv"
)

esg_long = esg |> 
  tidyr::pivot_longer(cols = -c(1), names_to = "year", values_to = "value") |> 
  dplyr::mutate(year = as.numeric(year)) |> 
  dplyr::rename(esg_metric = `...1`) |> 
  dplyr::mutate(country = 'United States') |> 
  dplyr::select(country, esg_metric, year, value)

dplyr::glimpse(esg_long)


esg_long |> 
  dplyr::filter(country == "United States") |> 
  ggplot2::ggplot(
    ggplot2::aes(x = year, y = value, group = esg_metric, color = esg_metric)
  ) + 
  ggplot2::geom_line() +
  ggplot2::facet_wrap(facets = ~ esg_metric) +
  ggplot2::theme(legend.position = 'none')




# * Question 15 -----------------------------------------------------------

is.na(esg_long$value) |> sum()

