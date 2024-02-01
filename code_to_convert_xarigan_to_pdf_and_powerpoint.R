if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/02_introduction_to_r/02_introduction_to_r.html',
                   to = 'pdfs/02_introduction_to_r.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 1)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/02_introduction_to_r/02_introduction_to_r.html',
                    to = 'ppts/02_introduction_to_r.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 1)
