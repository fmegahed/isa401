# grading assignment 04
library(robotstxt)
library(tidyverse)
library(rvest)
library(gradeR)


# * Checking for Bad Files ------------------------------------------------

submissionDir = "student_submissions/assignment05/"

bad_encodings = findBadEncodingFiles(submissionDir)

global_paths = findGlobalPaths(submissionDir)



# * Grading all files -----------------------------------------------------

grades = calcGrades(
  submission_dir = submissionDir, 
  your_test_file = "grading_resources/05_scraping_assignment_grading_file.R")

colnames(grades)[2:3] = paste0('q', 1:2)


grades = grades %>% 
  mutate(final_grade = pmax(7.5, 5 + 2.5*(q1+q2)) )

write_csv(grades, 'grading_resources/grades/assignment05.csv')
