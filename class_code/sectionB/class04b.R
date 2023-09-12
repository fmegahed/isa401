
fred_df = readr::read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1318&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2023-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2023-09-07&revision_date=2023-09-07&nd=1948-01-01")

# this is the equivalent of describe in python (. is now a pipe, in python multiple dots is chaining)
fred_df |> summary()
fred_df |> dplyr::glimpse()
str(fred_df) # almost identical to glimpse, but I like how glimpse prints (var name, type, first few obs)



# * Excel -----------------------------------------------------------------

ai_df = readxl::read_excel('AIAAIC Repository.xlsx', sheet = 2, skip = 1)
ai_df1 = ai_df[-1, ] # remove row 1 (after the comma is empty so keep all cols)
ai_df2 = ai_df[2:1087, 1:35] # equivalent

dplyr::glimpse(ai_df1)


# * Senators --------------------------------------------------------------

sen_data = jsonlite::fromJSON('https://www.govtrack.us/api/v2/role?current=true&role_type=senator')

# checking for the names of the sublists (2 names based on right environment)
# names may be empty similar to the lst example from last class
names(sen_data)
dplyr::glimpse(sen_data)

sen_df = sen_data[['objects']] # sen_data$objects
sen_df = jsonlite::flatten(sen_df) # to make it a nice non-nested df
