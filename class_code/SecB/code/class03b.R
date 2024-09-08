
# * Assignment 02 ---------------------------------------------------------

my_list <- list(name = "Alice", age = 30, scores = c(85, 90, 78))

option1 = my_list[3] # return the third sublist from my_list and this will be stored in a list
option2 = my_list[[3]] # return the third sublist in its original form (which is a num vec)

# verify the text that I had either by looking at the environment or by using the class fun
class(option1)
class(option2)


# * Diff between tibbles and data frames ----------------------------------

dept = c('ACC', 'ECO', 'FIN', 'ISA', 'MGMT')
nfaculty = c(18L, 19L, 14L, 25L, 22L)

fsb_tbl <- tibble::tibble(
  department = dept, 
  count = nfaculty, 
  percentage = count / sum(count)
  )

fsb_df = as.data.frame(fsb_tbl)

# diff between tbls and data frames
# [1] They print differently
fsb_tbl # printing shows dim of the tibble 5 rows and 3 cols; as well as the types of each columns
fsb_df # shows only the column names and the values

# [2] You have to be intentional to change the tibble into something else
# intential == [[]] or $; this is something to keep in mind
df_out = fsb_df[4,2] # returns a single value (as shown in values in env)
class(df_out)

# on the other hand for the tbl
tbl_out1 = fsb_tbl[4,2] # returns a tibble of 1 row and 1 col
tbl_out1 # confirming my notes from above
class(tbl_out1)

# Q how to return the 25L as a single value from the tibble?
tbl_out2 = fsb_tbl[[4,2]]
class(tbl_out2)

# a made up example (a named list; of three sublists)
lst_of_dfs = list(df1 = fsb_df, df2 = fsb_tbl, val = tbl_out2)

# if I were to use a single sq bracket
lst1 = lst_of_dfs[1] # returns a list of 1 sublist which is a data frame corresponding to fsb_df
lst1b = lst_of_dfs['df1']

# if I wanted to return only the data frame
df1a = lst_of_dfs[[1]]
df1b = lst_of_dfs[['df1']]
df1c = lst_of_dfs$df1


# same applies to data frames and tibbles
out1 = fsb_df[1]
out2a = fsb_df$department
out2b = fsb_df[[1]]
out3 = fsb_df[c(1,5), ] # returns a tibble of rows 1 (ACC) and 5 (MGMT) with all columns bec nothing is after the ,



# * Reading CSVs (locally) ------------------------------------------------
unrate1 = readr::read_csv(
  file = "data/UNRATE.csv"
)
unrate1 # is a tibble

unrate2 = read.csv(file = "data/UNRATE.csv")
unrate2 # is a data.frame and date is a chr vector

# returns the internal structure, showing column types and the first few obs
str(unrate2) # the reason is that the read.csv does not guess col types
# so it treated the "-" as text

unrate3 = readr::read_csv(
  file = "https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1320&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2024-07-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2024-09-04&revision_date=2024-09-04&nd=1948-01-01"
)
