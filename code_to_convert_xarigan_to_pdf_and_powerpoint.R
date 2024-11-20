if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/24_clustering_intro/24_clustering_intro.html',
                   to = 'pdfs/24_clustering_intro.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 1)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/24_clustering_intro/24_clustering_intro.html',
                    to = 'ppts/24_clustering_intro.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 1)
