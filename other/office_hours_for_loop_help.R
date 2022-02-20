pacman::p_load(rvest)

# * What is a for loop? ---------------------------------------------------

# The main idea behind a for loop is to repeat 1-several lines of code multiple times
# By incrementing a counter


# * * Example 1: Using for loop to print ----------------------------------

for (i in 1:10) {
  print(i)
}


# * Example 2: For doing math ---------------------------------------------


cumulative_sum = 0 

for (i in 1:10) {
  cumulative_sum = cumulative_sum + i
}

1+2+3+4+5+6+7+8+9+10



# * Example 3: In class we used the for loop to change URLs ---------------

## Goal 1: capitalize on the incrementing structure in a for loop to change the URL
## Goal 2: Make sure that you are appending the table results to your previous results

base_url = 'http://www.planecrashinfo.com/'
url_2019 = paste0(base_url, '2019', '/', 2019, '.htm')

# logic for a single year
step1 = read_html(url_2019)
step2 = html_elements(x= step1, css = 'table')
step3 = html_table(step2, header = 1)
step4 = step3[[1]]

# expanding to multiple years
years = 2017:2021

crash_results = tibble::tibble() # initializing a tibble for saving the results

for (i in 1:length(years)) {
  print('-----')
  print(i)
  url_year = paste0(base_url, years[i], '/', years[i], '.htm')
  print(url_year)
  
  # same as above with the exception of changing url_2019 to url_year
  step1 = read_html(url_year)
  step2 = html_elements(x= step1, css = 'table')
  step3 = html_table(step2, header = 1)
  step4 = step3[[1]]
  print(step4)
  
  # the appending to crash_results piece
  # the 2017 year is on top, followed by 20118, ..., all the way to 2021
  crash_results = rbind(crash_results, step4)
  
  print('-----')
  
  # We did not do this in class, but I will pause since I am printing the results
  # and I want you to read the output
  Sys.sleep(10) # sleep 10 seconds to allow you to view the output
}


# * For loop to change the URL for department names -----------------------

dept_names = c('isa', 'finance', 'economics')

isa_dept = 'https://www.miamioh.edu/fsb/academics/isa/about/faculty-staff/index.html'
fin_dept = 'https://www.miamioh.edu/fsb/academics/finance/about/faculty-staff/index.html'

# By observing how the two previous links have changed
# I can create any URL by pasting the begining, dept name and end
base_url_begining = 'https://www.miamioh.edu/fsb/academics/'
base_url_ending = '/about/faculty-staff/index.html'

faculty_results = tibble::tibble()

for (i in 1:length(dept_names)) {
  dept_url = paste0(base_url_begining, dept_names[i], base_url_ending)
  print(dept_url)
  print('-----')
  
  # one approach is to save the scraping results for each of the following
  # into their own vectors
  # dept_name
  # faculty_name
  # faculty_position
  # faculty_webpage
  
  # create a temp tibble with the four character vectors
  
  # rbind the faculty_results with your temp tibble
}

?janitor::row_to_names()

temp = data.frame(x = 1:5, y = 6:10)
colnames(temp) = c('Fadel', 'Hours')
temp
