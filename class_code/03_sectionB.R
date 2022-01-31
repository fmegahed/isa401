# Code written in class on January 31, 2022
# Topics covered: subsetting, importing data, and exporting data



# Preface -----------------------------------------------------------------
# Did not work
library(fpp3)

# now will work
install.packages("fpp3")
library(fpp3)


x_vec = rnorm(5)
typeof(x_vec)
class(x_vec)
mode(x_vec)


y_vec = c(1L, 2L, 5L)
typeof(y_vec)
class(y_vec)
mode(y_vec)



# # Subsetting -----------------------------------------------------------

x_vec[-c(1,3)]
x_vec[c(2,4,5)]
x_vec[5]




# # Reading CSV files -----------------------------------------------------
if( require(pacman)==FALSE ) install.packages("pacman")
pacman::p_load(tidyverse)

# read_csv -> tibble, which makes it print prettier (readr pkg)
# requires you to be more explicit if you want to get a vector out of one of the cols
qb1 = read_csv("Data/burrow_stats_2021_season_prior_to_chiefs_game.csv")
qb1


# no pkgs needed for the read.csv
qb1_df = read.csv("Data/burrow_stats_2021_season_prior_to_chiefs_game.csv")
qb1_df

# Differences between data frame and a tibble
class(qb1[1, 'Week']) # returns a tibble/data frame
class(qb1_df[1, 'Week']) # returns a scalar (a 1-element vector)


# FRED Data ---------------------------------------------------------------

unrate_tbl = read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=748&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2021-12-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-01-31&revision_date=2022-01-31&nd=1948-01-01")
glimpse(unrate_tbl)

unrate_df = read.csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=748&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2021-12-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-01-31&revision_date=2022-01-31&nd=1948-01-01")
glimpse(unrate_df)


# Mobility Data -----------------------------------------------------------

# download a file from the web to an existing directory on your computer
download.file(url = "https://covid19-static.cdn-apple.com/covid19-mobility-data/2206HotfixDev37/v3/en-us/applemobilitytrends-2022-01-30.csv",
              destfile = "Data/apple.csv")

# reading the downloaded file
mobility = read_csv("Data/apple.csv")


# Women's rights ----------------------------------------------------------

wr = read_csv("https://raw.githubusercontent.com/glosophy/women-data/master/WomenTotal.csv")
glimpse(wr)



# Reading Excel Files -----------------------------------------------------

# if you had it in the proj directory and no Data folder
pacman::p_load(readxl)

who_tbl = read_xlsx(path = "Data/IndicatorData-20220129152901974.xlsx")
glimpse(who_tbl)


# Noble Winners -----------------------------------------------------------
pacman::p_load(jsonlite)
noble = fromJSON("http://api.nobelprize.org/v1/laureate.json")

# make it more consumable
noble[[1]] %>% as_tibble() -> noble_tbl
noble_tbl


# Exporting it for use with other programs --------------------------------


write_csv(x = noble_tbl,
          file = "Data/noble_winners_tbl.csv")
