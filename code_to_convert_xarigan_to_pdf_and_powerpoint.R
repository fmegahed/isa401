if(require(renderthis)==FALSE) remotes::install_github("jhelvy/renderthis", dependencies = TRUE)
if(require(officer) == FALSE) install.packages('officer')

renderthis::to_pdf(from = 'lectures/03_data_import_export/03_data_import_export.html',
                   to = 'pdfs/03_data_import_export.pdf',
                   complex_slides = TRUE,
                   partial_slides = TRUE,
                   delay = 2)

# I am using my adobe to create the ppt since the text is editable (which is more preferable to students)
renderthis::to_pptx(from = 'lectures/03_data_import_export/03_data_import_export.html',
                    to = 'ppts/03_data_import_export.pptx',
                    complex_slides = TRUE,
                    partial_slides = TRUE,
                    delay = 2)
