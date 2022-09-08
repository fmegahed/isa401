# grading assignment 04
library(robotstxt)
library(tidyverse)
library(rvest)
library(gradeR)


# * Checking for Bad Files ------------------------------------------------

submissionDir = "student_submissions/assignment04/"

bad_encodings = findBadEncodingFiles(submissionDir)

global_paths = findGlobalPaths(submissionDir)



# * Grading all files -----------------------------------------------------

grades = calcGrades(
  submission_dir = submissionDir, 
  your_test_file = "grading_resources/04_scraping_assignment_grading_file.R")

colnames(grades)[2:5] = paste0('q', 1:4)


grades = grades %>% 
  mutate(final_grade = pmax(7, 2.5*(q1+q2+q3+q4)) )
