if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/09_technically_correct_and_consistent_data/09_technically_correct_and_consistent_data.html',
                   to = 'pdfs/09_technically_correct_and_consistent_data.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/09_technically_correct_and_consistent_data/09_technically_correct_and_consistent_data.html',
                    to = 'ppts/09_technically_correct_and_consistent_data.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
