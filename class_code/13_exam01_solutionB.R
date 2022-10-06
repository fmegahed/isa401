
# Skeleton solution guide for exam 01


# * Question 1 ------------------------------------------------------------

# Learning obj: assess data encoding based on the discussion from class 01 Slides 27-30 

# This concept was evaluated earlier in:
# Non-graded class activity in Slide 31 of Class Notes 1
# https://fmegahed.github.io/isa401/fall2022/class01/01_Introduction.html?panelset2=activity3&panelset3=activity4&panelset4=activity5&panelset5=activity6#31
# Assignment 01 Q3





# * Question 2 ------------------------------------------------------------

# Learning obj: assess data encoding based on the discussion from class 01 Slides 27-30 and Assignment 01 Q3

# This concept was evaluated earlier in:
# Non-graded class activity in Slide 31 of Class Notes 1
# https://fmegahed.github.io/isa401/fall2022/class01/01_Introduction.html?panelset2=activity3&panelset3=activity4&panelset4=activity5&panelset5=activity6#31
# Assignment 01 Q3 (see below from my model solution to that question)
# "While color is used in the map, color is used to encode the coronavirus cases. 
# "On the other hand, the counties are encoded using the x and y position of their polygons 
# (i.e, their shape)."




# * Question 3 ------------------------------------------------------------

# Learning obj: understanding and evaluating data structures + subsetting in R

# This concept was evaluated earlier in:
# Question 4 of Assignment 02 
# (which I reasked again given that 47% of you had answered this incorrectly in the assignment)
# despite being discussed in detail in slide 35 of https://fmegahed.github.io/isa401/fall2022/class02/02_introduction_to_r.html#35

lst <- list( # list constructor/creator
  1:3, # atomic double/numeric vector  of length = 3
  "a", # atomic character vector of length = 1 (aka scalar)
  c(TRUE, FALSE, TRUE), # atomic logical vector of length = 3
  c(2.3, 5.9) # atomic double/numeric vector of length =3
)
lst # printing the list

# Solution:
q3 = lst[2]

# * Question 4 ------------------------------------------------------------

# learning objectives:
# [1] Read text-files, binary files (e.g., Excel, SAS, SPSS, Stata, etc), json files, etc.
# [2] Being able to determine basic information about the read data

# This concept was discussed in detail in the class 03 demo: https://fmegahed.github.io/isa401/fall2022/class03/03_data_import_export.html?panelset=activity&panelset1=activity2#21

# This concept was evaluated in:
## Non-graded activity: https://fmegahed.github.io/isa401/fall2022/class03/03_data_import_export.html?panelset=activity&panelset1=activity2#21
## Assignment 03 in its entirty 
## Several other examples throughtout the semester

# Solution:
pacman::p_load(jsonlite)
recipes = fromJSON(txt = 'data/food_recipes.json')



# * Question 5 ------------------------------------------------------------

# learning objectives:
# subset a dataset and/or extract information from a dataset

# An example of prior evaluation:
# Assignment 03, question 4

# Note: Every student receieved full credit due to two conflicting correct answers
# It is reasonable to have interpreted the question to be the 38th recipe (row; my intent)
# or by id (based on the id column) and hence, you receieved full credit

recipes[38,]


# * Question 6 ------------------------------------------------------------

# learning objectives:
# [1] Read text-files, binary files (e.g., Excel, SAS, SPSS, Stata, etc), json files, etc.
# [2] subset data in class 03

# prior evaluations based on solution approaches:
# Assignment 03, question 5

# relationship to other concepts discussed in class
# [3] transform data by aggregating it;
# [4] counting via skim, table (https://fmegahed.github.io/isa401/fall2022/class09/09_technically_correct_and_consistent_data.html#19)

# Comment: When walking around several of you, attempted to "GOOGLE" an answer and
# ended up using the rjson package, which produces a list and it is/was much harder to manipulate
# the output when compared to our jsonlite package from class


# Solution


## Approach 1: Assignment 03 Q5
greek_index = recipes$cuisine == 'greek'
sum(greek_index)


## Approach 2: table (easiest approach)
table(recipes$cuisine)

## Approach 3: filter (probably what I would use if it was not for table)
pacman::p_load(tidyverse)
greek_recipes = filter(recipes, cuisine == 'greek')

## Approach 4: Writing R code similar to How you Would Write it in Python



# * Question 7 ------------------------------------------------------------

# learning objectives:
# [1] scrape data from a webpage
# [2] extract the URL

# This concept was evaluated in detail in:
# Question 1 of Assignment 05 (with code and video solution in https://miamioh.instructure.com/courses/179812/discussion_topics/1491315)


