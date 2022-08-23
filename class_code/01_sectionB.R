
# Class 01: Reading the Cincy Crash Dataset


# Required Libraries ------------------------------------------------------

install.packages('tidyverse') # install the package - do this once
library(tidyverse) # loads the libary tidyverse so I can use its functions


# Reading the Data --------------------------------------------------------

crashes = read_csv('https://data.cincinnati-oh.gov/api/views/rvmt-pkmq/rows.csv?accessType=DOWNLOAD')


# Answering the Questions -------------------------------------------------

## Answer the Question Visually
# Look at the global environment: 28 variables and 310,090 obs (will change if you run code later)

# Question A: By Code
nrow(crashes) # number of rows
ncol(crashes) # number of cols

# Question B
View(crashes)
# From the exploration, we saw that we have a unique instanceid for each crash
# Number of observations correspond to instanceid and the number of individuals impacted for each id

# to answer the number of crashes, we will find the number of unique instanceids
# approach 1
unique_ids = unique(crashes$INSTANCEID)
length(unique_ids)

# approach 2
length( unique(crashes$INSTANCEID) )
