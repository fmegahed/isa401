pacman::p_load(gradeR, testthat, tidyverse, rvest, robotstxt, jsonlite, nflfastR)


# * Question 1 ------------------------------------------------------------

test_that('NFL',
          {
            expect_equal(nrow(cin_2021), 3753)
          })


# * Question 2 ------------------------------------------------------------

test_that('Weather',
          {
            expect_true(nrow(oxford_forecast), 14)
            expect_true(ncol(oxford_forecast), 13)
          })


# * Question 3 ------------------------------------------------------------

test_that('FRED',
          {
            expect_true(nrow(unemployment), 28000)
            expect_true(ncol(unemployment), 3)
          })

