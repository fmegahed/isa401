# Class 24: Overview of Data Mining 

# * ESP Experiment --------------------------------------------------------


# The probability of getting one card correct
0.5 # given that it is either red or blue 

# the probability of getting 10 correct 
0.5^10 # probability of getting first correct and second and.. and tenth card correct

0.5^10 * 1000



# * Association Rule Mining in R ------------------------------------------

if(require(pacman)==FALSE) install.packages('pacman')
pacman::p_load(arules, tidyverse)

data('Groceries') # note its class

summary(Groceries)
0.0170818505 * 9835

itemFrequency(Groceries) # returns frequency in random order
itemFrequency(Groceries) %>% sort(decreasing = T) # dec order of frequency

itemFrequencyPlot(Groceries, support = 0.1) 
itemFrequencyPlot(Groceries, topN = 20)
# mine association rules with a certain min support and confidence
grocery_rules = apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 0.5, minlen = 2, maxlen = 5)  )
summary(grocery_rules)
inspect(grocery_rules)
sort(grocery_rules, by ='lift', decreasing = T)[1:3] %>% inspect()
