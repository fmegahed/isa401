

# * Loading the required packages -----------------------------------------

if(require(pacman)==FALSE) install.packages('pacman')

pacman::p_load(arules, tidyverse)


# * Loading the data ------------------------------------------------------
data('Groceries') # note its class


# highlight how we obtain a sparse matrix from a regular csv
sample_groceries = read_csv('Data/sample_groceries.csv')
sample_groceries_transactions = read.transactions('Data/sample_groceries.csv')


# * The outputs from each step --------------------------------------------
summary(Groceries)


item_freq_vec = itemFrequency(Groceries) 
item_freq_vec[c('popcorn', 'shopping bags')]

itemFrequency(Groceries) %>% 
  sort(decreasing = T) # will sort in a descending order (sort comes from base R)

itemFrequencyPlot(Groceries, support = 0.1) 

itemFrequencyPlot(Groceries, topN = 20)
# mine association rules with a certain min support and confidence


grocery_rules = apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 0.5, minlen = 2, maxlen = 5)  )


summary(grocery_rules)

inspect(grocery_rules)

sort(grocery_rules, by ='lift', decreasing = T)[1:3] %>% inspect()
