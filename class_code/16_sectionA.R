
pacman::p_load(tidyverse,
               DataExplorer) # we need for creating a data viz report

# reading the data for today's example (we are focusing on exploring data for pred modeling)
portmap = read_csv('data/portmap_sampled.csv')

# create a data viz report
?create_report

create_report(data = portmap, output_file = 'data_report_A.html')
