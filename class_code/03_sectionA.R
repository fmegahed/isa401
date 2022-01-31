# Code written in class on January 31, 2022
# Topics covered: subsetting, importing data, and exporting data



# # Preface ---------------------------------------------------------------


x_vec = rnorm(n=10)
class(x_vec)
typeof(x_vec)
mode(x_vec)

# with integers, the results are different
y_vec = c(1L, 2L, 3L)
class(y_vec)
typeof(y_vec)
mode(y_vec)


x_vec
x_vec[10]
x_vec[-c(1:9)]



# # Reading CSV Data ------------------------------------------------------

# installing the pacman package if required
if(require(pacman)==FALSE) install.packages("pacman")
pacman::p_load(tidyverse) # readr pkg to be available

### Alternatively
if(require(tidyverse)==FALSE) install.packages("tidyverse")
library(tidyverse)


qb1 = read_csv(file = "Data/burrow_stats_2021_season_prior_to_chiefs_game.csv")

# this is similar to the str() -> prints more nicely in console
# function gives you the type, name and first few observations of each col
glimpse(qb1) 

# Dimension related stuff
ncol(qb1) # cols
nrow(qb1) # rows
dim(qb1) # rows and columns

qb

# FRED Data
unrate = read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=748&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2021-12-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-01-31&revision_date=2022-01-31&nd=1948-01-01")

# why some people prefer the readr functions compared to "base r"
unrate2 = read.csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=748&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2021-12-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-01-31&revision_date=2022-01-31&nd=1948-01-01")
glimpse(unrate)
glimpse(unrate2)

# approach 3 for the FRED Data
download.file(url = "https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=748&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2021-12-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-01-31&revision_date=2022-01-31&nd=1948-01-01",
              destfile = "Data/unrate.csv")
unrate3 = read_csv("Data/unrate.csv")

x = ymd(unrate$DATE)


# NYT Data

## Go to the link
### Clicked on view raw data
### https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv

nyt_covid = read_csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv")



# # Read Excel Data -------------------------------------------------------
pacman::p_load(readxl, jsonlite)

who = read_xlsx("Data/IndicatorData-20220129152901974.xlsx")
glimpse(who)



# # JSON Data -------------------------------------------------------------
nobel = fromJSON("http://api.nobelprize.org/v1/laureate.json")

# would overwrite the nobel list
# extract the first sublist based on our glimpse(nobel)
# save the extracted sublist into a tibble format instead of a data frame
nobel = nobel[[1]] %>% as_tibble()

nobel

write_csv(nobel, file = "Data/nobel_winners.csv")



