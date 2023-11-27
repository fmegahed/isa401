
prob_of_1_card_correct = 0.5

prob_2_cons_cards_correct = 0.5 * 0.5

prob_10_correct = 0.5^10



# * Association Rule Mining -----------------------------------------------
if(require(pacman)==FALSE) install.packages('pacman')
pacman::p_load(arules, tidyverse) # install and load the need libraries

data('Groceries') # the Groceries dataset is from the arules package

summary(Groceries)

arules::itemFrequency(Groceries) # returns frequency in alphabetic order
arules::itemFrequency(Groceries) |>  sort(decreasing = T)

arules::itemFrequencyPlot(Groceries, support = 0.1) 
arules::itemFrequencyPlot(Groceries, topN = 20)

# mine association rules with a certain min support and confidence
grocery_rules = arules::apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 0.5, minlen = 2, maxlen = 5)  
  )

summary(grocery_rules)
inspect(grocery_rules)

sort(grocery_rules, by ='lift', decreasing = T)[1:15] %>% arules::inspect()
