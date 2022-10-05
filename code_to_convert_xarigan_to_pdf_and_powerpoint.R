if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/13_fundamentals_data_viz/13_fundamentals_data_viz.html',
                   to = 'pdfs/13_fundamentals_data_viz.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/13_fundamentals_data_viz/13_fundamentals_data_viz.html',
                    to = 'ppts/13_fundamentals_data_viz.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
