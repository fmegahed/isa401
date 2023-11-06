if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/21_high_dimensional_charts/21_high_dimensional_charts.html',
                   to = 'pdfs/21_high_dimensional_charts.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 1)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/21_high_dimensional_charts/21_high_dimensional_charts.html',
                    to = 'ppts/21_high_dimensional_charts.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 1)
