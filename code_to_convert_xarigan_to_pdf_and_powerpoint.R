if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/20_high_dimensional_charts/20_high_dimensional_charts.html',
                   to = 'pdfs/20_high_dimensional_charts.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/20_high_dimensional_charts/20_high_dimensional_charts.html',
                    to = 'ppts/20_high_dimensional_charts.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
