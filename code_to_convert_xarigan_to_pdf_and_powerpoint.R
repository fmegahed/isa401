if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/02_llms_r_python/02_llms_r_python.html',
                   to = 'pdfs/02_llms_r_python.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/02_llms_r_python/02_llms_r_python.html',
                    to = 'ppts/02_llms_r_python.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
