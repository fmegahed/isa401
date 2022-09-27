


# * Assignment 09 ---------------------------------------------------------
pacman::p_load(tidyverse)

ohur1 = read.csv('https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=OHUR&scale=left&cosd=1976-01-01&coed=2022-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-09-20&revision_date=2022-09-20&nd=1976-01-01')

glimpse(ohur1) # prints the column names, types and first few obs (nrows and ncols)
# from this printout, the dataset is not technically correct bec DATE is a chr vector

ohur2 = read_csv('https://fred.stlouisfed.org/graph/fredgraph.csv?bgcolor=%23e1e9f0&chart_type=line&drp=0&fo=open%20sans&graph_bgcolor=%23ffffff&height=450&mode=fred&recession_bars=on&txtcolor=%23444444&ts=12&tts=12&width=1168&nt=0&thu=0&trc=0&show_legend=yes&show_axis_titles=yes&show_tooltip=yes&id=OHUR&scale=left&cosd=1976-01-01&coed=2022-08-01&line_color=%234572a7&link_values=false&line_style=solid&mark_type=none&mw=3&lw=2&ost=-99999&oet=99999&mma=0&fml=a&fq=Monthly&fam=avg&fgst=lin&fgsnd=2020-02-01&line_index=1&transformation=lin&vintage_date=2022-09-20&revision_date=2022-09-20&nd=1976-01-01')

glimpse(ohur2)

## Q3
v_fact <- factor(c("20", "8", "16", "12", "24"))
v_num = as.numeric(v_fact)

v_num2 = as.numeric( as.character(v_fact) )

## Q4
covid1 = read_csv(
  'https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.137610160.1205584504.1663594442-1591540796.1663594442'
) # output from the read_csv (readr, part of tidyverse) is a tibble
covid1

covid1_l =
  pivot_longer(
    data = covid1,
    cols = 5:978,
    names_to = 'date'
  )
covid1_l

glimpse(covid1_l)

covid2 = read.csv(
  'https://static.usafacts.org/public/data/covid-19/covid_deaths_usafacts.csv?_ga=2.137610160.1205584504.1663594442-1591540796.1663594442'
) # output from the read_csv (readr, part of tidyverse) is a tibble
covid2

covid2_l =
  pivot_longer(
    data = covid1,
    cols = 5:978,
    names_to = 'date'
  )
covid2_l
glimpse(covid2_l)



# * Continue with where we stopped in Class 09 ----------------------------

bike1 = read.csv('data/bike_sharing_data.csv') # base R
bike2 = read_csv('data/bike_sharing_data.csv') # readr (tibble, guesses col types and converts to NA if you have a few typos in the col)
problems() # shows where the encoding problem happened (row value should be -1)
bike2[14177, ] # from the printout, the humidity became NA instead of x61

# approach1: go through that column and use a function that would identify non_numeric values
glimpse(bike1) # humidity should be an int but it is a chr

non_numeric_index = str_detect(
  string = bike1$humidity, # search that specific column
  pattern = "[:alpha:]")
table(non_numeric_index) # we have only 1 FALSE
bike1[non_numeric_index, ] # print only the true rows and all columns since I have nothing after comma

# lets "fix this problem"
# suggestion of taking the x out
bike1[14177, 'humidity'] = 61 # overwritting that value and saying set it to 61
bike1[14177, 'humidity']
bike1$humidity = as.numeric(bike1$humidity) # transform to numeric vec after fixing the issue with the cell

cam = c('Cam', 6, 5L); cam

# approach 2: force the conversion to numeric 
# (possible outcomes, error or it will convert the cell[s] having an issue to either a weird number or NA or NaN )
bike1 = read.csv('data/bike_sharing_data.csv')
glimpse(bike1)

bike1$humidity = as.numeric(bike1$humidity) # apply the numeric conv on a chr vector (introduced NA)
bike1$humidity[14177]


# approach 3: counts for the different values of humidity to identify possible issues
bike1 = read.csv('data/bike_sharing_data.csv')
table(bike1$humidity) # given that it is int, we will use table to print (values in odd rows) and freq (even rows)
bike1[bike1$humidity == 'x61', ] # the row which has x61 and all columns 
bike1[bike1$humidity == 'x61', 8] = 61 # set it to 61 

# another approach for bike1$humidity = as.numeric(bike1$humidity)
bike1 = mutate(bike1,
               humidity = as.numeric(humidity))
class(bike1$humidity)



# * Data Validation Reporting (Pointblank) --------------------------------
pacman::p_load(pointblank) # new pkg for data validation reporting

bike_tbl = read_csv('data/bike_sharing_data.csv') # fresh start

# Steps based on package repo: https://rich-iannone.github.io/pointblank/articles/VALID-I.html
# (A) set the action levels
# (B) create the agent for your data
# (C) Create all validation functions
# (D) interrogate to create your HTML report

# (A) action levels
# warn and notify if something >= 1% and do not stop
act = action_levels(warn_at = 0.01, notify_at = 0.01, stop_at = NULL) 
act

# (B) create the agent for your data
agent = create_agent(tbl = bike_tbl, actions = act)
agent

# (C) Create Validation functions and I will use the concept of piping to chain them

agent %>% # (CTRL + Shift + M) and take what is on the left of the pipe and make it the 1st input to next function
  # examples for technically correct checks
  col_is_factor(columns = c('season', 'holiday', 'workingday', 'weather')) %>% 
  col_is_integer(columns = 'humidity') %>% 
  col_is_numeric(columns = vars(casual, registered, count)) %>% # another approach for specifying the variables
  # for consistent data
  col_vals_between(columns = vars(temp, atemp), left = -6, right = 32) %>% 
  col_vals_expr(expr = ~ str_detect(sources, 'google'),
                label = 'non google sources') %>% 
  col_vals_expr(expr(count == casual + registered )) -> # save it to agent
  agent # overwriting the agent object

agent

# (D) Evaluate Using the interrogate function
res = interrogate(agent) # only steps 6, 7 and 8 passed (because of OK)

res 

export_report(x = res, filename = 'data/bike_validation_secA.html')
