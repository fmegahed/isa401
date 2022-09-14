
pacman::p_load(tidyverse, rvest)

# * Question 3 ------------------------------------------------------------
complete_url = 'https://www.ziprecruiter.com/jobs-search?search=Junior%20Analyst'


q3_tibble



# * Question 4 ------------------------------------------------------------

base_url = 'https://www.ziprecruiter.com/jobs-search?search=Junior+Analyst&page='

q4_tibble = data.frame()
for (counter in 1:5) {
  
  # change #1 is the URL
  complete_url = paste0(base_url, counter)
  
  step1_zip = read_html(complete_url)
  
  step2_title = html_elements(
    step1_zip, "#job_postings_skip > article > div.job_content > div > div:nth-child(2) > a")
  step3_title = html_text2(step2_title)
  
  step2_company_name = html_elements(
    step1_zip, 
    "#job_postings_skip > article > div.job_content > div > div:nth-child(2) > div > span.company_name"
  )
  step3_company_name = html_text2(step2_company_name)
  
  step2_location = html_elements(
    step1_zip,
    "#job_postings_skip > article > div.job_content > div > div:nth-child(2) > div > span.company_location"
  )
  step3_location = html_text2(step2_location)
  
  
  step2_job_desc = html_elements(
    step1_zip,
    "p.job_snippet"
  )
  step3_job_desc = html_text2(step2_job_desc)
  
  temp_df = tibble(job_title = step3_title,
                     company_name = step3_company_name,
                     location = step3_location,
                     snippet = step3_job_desc)
  
  q4_tibble = rbind(q4_tibble, temp_df)
}
