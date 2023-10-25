# My goal is to show you how to quickly explore a tabular dataset in R
# with 1-2 lines of code

portmap = readr::read_csv('portmap_sampled.csv')

# in most of your modeling classes, I believe you convert chr to factors
portmap$label = as.factor(portmap$label)

# confirming that worked
dplyr::glimpse(portmap)

# exploring our label column, which would be your response variable for this
# cross sectional dataset
unique(portmap$label) # this would return a chr vector of my different labels
table(portmap$label) # count each level

DataExplorer::create_report(data = portmap, output_file = 'reportB.html', y = 'label')

# Next Step
summary(portmap) # report 5-6 stats for all numeric cols
table(portmap$total_backward_packets)



