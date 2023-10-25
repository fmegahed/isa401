if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/18_commonly_used_charts/18_commonly_used_charts.html',
                   to = 'pdfs/18_commonly_used_charts.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/18_commonly_used_charts/18_commonly_used_charts.html',
                    to = 'ppts/18_commonly_used_charts.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
