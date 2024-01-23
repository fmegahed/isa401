if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/01_Introduction/01_Introduction.html',
                   to = 'pdfs/01_introduction.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 1)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/01_Introduction/01_Introduction.html',
                    to = 'ppts/01_introduction.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 1)
