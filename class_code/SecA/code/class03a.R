

# * Assignment 02 ---------------------------------------------------------

my_list <- list(name = "Alice", age = 30, scores = c(85, 90, 78))

ans1 = my_list[[3]]
ans2 = my_list[3]



# * Tibbles vs Data Frames ------------------------------------------------

dept = c('ACC', 'ECO', 'FIN', 'ISA', 'MGMT')
nfaculty = c(18L, 19L, 14L, 25L, 22L)

fsb_tbl <- tibble::tibble(
  department = dept, 
  count = nfaculty, 
  percentage = count / sum(count)
  )

fsb_tbl
# tibbles when printed are going to show the number of rows (5) and the number of cols (3)
# they will also show the column names and types
class(fsb_tbl) # three classes; one of which is a data.frame

# contrasting to the traditional data frame
fsb_df = as.data.frame(fsb_tbl)
fsb_df
class(fsb_df) # only a data.frame as the class

# First diff between tbl and data frame was how they print
# second diff is that a tibble will return a tibble unless you are explicit
# by using [[]] or the $ operator

# case in point
df_ans = fsb_df[1,2]
# the output from df_ans is a single value that is an int
class(df_ans)

tbl_ans = fsb_tbl[1,2]
class(tbl_ans)

explicit_ans = fsb_tbl[[1,2]]



# * Reading CSV data ------------------------------------------------------

unrate1 = readr::read_csv("data/UNRATE.csv")
unrate2 = readr::read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1320&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2024-07-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2024-09-04&revision_date=2024-09-04&nd=1948-01-01")

# for those of you who used read.csv before
# let us highlight one difference
unrate3 = read.csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1320&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2024-07-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2024-09-04&revision_date=2024-09-04&nd=1948-01-01")

# let us compare the structure of both unrate2 and unrate3
str(unrate2) # this is a tibble with the Date column being understood to be a date
str(unrate3) # this is a df with the date column being a chr vector since it had text like symbols "-"

# if GitHub, make sure that you are reading the RAW dataset
women_df = readr::read_csv("https://raw.githubusercontent.com/glosophy/women-data/master/WomenTotal.csv")



# * Reading the Excel file ------------------------------------------------

ai_df = readxl::read_excel(
  path = "data/AIAAIC Repository.xlsx",
  sheet = 2, # in class I mentioned read either sheet 2 or 3 bec they contain data
  skip = 1, # we are skipping the first row bec it contains no relevant data
)

ai_df # from the printout, we have 1087 rows and 35 variables (tibble)

# optional, row one contains no data so we will delete it
ai_df = ai_df[-1, ] # delete row 1 and keep all cols (since nothing is provided after the comma)
ai_df



# * Reading JSON Data -----------------------------------------------------

sen = jsonlite::fromJSON(
  txt = "https://www.govtrack.us/api/v2/role?current=true&role_type=senator"
)

# all three options; subsetting the list based on the second sublist that is called objects
sen_df1 = sen[[2]] 
sen_df2 = sen$objects
sen_df3 = sen[['objects']]

dplyr::glimpse(sen_df1) # shows the internal structure of the data similar to the str()

# this will expand the columns that you had and that is why sen_df has now 45 cols
sen_df =  jsonlite::flatten(sen_df1)
dplyr::glimpse(sen_df)

sen_tbl = tibble::tibble(sen_df) # converts the df to a tibble

# exports the data using the write.csv or readr::write_csv
readr::write_csv(x = sen_tbl, file = "data/us_senators_secA.csv")
