

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




