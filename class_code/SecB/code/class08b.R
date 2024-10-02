

# * Table 1 ---------------------------------------------------------------

# one option to load a specific dataset from a given package
data('table1', package = 'tidyr')

# the other option
tab1 = tidyr::table1

# one benefit of tidy data is that calculations are easy
# e.g., let us think of rate calc.

tab1 = tab1 |> 
  dplyr::mutate(
    rate = cases/population
  )
tab1

tab1$rate2 = tab1$cases / tab1$population
tab1



# * Pivot Longer (Table 4a and Table 4b) ----------------------------------

table4a = tidyr::table4a
table4b = tidyr::table4b

table4a |> 
  tidyr::pivot_longer(
    cols = 2:3, # in R with int separated by a colon will generate a seq (from first val to 2nd value by 1)
    names_to = 'year',
    values_to = 'cases'
  ) -> table4a_l


table4b |> 
  tidyr::pivot_longer(
    cols = 2:3, # in R with int separated by a colon will generate a seq (from first val to 2nd value by 1)
    names_to = 'year',
    values_to = 'population'
  ) -> table4b_l


# From ISA 245, how do we combine these two datasets together?
# Tell me the logic from SQL
# One option is to put the pop from dataset 2 as a column in dataset1
# this will work only if the rows are organized in the same way
# JOIN operation (what is the ideal key for this data;)
# the unit of analysis can help with identifying an appropriate key (country and year)

table4_full = 
  dplyr::left_join(x = table4a_l, y = table4b_l, by = c('country', 'year'))

# If this operation is successful, we expect to have 6 rows and 4 variables
table4_full



# * Pivot Wider (Table 2) -------------------------------------------------

table2 = tidyr::table2

table2_wide = table2 |> tidyr::pivot_wider(
  names_from = type, # where I am getting the col names from
  values_from = count, # where I am getting the values
)
# now corresponds to our initial table1



# * Table 3 (separate) ----------------------------------------------------

table3 = tidyr::table3

# not piping to emphasize that the first argument in all the functions is the dataset
table3_fixed = tidyr::separate(
  data = table3, 
  col = rate,
  into = c('cases', 'population'),
  sep = '/' # for this example we could have left sep into its default value of non-alphanumeric chrs
)



# * USA Facts -------------------------------------------------------------

deaths_dot = read.csv("https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv")
dplyr::glimpse(deaths_dot)

deaths_underscore = readr::read_csv("https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv")

deaths_underscore |> 
  tidyr::pivot_longer(
    cols = 5:ncol(deaths_underscore),
    names_to = 'date',
    values_to = 'cumulative_deaths'
  ) -> deaths_df

deaths_df = deaths_df |> 
  dplyr::mutate(date = lubridate::ymd(date)) # convert date from chr to date (it was year-month-day)




# * Further Demo for why tidy data is great (NOT for Exam) ----------------

# filter the data for butler county and we will plot it (not on the exam bec I will go over plotting quickly)
butler_county = 
  deaths_df |> 
  dplyr::filter(`County Name` == 'Butler County' & State == 'OH')

butler_county |> 
  ggplot2::ggplot(  ggplot2::aes(x = date, y = cumulative_deaths) ) +
  ggplot2::geom_line()


## doing math on this dataset is also easy

## e.g., let us see the cumulative deaths in OH
ohio = deaths_df |> 
  dplyr::filter(State == 'OH') |> 
  dplyr::group_by(date, State) |> 
  dplyr::summarise(
    total_deaths = sum(cumulative_deaths)
  )
