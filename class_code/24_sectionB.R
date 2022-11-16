


# * ESP Probability -------------------------------------------------------

## Probability of Guessing one card correctly
0.5

## Probability of Guessing two cards correctly
0.5 * 0.5 = 0.5^2

## Probability of guessing ten cards correctly
0.5^10 
num_of_out_of_1000 = 0.5^10 * 1000

.5/(5/8)



# * A-Priori Algorithm ----------------------------------------------------

pacman::p_load(arules, tidyverse)

data('Groceries') # note its class

summary(Groceries)

itemFrequency(Groceries) # returns frequency in random order

itemFrequency(Groceries) %>% sort(decreasing = T) # desc order by Freq

itemFrequencyPlot(Groceries, support = 0.1) 
itemFrequencyPlot(Groceries, topN = 20)

# mine association rules with a certain min support and confidence
grocery_rules = apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 0.5, minlen = 2, maxlen = 5)  )

summary(grocery_rules)

inspect(grocery_rules)

sort(grocery_rules, by ='lift', decreasing = T)[1:3] %>% inspect()
