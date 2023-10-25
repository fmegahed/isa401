# Our goals for using R today are:
# - Create a quick and one-line visualizations of our dataset

portmap = readr::read_csv('portmap_sampled.csv')

# what are the unique labels in our dataset
unique(portmap$label) # this will return a chr vector of the different labels
table(portmap$label) # will return a count of the labels

# I will convert the chr variable to a factor
portmap$label = as.factor(portmap$label)

# checking that this worked
dplyr::glimpse(portmap)

DataExplorer::create_report(data = portmap, output_file = 'reportA.html', y = "label")

# reinforcing our understanding of the histograms
summary(portmap) # 5 summary stats for all numeric variables

table(portmap$total_backward_packets) # return the values and their freq


