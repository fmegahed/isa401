


# * The Beauty of tidy data -----------------------------------------------
table1 = tidyr::table1

# doing this to highlight that two approaches are equivalent
table1a= table1
table1b = table1

# The nice thing about the data in this format is creating new columns is easy

# baseR option
table1a$cases_per_pop = 10000*table1a$cases / table1a$population

# to use tidyverse/dplyr
table1b = 
  table1b |> 
  # nice thing about mutate is you can use this to create multiple cols
  # it allows for "lazy" evaluation, so I am using the column names
  # with no quotes and with no data frame name
  dplyr::mutate(
    cases_per_pop = cases/population,
    cases_per_ten_thousand_pop = 10000* cases_per_pop
  )
table1b  



# * Pivot Longer Demo -----------------------------------------------------

table4a = tidyr::table4a
table4a

table4a_long = table4a |> 
  tidyr::pivot_longer(
    cols = 2:3, # I am using the column locations
    names_to = 'year',
    values_to = 'cases'
  )
table4a_long

table4b = tidyr::table4b
table4b

table4b_long = table4b |> 
  tidyr::pivot_longer(
    cols = `1999`:`2000`, # I am using the column names
    names_to = 'year',
    values_to = 'population'
  )
table4b_long

# bonus tip
# given that the data is tidy and we know that the unit of analysis is country-year

table4_all = dplyr::left_join(
  x = table4a_long, y = table4b_long,
  by = c("country", "year")
)

table4_all2 = dplyr::full_join(
  x = table4a_long, y = table4b_long,
  by = c("country", "year")
)

# TANGENT: answering the question about making a common primary key
k1 = table4a_long |> dplyr::mutate(key = paste(country, year, sep = '_'))
k2 = table4b_long |> dplyr::mutate(key = paste(country, year, sep = '_'))

# will need some additional data cleaning but it did do the merge correctly
k = dplyr::left_join(x = k1, 
                     y = k2 |> dplyr::select(-c(country, year)), 
                     by ='key')
k



# * Pivot Wider Demo ------------------------------------------------------

table2 = tidyr::table2

table2_tidy = table2 |> 
  tidyr::pivot_wider(names_from = type, values_from = count)
table2_tidy



# * Separate --------------------------------------------------------------

table3 = tidyr::table3

table3_tidy = table3 |> 
  tidyr::separate(
    col = rate, # column to be separated (you do not have to put the col name in " ")
    into = c("cases", "pop"), 
    sep = '/'
  )
table3_tidy





# * USA Facts Dataset -----------------------------------------------------

deaths = read.csv("https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.63111023.1711060906.1709061427-1460338808.1709061427")

# observation all dates start with an X
dplyr::glimpse(deaths)

deaths_tidy = tidyr::pivot_longer(
  data = deaths, # you could have piped that in
  cols = 5:1269, # using the column locations after inspecting them in the viewer
  names_to = 'date',
  values_to = 'deaths'
)

# definitely optional, to remove the X from date
deaths_tidy = deaths_tidy |> 
  dplyr::mutate(
    date = stringr::str_remove_all(date, 'X') |> lubridate::ymd()
  )

dplyr::glimpse(deaths_tidy)  

