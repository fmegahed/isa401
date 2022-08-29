# This will contain the information from class03
# Extracting and loading data in R


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

lst[2] -> q4
lst[[2]] -> q4b

df1 <- data.frame(x = 1:3, y = letters[1:3])
df1
df1$x



# * Subsetting  -----------------------------------------------------------

x_vec = rnorm(3)
x_vec

x_vec[2]
x_vec[-c(1,3)]


x_mat = matrix( sample(1:10, size = 4), nrow = 2, ncol = 2 )
x_mat
x_mat[ , ] # will get all the values (so same as line above)
x_mat[1,] # would print row one and all columns (since after the comma is empty)
x_mat[, 1]



# * Importing Data in R ---------------------------------------------------
if(require(pacman)==F) install.packages("pacman")
pacman::p_load(tidyverse)


# * * Reading Flat Files --------------------------------------------------
miami_fb = read_csv('data/miami_recruiting.csv')
miami_fb_no_project = read_csv('Y:\\My Drive\\Miami\\Teaching\\ISA 401\\data\\miami_recruiting.csv')


unrate = read_csv(file = 'https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=UNRATE&scale=left&cosd=1948-01-01&coed=2022-07-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-08-29&revision_date=2022-08-29&nd=1948-01-01')

women_total = read_csv("https://raw.githubusercontent.com/glosophy/women-data/master/WomenTotal.csv")


# * Reading excel data ----------------------------------------------------
pacman::p_load(readxl)

who_data = readxl::read_xlsx(path = 'data/IndicatorData-20220829134352569.xlsx')



# * JSON Data -------------------------------------------------------------
pacman::p_load(jsonlite)

politics = fromJSON("https://www.govtrack.us/api/v2/role?current=true&role_type=representative&limit=438")

reps = politics[[2]]
repsb = politics[['objects']]
