if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/06_scraping_multiple_webpages/06_scraping_multiple_webpages.html',
                   to = 'pdfs/06_scraping_multiple_webpages.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 1)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/06_scraping_multiple_webpages/06_scraping_multiple_webpages.html',
                    to = 'ppts/06_scraping_multiple_webpages.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 1)
