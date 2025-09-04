
# * Reading CSV Data from the Web -----------------------------------------

unrate_fred = readr::read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23ebf3fb&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1320&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2025-07-01&line_color=%230073e6&link_values=false&line_style=solid&mark_type=none&mw=3&lw=3&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2025-09-02&revision_date=2025-09-02&nd=1948-01-01")
dplyr::glimpse(unrate_fred)

# because it is a date, you can filter dates that are e.g., >= to a specific date
unrate_fred |> 
  dplyr::filter(observation_date >= "2025-01-01")

# using the read.csv() that you may have used before
unrate_classical = read.csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23ebf3fb&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1320&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2025-07-01&line_color=%230073e6&link_values=false&line_style=solid&mark_type=none&mw=3&lw=3&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2025-09-02&revision_date=2025-09-02&nd=1948-01-01")

str(unrate_classical)
dplyr::glimpse(unrate_classical)

# the code below will return an error because observation_date is a chr
# i.e., it is treated the same way you treat names (you cannot say that Adam)
# e.g., you cannot put x as a string in the x-axis
plot(x = unrate_classical$observation_date, y = unrate_classical$UNRATE)

# but this will work
plot(x = unrate_fred$observation_date, y = unrate_fred$UNRATE)



# * * From GitHub ---------------------------------------------------------

women_df = readr::read_csv(
  "https://raw.githubusercontent.com/glosophy/women-data/refs/heads/master/WomenTotal.csv"
  )




# * Reading the UNRATE (locally) ------------------------------------------

unrate = readr::read_csv("data/UNRATE.csv")
unrate_hannah = readr::read_csv("UNRATE_Hannah.csv") # if its in the proj dir and not in data subfolder


# * Assuming that the file is large ---------------------------------------

unrate_vroom = vroom::vroom("data/UNRATE.csv") # assumes that you did install.packages("vroom") once in console



# * Read the Excel Data ---------------------------------------------------

ai_incidents = readxl::read_xlsx(
  path = "data/AIAAIC Repository.xlsx",
  sheet = 3, # we are interested in the third sheet named "Incidents"
  skip = 1 # skip first row since it did not contain the headers/ col names
)
str(ai_incidents)
dplyr::glimpse(ai_incidents)


# some cleaning of column names based on inspecting the excel file
colnames(ai_incidents)[c(14, 15, 16)] = 
  c('External Harms:Individual', 'External Harms: Societal', "External Harms: Env")


# subsetting in place
# negative is to drop
ai_incidents = ai_incidents[-1, ] # remove all the data in row 1, all columns
