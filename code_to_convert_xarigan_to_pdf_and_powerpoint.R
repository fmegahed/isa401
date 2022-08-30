if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/04_scraping_webpages/04_scraping_webpages.html',
                   to = 'pdfs/04_scraping_webpages.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/04_scraping_webpages/04_scraping_webpages.html',
                    to = 'ppts/04_scraping_webpages.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
