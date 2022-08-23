
# Class 01: Getting the Cincy Crash Data



# Required Packages -------------------------------------------------------

install.packages('tidyverse')
library(tidyverse)


# Reading the Data --------------------------------------------------------

cincy_crashes = read_csv('https://data.cincinnati-oh.gov/api/views/rvmt-pkmq/rows.csv?accessType=DOWNLOAD')
cincy_crashes


# What we have learned from exploring the data using the viewer
# View(cincy_crashes)
# The unit of analysis is not a single crash
# because: (a) 3-4 rows of the data came from the same crash event (location, datetime, etc)
# they corresponded to two different vehicles
# we learned that we have a variable 'TYPEOFPERSON' - D, Occupant, 

# To answer Question B
length( unique(cincy_crashes$INSTANCEID) )
