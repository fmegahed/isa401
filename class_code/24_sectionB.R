if(require(pacman)==FALSE) install.packages('pacman')

pacman::p_load(arules, tidyverse)


sample_gro = read.transactions('Data/sample_groceries.csv')


# * Pre-loaded data -------------------------------------------------------
data('Groceries')

summary(Groceries)

itemFrequency(Groceries) 

item_count_vec = itemFrequency(Groceries) %>% sort(decreasing = T)

item_count_vec[c('chocolate', 'specialty bar')]


itemFrequencyPlot(Groceries, support = 0.1) 

itemFrequencyPlot(Groceries, topN = 20)


# mine association rules with a certain min support and confidence
grocery_rules = apriori(
  Groceries, parameter = list(
    support = 0.01, confidence = 0.5, minlen = 2, maxlen = 5)  )


summary(grocery_rules)

inspect(grocery_rules)

sort(grocery_rules, by ='lift', decreasing = T)[1:3] %>% inspect()
