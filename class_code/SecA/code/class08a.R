

# * Tidy Data -------------------------------------------------------------

tab1 = tidyr::table1 # alternatively > data('table1', package = 'tidyr')
tab1

# one benefit of tidy data is you can add calculations easily
# e.g., if I wanted to compute the rate
tab1 = tab1 |> 
  dplyr::mutate(
    rate = cases/population
  )
tab1



# * Make Tables 2-4 tidy --------------------------------------------------

table4a = tidyr::table4a

# we will make this longer since we want to have a row for each country year combination

table4a_l = table4a |> 
  tidyr::pivot_longer(
    cols = 2:3,
    names_to = 'year',
    values_to = 'cases'
  )
table4a_l

table4b = tidyr::table4b

table4b # we will make this longer since we want to have a row for each country year combination

table4b_l = table4b |> 
  tidyr::pivot_longer(
    cols = 2:3,
    names_to = 'year',
    values_to = 'population'
  )
table4b_l

# In SQL, how do you merge this two datasets together? table4a_l and table4b_l
# for the left join, we will use country and year (RECALL this is how we defined our unit of analysis for this dataset)

table4_full = 
  dplyr::left_join(
    x = table4a_l, y = table4b_l,
    by = c('country', 'year')
  )

# if the operation above works correctly, how many rows and how many cols should we get?
table4_full 


table2 = tidyr::table2

table2_wide = table2 |> 
  tidyr::pivot_wider(names_from = 'type', values_from = 'count')


table3 = tidyr::table3

table3_fixed = table3 |> 
  tidyr::separate(
    col = rate,
    into = c('cases', 'population'),
    sep = '/' # we could have left the default of non-alphanumeric chrs (we can also explicitly split on /)
  )



# * USA Facts Example -----------------------------------------------------

deaths_dot = read.csv("https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv")

deaths_underscore = readr::read_csv("https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv")

deaths_tidy_u = deaths_underscore |> 
  tidyr::pivot_longer(
    # from col 5 to the last col in the dataset seq(from=5, to = ncol(deaths_underscore), by =1)
    cols = 5:ncol(deaths_underscore), # from col 5 to the last col in the dataset
    names_to = 'date',
    values_to = 'deaths'
  )

deaths_tidy_dot = deaths_dot |> 
  tidyr::pivot_longer(
    # from col 5 to the last col in the dataset seq(from=5, to = ncol(deaths_underscore), by =1)
    cols = 5:ncol(deaths_dot), # from col 5 to the last col in the dataset
    names_to = 'date',
    values_to = 'deaths'
  )



# * Will not be on the Exam (Additional Benefits from tidy data) ----------

# e.g., let us look at Butler County in Ohio

butler = deaths_tidy_u |> 
  dplyr::filter(
    `County Name` == 'Butler County' & State == 'OH'
  ) |> dplyr::mutate(date = lubridate::ymd(date)) # converts date from chr to date


# one benefit is you can now plot it easily (not just in R but also PowerBI and Tableau)
butler |> 
  ggplot2::ggplot(mapping = ggplot2::aes(x = date, y = deaths)) +
  ggplot2::geom_line()

# you can do math easily
deaths_tidy_u |> 
  dplyr::filter(
    State == 'OH'
  ) |> 
  dplyr::group_by(`County Name`) |> 
  dplyr::mutate(
    date = lubridate::ymd(date),
    new_cases = deaths - dplyr::lag(deaths)
    ) -> ohio
