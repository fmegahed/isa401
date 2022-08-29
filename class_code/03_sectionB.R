# Reading data in R


# * Finishing Up Materials from Slide Deck 02 -----------------------------
temp_high_forecast = c(86, 84, 85, 89, 89, 84, 81)
mean(x = temp_high_forecast)




# * Pacman (PACkage MANager) ----------------------------------------------

if(require(pacman)==F) install.packages('pacman')
pacman::p_load(tidyverse) # install and load (or just load the pkgs inside the fn)



# * Assignment 02 ---------------------------------------------------------

isa_class = "isa401"
x_vec = rnorm(n=10, mean = 0, sd = 1) # generating std normal dist data
class(x_vec)

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list

q4 = lst[2]
q4_scalar = lst[[2]]

df1 <- data.frame(x = 1:3, y = letters[1:3])
df1

df1$x



# * Subsetting ------------------------------------------------------------
x_vec
x_vec[-c(1,3)] # get and print everything but the first and thrid element in the vec

x_vec[1] = 401 # assigned 401 as the first element in x_vec (so I overwrote it)
x_vec

x_char = matrix( sample(letters, size = 12), nrow = 3, ncol =4 )
x_char

x_char[ , ]
x_char[2,]



# * Reading flat files ----------------------------------------------------

miami_fb = read_csv(file = 'data/miami_recruiting.csv')
miami_fb2 = read_csv(file = "Y:\\My Drive\\Miami\\Teaching\\ISA 401\\data/miami_recruiting.csv")

unrate = read_csv("https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2022-07-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-08-29&revision_date=2022-08-29&nd=1948-01-01")

nytimes = read_csv("https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-states.csv")



# * Reading the excel data ------------------------------------------------
pacman::p_load(readxl, jsonlite)
who_df = read_xlsx('data/IndicatorData-20220829151934281.xlsx')

github = fromJSON(txt = 'https://www.govtrack.us/api/v2/role?current=true&role_type=senator' )
github

senators_info = github[[2]]
