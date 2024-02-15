

# * Answering the Q about Subsetting Lists --------------------------------

my_list = list( 
  list1 = list( 1:5, "a", c(TRUE, FALSE, TRUE), c(2.3, 5.9) ),
  val1 = 5
  )

test_subset = my_list[[1]]
test_subset2 = my_list[['list1']]



# * Tibbles vs Data Frames ---------------------------------------------------------------

dept = c('ACC', 'ECO', 'FIN', 'ISA', 'MGMT')
nfaculty = c(18L, 19L, 14L, 25L, 22L)

fsb_tbl <- tibble::tibble(
  department = dept, 
  count = nfaculty, 
  percentage = count / sum(count)
  )
fsb_tbl # prints out nicely (showing the class of each col and the size of data)
class(fsb_tbl)

# difference 1 is when you print out a data.frame you do not get the things above
fsb_df <- data.frame(
  department = dept, 
  count = nfaculty
)
fsb_df$percentage = fsb_df$count / sum(fsb_df$count)


fsb_df
class(fsb_df)

# subsetting: in df -> vec (or a single item) can happen
# in a tibble, you have to be intentional to convert into a diff data structure
count_val = fsb_df[1, 'count'] # returns a single value (or a vec of len 1)
count_tbl = fsb_tbl[1, 'count'] # returns a tibble of 1 col and 1 row




# * Help for read_csv -----------------------------------------------------

# if I do not have the library loaded
?readr::read_csv()
# from the help, you have to specify a value for file (parameter 1)
# everything else has default values (due to the use of = in the function help)




# * Reading the equifax data ----------------------------------------------

equifax = readr::read_csv(
  file = 'data/simulated_equifax_breach_data.csv'
    )



# * UNRATE ----------------------------------------------------------------

unrate_tbl = readr::read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1318&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2024-01-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2024-02-06&revision_date=2024-02-06&nd=1948-01-01")

# gives you an overview of the data
# similar to the default str()
# but it ensures that you can see every column in its sep row
dplyr::glimpse(unrate_tbl)
class(unrate_tbl)

unrate_df = read.csv('https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1318&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2024-01-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2024-02-06&revision_date=2024-02-06&nd=1948-01-01')
class(unrate_df)

# third difference between read.csv and readr::read_csv()
# the readr::read_csv() TRIES to guess column types which is helpful with dates
dplyr::glimpse(unrate_df)

unrate_tbl[1,1]
unrate_df[1,1]



# * SuperBowl Ads ---------------------------------------------------------

sb = readr::read_csv("https://raw.githubusercontent.com/rfordatascience/tidytuesday/2e9bd5a67e09b14d01f616b00f7f7e0931515d24/data/2021/2021-03-02/youtube.csv")




# * The Excel Example -----------------------------------------------------

## First step is to always open the file whenever possible to:
## [a] check for whether we have headers in our data;
## [b] should we skip any rows at the beginning
## [c] In the case of Excel, which sheet contains the data you want to read.

ai_df = readxl::read_xlsx(
  path = 'data/AIAAIC Repository.xlsx',
  sheet = 2,
  skip = 1 # this is only for this file given that our headers were in row # 2
)

# Things to potentially do to have a cleaner data frame include:
# [1] Remove Row 1 from ai_df
# [2] Keep columns until Summary/links -- we do not seem to have useful info
# after that
# [3] Fix any column classes that need fixing



# * JSON Data -------------------------------------------------------------


us_reps = jsonlite::fromJSON(
  txt = 'https://www.govtrack.us/api/v2/role?current=true&role_type=representative&limit=438',
  flatten = TRUE
)

dplyr::glimpse(us_reps)

us_reps_df = us_reps$objects
us_reps_df2 = us_reps[[2]]

us_reps_tbl = tibble::tibble(us_reps_df)
dplyr::glimpse(us_reps_tbl)
