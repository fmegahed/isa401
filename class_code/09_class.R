

# * Class Activity --------------------------------------------------------

tidyr::table1



# * Fixing the issues with our four tables --------------------------------

table4a = tidyr::table4a

# Our goal is to make this wide dataset longer
# To do that:
# We expect to have 6 rows of data instead of 3
# Variables: (a) country, (b) year, (c) cases

table4a_tidy1 = tidyr::pivot_longer(
  data = table4a,
  cols = 2:3,
  names_to = "year",
  values_to = "cases"
)

table4a_tidy2 = tidyr::pivot_longer(
  data = table4a,
  cols = `1999`:`2000`, # using back ticks for improper col names (start with a-z and have no spaces)
  names_to = "year",
  values_to = "cases"
)

table4b_tidy1 = tidyr::pivot_longer(
  data = tidyr::table4b,
  cols = 2:3,
  names_to = "year",
  values_to = "population"
)

table1_reconstructed_from_tables_4a_4b = 
  dplyr::left_join(
    x = table4a_tidy1, y = table4b_tidy1,
    by = c('country', 'year')
  )


table2 = tidyr::table2
# from long to tidy
# split the variables in type --> the type col captures the name of the variables
# their value is stored in count

# piped the data so you can see something different 
# (pipe, makes what is before the pipe the first input to the next function)
table2_tidy = table2 |> 
  tidyr::pivot_wider(names_from = "type", values_from = "count")


table3 = tidyr::table3

table3_tidy = tidyr::separate(
  data = table3, col = 'rate', into = c('cases', 'population'),
  convert = T
) |> # beauty of tidy data, you can easily manipulate it to create new cols/vars
  dplyr::mutate(
    rate = cases/population
  )

table3_tidy2 = tidyr::separate(
  data = table3, col = 'rate', into = c('cases', 'population'),
  convert = T, sep = "/" # explicitly sep on "/" vs the default of non-[a-z] and non numeric chrs
) |> # beauty of tidy data, you can easily manipulate it to create new cols/vars
  dplyr::mutate(
    rate = cases/population
  )

# without convert, the cases and pop are chr vectors
# not saving, just printing to show you the print out
tidyr::separate(table3, rate, into = c("cases", "population"))




# * COVID Data ------------------------------------------------------------

# only one of the two approaches is needed
deaths_readr = readr::read_csv("https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv")

tidy_deaths_readr = deaths_readr |> 
  tidyr::pivot_longer(
    cols = 5:1269,
    names_to = 'date',
    values_to = 'cases'
  ) |> # also clean the date
  dplyr::mutate(
    date = lubridate::ymd(date)
  )
# readr makes the process of cleaning this a bit easier since it does not the add the "X"

deaths_base_r = read.csv("https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv")

tidy_deaths_base_r = deaths_base_r |> 
  tidyr::pivot_longer(
    cols = 5:1269,
    names_to = 'date',
    values_to = 'cases'
  ) |> # also clean the date
  dplyr::mutate(
    date = stringr::str_remove(date, "X") |> lubridate::ymd()
  )

dplyr::glimpse(tidy_deaths_readr)

class(tidy_deaths_readr$date)



# * Making the Plane Crash Dataset tidy -----------------------------------

planes = rvest::read_html("https://www.planecrashinfo.com/2024/2024.htm") |> 
  rvest::html_element("table") |> rvest::html_table()

