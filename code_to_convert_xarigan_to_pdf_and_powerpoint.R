if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/19_temporal_spatial_and_spatiotemporal_charts/19_temporal_spatial_and_spatiotemporal_charts.html',
                   to = 'pdfs/19_temporal_spatial_and_spatiotemporal_charts.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/19_temporal_spatial_and_spatiotemporal_charts/19_temporal_spatial_and_spatiotemporal_charts.html',
                    to = 'ppts/19_temporal_spatial_and_spatiotemporal_charts.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
