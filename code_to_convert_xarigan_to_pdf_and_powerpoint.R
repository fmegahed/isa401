if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)

renderthis::to_pdf(from = 'lectures/02_Introduction_to_R/02_introduction_to_r.html',
                   to = 'pdfs/02_introduction_to_r.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 3)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
# renderthis::to_pptx(from = 'lectures/01_Introduction/01_Introduction.html',
#                     to = 'ppts/01_introduction.pptx',
#                     complex_slides = TRUE,
#                     partial_slides = TRUE,
#                     delay = 2)