# Solution (start of it as shared in exam file):

if(require(pacman)==F) install.packages('pacman')
pacman::p_load(tidyverse, rvest) # feel free to add any other pkgs if needed

step0_mu = 'https://miamioh.edu/policy-library/students/undergraduate/academic-regulations/index.html'
step1_mu = read_html(step0_mu)
step2_mu = html_elements(step1_mu,
                         css = 'body > div > main > section > div > div > div > div > div > div > a')
step2_mu

mu_policies = html_attr(step2_mu, name = 'href')

# * Question 8 ------------------------------------------------------------

# learning objectives:
# [1] scrape data from a webpage
# [2] how to handle situations where the copy selector produces no values 
# (make your selector more general)


# This was also evaluated in detail in:
# Q1 of Assignment 05
# refer to minutes 8-14 in the video at 
# https://www.loom.com/share/6e7cc04686a544b4bc872feb499c5a72) [which was viewed only 16 times]


# Solution (start of it as shared in exam file):
step0_fb = 'https://miamiredhawks.com/sports/football/roster?path=football'

step1_fb = read_html(step0_fb) # reading all the data from the url in step 0

# edit this so you are extracting the weights of the players 
# (e.g., 290 LBS for AUSTIN ERTL, 180 for JAYLON BESTER, etc)
# this should return a list of over 200+ entries
step2_fb = html_elements(step1_fb, css = 'span.sidearm-roster-player-weight')


step3_fb = html_text2(step2_fb) # removes html tags from step3

# removes the space and lbs, converts to numeric and then computes the median
step4_fb = median( as.numeric( str_remove(step3_fb, pattern = ' lbs') ) )

step4_fb



# * Question 9 ------------------------------------------------------------

# learning objectives: interact and extract data from APIs

# This exact API was evaluated in:
# Assignment 07, Q2; I have only changed the **city** here

# Solution:
44


# * Questions 10-12 --------------------------------------------------------

# learning objectives:
# [1] assessing your ability to craft correct requests for a new API
# [2] assessing your ability to evaluate the returned file type from an API or extract that info from the docs

# This concept was discussed in slide 15 of Class 06 Notes and demo'd via Accuweather and Cryptocompare APIs

# This concept was evaluated in:
# Assignment 07 Q2 

# Solution:




# * Question 13 -----------------------------------------------------------

# learning objectives: assess the tidyiness and constitency of a dataset

# Concept discussed in detail in classes 08 and 10

# This concept was evaluated in:
# Assignment 08 Q3 and and demo in slide 23 in https://fmegahed.github.io/isa401/fall2022/class09/09_technically_correct_and_consistent_data.html#23

# Solution (start):
if(require(pacman)==F) install.packages('pacman')

pacman::p_load(tidyverse)

wb_tbl = read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/wb_hospital_beds.csv')



# * Questions 14-16 -------------------------------------------------------

# learning objectives: assessing whether a dataset is tidy, technically correct, and/or consistent

# Prior evaluation in:
# Assignments 08-10

# Solution

# Q14 (start of solution)


# Q15 (start of solution)
if(require(pacman)==F) install.packages('pacman')
pacman::p_load(tidyverse, pointblank, skimr, DataExplorer) # feel free to add any other pkgs if needed

# reading the data from my github repo to avoid an issues with file location
ntse_tbl = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/ntse_endowment_us_and_canada_2020.csv')

# a glimpse of the data
# for the purpose of this analysis, do NOT convert chr to factors (do not worry about this)
dplyr::glimpse(ntse_tbl)


# Q16 (start of solution)
# * Reading the data and answering the question ---------------------------

if(require(pacman)==F) install.packages('pacman')
pacman::p_load(tidyverse, pointblank, skimr, DataExplorer) # feel free to add any other pkgs if needed

# reading the data from my github repo to avoid an issues with file location
ntse_tbl_2 = readr::read_csv('https://raw.githubusercontent.com/fmegahed/isa401/main/data/ntse_endowment_us_and_canada_2020.csv')

# [1]
act = action_levels(warn_at = 0.001, notify_at = 0.001)



# * Question 17 -----------------------------------------------------------

# Learning objectives: Explaining the differences between correction and imputation
# identifying a potential approach for tackling a problem

# Note that is also a similar example from your practice exam




# * Question 18 -----------------------------------------------------------


# Learning objective: evaluating your understanding of the KNN approach for imputing data

# Note that this was explained in writing in class and added to the 11_class_code R files

# Note that is an example from your practice exam




# * Question 19 -----------------------------------------------------------

# Learning objectives: assessing whether you can synethsize your learning from ISA 245 and 401 
