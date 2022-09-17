pacman::p_load(gradeR, testthat, tidyverse, rvest, robotstxt)


# * Question 1 ------------------------------------------------------------

test_that('FSB',
          {
            expect_equal(nrow(fsb_faculty), 194)
          })


# * Question 2 ------------------------------------------------------------

test_that('Robots',
          {
            expect_true(zip_robots)
          })
