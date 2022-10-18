
pacman::p_load(tidyverse, # for reading the CSV as a tibble (readr::read_csv)
               DataExplorer) # exploring the dataset

portmap = read_csv('data/portmap_sampled.csv') # reading the data

# from the output 7 variables (6 numeric and 1 is chr)

?create_report # showing the help for this function

create_report(data = portmap, 
              output_file = '16_sectionB.html')
