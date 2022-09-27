


# * Assignment 09 ---------------------------------------------------------

pacman::p_load(tidyverse)

#Q1
ohur1 = read.csv('https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=OHUR&scale=left&cosd=1976-01-01&coed=2022-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-09-20&revision_date=2022-09-20&nd=1976-01-01')

glimpse(ohur1) # prints nrow, ncol; shows you variable names; it shows you their type; and first few obs
# from the output, DATE is chr instead of a date variable so it is not technically correct


# Q2
# read_csv comes from readr/tidyverse;
# it produces a tibble and it tries (not always working) to guess the column types based on the values in the data
ohur2 = read_csv('https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=OHUR&scale=left&cosd=1976-01-01&coed=2022-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-09-20&revision_date=2022-09-20&nd=1976-01-01')

# from the print out of the function, the variables are technically correct
glimpse(ohur2)
class(ohur2$OHUR)


#Q3
v_fact <- factor(c("20", "8", "16", "12", "24"))
v_num = as.numeric(v_fact)

v_num2 = as.numeric(as.character(v_fact))


# Q4
covid1 = read_csv(
  'https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.137610160.1205584504.1663594442-1591540796.1663594442'
) # output from the read_csv (readr, part of tidyverse) is a tibble
covid1

covid1_l =
  pivot_longer(
    data = covid1,
    cols = 5:971,
    names_to = 'date'
  )
covid1_l



covid2 = read.csv(
  'https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.137610160.1205584504.1663594442-1591540796.1663594442'
) # output from the read_csv (readr, part of tidyverse) is a tibble
covid2

covid2_l =
  pivot_longer(
    data = covid1, # the issue
    cols = 5:971,
    names_to = 'date'
  )
covid2_l



# * Finishing our Logic from Last Class -----------------------------------

bike1 = read.csv('data/bike_sharing_data.csv') # base R
bike2 = read_csv('data/bike_sharing_data.csv') # readr pkg loaded with tidyverse

# understanding what is in the problems() output
problems() # based on the output from the previous line of code
bike1[14178-1, ] # where the issue is (notice that I showed it first in bike1)
bike2[14178-1, ] # read_csv converted the issue to NA to have a numeric col
# R could only transform x61 to NA since it is not a number
# "50", "61" would be converted to 50 and 61


# bike1 data since this is the dataset that has the x61 in row 14177

# approach 1: identify 'things' (characters) that are non-numeric
glimpse(bike1)
index = str_detect(
  string = bike1$humidity, # vector we are looking for non-numeric data in
  pattern = "[:alpha:]" # look for a-z or A-Z type characters in bike humidity
  )
table(index) # TRUE means that this cell had non-numeric data

bike1$humidity[index] # printing the value(s) where we had non-number type inputs
bike1$humidity[index] = 61

class(bike1$humidity) # it is still a chr vector
bike1$humidity <- as.integer(bike1$humidity) # set bike1$humidity col to int and overwrite your previous col
class(bike1$humidity)

# approach 2: force this into numeric
bike1 = read.csv('data/bike_sharing_data.csv') # bec we overwrote the issue with humidity
bike1$humidity = as.integer(bike1$humidity) # warning you get, R introduced NAs to make this happen
bike1$humidity[14177]
bike1$humidity[14176]

# why I did not assign 61 in quotes for approach 1?
general_vec = c('Fadel', 401, 501L) # atomic vec have a singular data type (most general)
general_vec1 = as.numeric(general_vec) # converting it to numeric and saving it elsewhere
general_vec2 = general_vec # making it equal to our first vec
general_vec2[1] = 20 # assign first vaue to 20 instead of Fadel
# you will still need to convert it to numeric or intg

# approach 3: logic
bike1 = read.csv('data/bike_sharing_data.csv') # base R
glimpse(bike1)
table(bike1$humidity) # odd rows (value), even rows (count/freq)



# * Automating the Check for Tech Correct & Consistency (pointblank) --------

bike_tbl = read_csv('data/bike_sharing_data.csv')

pacman::p_load(pointblank)

# Steps
# (1) Action Levels (when to report if there is a problem)
# (2) Create an agent (empty table for our report)
# (3) Add validation functions to the agent (add checks to the empty table)
# (4) Evaluate through the interrogate function

# Step1 
act = action_levels(warn_at = 0.01, notify_at = 0.01)

# Step2
agent = create_agent(tbl = bike_tbl, actions = act)
agent

# Step3
agent %>% #(Ctrl + Shift + M) |> take the output on the left and make it as the first input to the next function
  # technically correct checks (you should do that for your entire dataset)
  col_is_date(columns = 'datetime') %>% 
  col_is_factor(columns = vars(season, holiday, workingday, weather)) %>% 
  # variables can either be a chr vector or passed using the vars function
  col_is_numeric(columns = c('count', 'registered', 'casual')) %>% 
  # consistency of the data
  ##
  # are the cells in these variables >= 0
  col_vals_gte(columns = vars(count, casual, registered), value = 0) %>% 
  # is the sum of casusal and registered equal to count for every obs
  col_vals_expr(expr = expr(count == registered + casual)) %>% 
  col_vals_expr(expr = ~ str_detect(sources, 'google'), label = 'non google') ->
  agent # overwrite agent based on the rules above

agent

# (4) Eval
results = interrogate(agent)
results

results %>% export_report(filename = 'data/bike_validation_secB.html')
