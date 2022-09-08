pacman::p_load(gradeR, testthat, tidyverse, rvest)


# * Question 1 ------------------------------------------------------------

test_that('Yelp Reviews',
          {
            expect_false(yelp_robots)
          })


# * Question 2 ------------------------------------------------------------

test_that('q2',
          {
            expect_equal(dim(lost_found)[2], 5)
          })


# * Question 3 ------------------------------------------------------------

test_that('q3',
          {
            expect_equal(dim(isa_fac)[1], 32)
            expect_equal(dim(isa_fac)[2], 3)
          })



# * Question 4 ------------------------------------------------------------

test_that('q4',
          {
            expect_equal(dim(netflix)[1], 50)
            expect_equal(dim(netflix)[2], 3)
          })
