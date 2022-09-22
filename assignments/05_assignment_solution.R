


# * Packages  -------------------------------------------------------------

pacman::p_load(tidyverse, rvest)



# * Question 1: Approach 1 ------------------------------------------------

fsb_urls = c('https://www.miamioh.edu/fsb/academics/accountancy/about/faculty-staff/index.html',
             "https://www.miamioh.edu/fsb/academics/economics/about/faculty-staff/index.html",
             "https://www.miamioh.edu/fsb/academics/entrepreneurship/about/faculty-staff/index.html",
             "https://www.miamioh.edu/fsb/academics/finance/about/faculty-staff/index.html",
             "https://www.miamioh.edu/fsb/academics/isa/about/faculty-staff/index.html",
             "https://www.miamioh.edu/fsb/academics/marketing/about/faculty-staff/index.html",
             "https://www.miamioh.edu/fsb/academics/management/about/faculty-staff/index.html")

fsb_faculty = tibble()
for (counter in 1:length(fsb_urls)) {
  step0 = fsb_urls[counter]  
  step1 = read_html(step0)
  
  step2_table = html_elements(step1, css = 'body > div > main > section > div.bodyCopy.translationCopyEnglish > table')
  step3_table = html_table(step2_table)[[1]]
  
  step2_urls = html_elements(
    step1, 
    "tr > td > strong > a")
  step3_urls = html_attr(step2_urls, name = 'href')
  
  step3_table$URL = step3_urls
  
  fsb_faculty = rbind(fsb_faculty, step3_table)
}



# * Question 1: Approach 2 ------------------------------------------------


fsb_faculty2 = tibble()
for (counter in 1:length(fsb_urls)) {
  step0 = fsb_urls[counter]  
  step1 = read_html(step0)
  
  step2_dept = html_elements(step1, 'tr > td:nth-child(1)')
  step3_dept = html_text2(step2_dept)
  
  step2_pic = html_elements(step1, 'tr > td:nth-child(2)')
  step3_pic = html_text2(step2_pic)
  
  step2_fac_name = html_elements(step1, 'tr > td:nth-child(3) > strong')
  step3_fac_name = html_text2(step2_fac_name)
  
  step2_positions = html_elements(step1, 'tr > td:nth-child(3) > i')
  step3_positions = html_text2(step2_positions)
  
  step2_urls = html_elements(
    step1, 
    "tr > td > strong > a")
  step3_urls = html_attr(step2_urls, name = 'href')
  
  temp_df = tibble(dept = step3_dept, pic = step3_pic, faculty_name = step3_fac_name,
                   faculty_position = step3_positions, faculty_webpage = step3_urls)
  
  fsb_faculty2 = rbind(fsb_faculty2, temp_df)
}



# * Question 2 ------------------------------------------------------------

pacman::p_load(robotstxt)

zip_robots = paths_allowed("https://www.ziprecruiter.com/jobs-search?search=Junior%20Analyst")
