if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/24_data_mining_overview/24_data_mining_overview.html',
                   to = 'pdfs/24_data_mining_overview.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/24_data_mining_overview/24_data_mining_overview.html',
                    to = 'ppts/24_data_mining_overview.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
