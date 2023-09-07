
install.packages("tidyverse") # we only need to do this once


# * Read Local Data -------------------------------------------------------


# skip = 1; skip the first row of data that had incomplete header names
burrow_df = readr::read_csv('burrow_career_stats.csv', skip = 1)

dplyr::glimpse(burrow_df)



# * Read Web Data ---------------------------------------------------------

wh_df = readr::read_csv("https://www.whitehouse.gov/wp-content/uploads/2023/08/2023.05_WAVES-ACCESS-RECORDS.csv")

unrate_df = readr::read_csv('https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1318&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2023-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2023-09-05&revision_date=2023-09-05&nd=1948-01-01')



# * GitHub ----------------------------------------------------------------
gh_df = readr::read_csv('https://github.com/nytimes/covid-19-data/raw/master/us-states.csv')

