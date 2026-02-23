# Pivot Playground - Interactive Pivot Operations
# ISA 401: Business Intelligence & Data Visualization
# Spring 2026

library(shiny)
library(bslib)
library(tidyr)
library(dplyr)
library(readr)
library(DT)

# --- Sample Data ---
sample_job_data <- tibble::tribble(
  ~occupation,           ~avg_salary_2022, ~avg_salary_2023, ~avg_salary_2024, ~openings_2022, ~openings_2023, ~openings_2024,
  "Data Analyst",         62000,            65000,            68000,            4500,           5200,           5800,
  "Data Scientist",       95000,            100000,           108000,           3200,           3800,           4100,
  "BI Developer",         78000,            82000,            87000,            2800,           3100,           3400,
  "Database Admin",       75000,            78000,            82000,            2100,           2000,           1900,
  "ML Engineer",          105000,           112000,           120000,           1800,           2500,           3200,
  "Analytics Manager",    92000,            97000,            103000,           1500,           1700,           1900
)

# --- Helper: Generate pivot code ---
generate_pivot_longer_code <- function(data_name, cols, names_to, values_to, names_prefix) {
  cols_str <- paste0("c(", paste0('"', cols, '"', collapse = ", "), ")")
  code <- paste0(
    data_name, " |>\n",
    "  tidyr::pivot_longer(\n",
    "    cols = ", cols_str, ",\n",
    '    names_to = "', names_to, '",\n',
    '    values_to = "', values_to, '"'
  )
  if (nzchar(names_prefix)) {
    code <- paste0(code, ',\n    names_prefix = "', names_prefix, '"')
  }
  code <- paste0(code, "\n  )")
  code
}

generate_pivot_wider_code <- function(data_name, names_from, values_from) {
  code <- paste0(
    data_name, " |>\n",
    "  tidyr::pivot_wider(\n",
    '    names_from = "', names_from, '",\n',
    '    values_from = "', values_from, '"\n',
    "  )"
  )
  code
}


# --- UI ---
ui <- page_sidebar(
  title = "Pivot Playground",
  theme = bs_theme(
    bootswatch = "flatly",
    primary = "#C3142D",
    base_font = font_google("Open Sans")
  ),

  sidebar = sidebar(
    width = 320,
    title = "Controls",

    # Data source
    accordion(
      accordion_panel(
        title = "Data Source",
        icon = bsicons::bs_icon("database"),
        radioButtons(
          "data_source", "Choose data:",
          choices = c("Sample Job Market Data" = "sample", "Upload CSV" = "upload"),
          selected = "sample"
        ),
        conditionalPanel(
          condition = "input.data_source == 'upload'",
          fileInput("file_upload", "Upload CSV file:",
                    accept = c("text/csv", ".csv")),
          checkboxInput("has_header", "File has header row", TRUE)
        )
      ),
      accordion_panel(
        title = "Pivot Operation",
        icon = bsicons::bs_icon("arrow-left-right"),
        radioButtons(
          "pivot_direction", "Direction:",
          choices = c("Longer (wide -> long)" = "longer",
                      "Wider (long -> wide)" = "wider"),
          selected = "longer"
        ),

        # pivot_longer controls
        conditionalPanel(
          condition = "input.pivot_direction == 'longer'",
          selectInput("cols_to_pivot", "Columns to pivot:",
                      choices = NULL, multiple = TRUE),
          textInput("names_to", "Names to (new key column):", value = "name"),
          textInput("values_to", "Values to (new value column):", value = "value"),
          textInput("names_prefix", "Names prefix to strip:", value = "")
        ),

        # pivot_wider controls
        conditionalPanel(
          condition = "input.pivot_direction == 'wider'",
          selectInput("names_from", "Names from (column to spread):",
                      choices = NULL),
          selectInput("values_from", "Values from (values to fill):",
                      choices = NULL)
        )
      ),
      open = c("Data Source", "Pivot Operation")
    ),

    hr(),
    actionButton("run_pivot", "Run Pivot",
                  class = "btn-primary btn-lg w-100"),
    hr(),
    downloadButton("download_result", "Download Result (CSV)",
                   class = "btn-outline-primary w-100")
  ),

  # Main panel
  navset_card_tab(
    nav_panel(
      title = "Input Data",
      card_body(
        DTOutput("input_table")
      )
    ),
    nav_panel(
      title = "Pivot Result",
      card_body(
        DTOutput("output_table")
      )
    ),
    nav_panel(
      title = "R Code",
      card_body(
        p("Copy this code into your R script to reproduce the transformation:"),
        verbatimTextOutput("generated_code"),
        actionButton("copy_code", "Copy to Clipboard",
                     class = "btn-outline-secondary btn-sm",
                     onclick = "
                       var codeText = document.getElementById('generated_code').innerText;
                       navigator.clipboard.writeText(codeText);
                     ")
      )
    ),
    nav_panel(
      title = "About",
      card_body(
        h4("Pivot Playground"),
        p("An interactive tool for learning tidyr pivot operations."),
        tags$ul(
          tags$li(tags$strong("pivot_longer():"), " Converts wide data to long format by collapsing multiple columns into key-value pairs."),
          tags$li(tags$strong("pivot_wider():"), " Converts long data to wide format by spreading key-value pairs across columns.")
        ),
        hr(),
        p("Built for ISA 401: Business Intelligence & Data Visualization, Spring 2026."),
        p("Powered by ", tags$a(href = "https://tidyr.tidyverse.org/", "tidyr"),
          " and ", tags$a(href = "https://rstudio.github.io/bslib/", "bslib"), ".")
      )
    )
  )
)


# --- Server ---
server <- function(input, output, session) {

  # Reactive: current data
  current_data <- reactive({
    if (input$data_source == "upload" && !is.null(input$file_upload)) {
      readr::read_csv(input$file_upload$datapath,
                      col_names = input$has_header,
                      show_col_types = FALSE)
    } else {
      sample_job_data
    }
  })

  # Update column selectors when data changes
  observe({
    df <- current_data()
    col_names <- names(df)

    # For pivot_longer: let users pick columns to collapse
    updateSelectInput(session, "cols_to_pivot",
                      choices = col_names,
                      selected = col_names[sapply(df, is.numeric)])

    # For pivot_wider: pick name and value columns
    updateSelectInput(session, "names_from", choices = col_names,
                      selected = col_names[1])
    updateSelectInput(session, "values_from", choices = col_names,
                      selected = col_names[min(2, length(col_names))])
  })

  # Reactive: pivot result
  pivot_result <- eventReactive(input$run_pivot, {
    df <- current_data()

    tryCatch({
      if (input$pivot_direction == "longer") {
        req(input$cols_to_pivot)
        args <- list(
          data = df,
          cols = all_of(input$cols_to_pivot),
          names_to = input$names_to,
          values_to = input$values_to
        )
        if (nzchar(input$names_prefix)) {
          args$names_prefix <- input$names_prefix
        }
        do.call(tidyr::pivot_longer, args)

      } else {
        req(input$names_from, input$values_from)
        tidyr::pivot_wider(
          df,
          names_from = !!sym(input$names_from),
          values_from = !!sym(input$values_from)
        )
      }
    }, error = function(e) {
      showNotification(
        paste("Pivot error:", e$message),
        type = "error",
        duration = 8
      )
      NULL
    })
  })

  # Reactive: generated code
  code_text <- eventReactive(input$run_pivot, {
    data_name <- if (input$data_source == "upload") "my_data" else "job_data"

    if (input$pivot_direction == "longer") {
      generate_pivot_longer_code(
        data_name = data_name,
        cols = input$cols_to_pivot,
        names_to = input$names_to,
        values_to = input$values_to,
        names_prefix = input$names_prefix
      )
    } else {
      generate_pivot_wider_code(
        data_name = data_name,
        names_from = input$names_from,
        values_from = input$values_from
      )
    }
  })

  # --- Outputs ---

  output$input_table <- renderDT({
    datatable(
      current_data(),
      options = list(
        pageLength = 10,
        scrollX = TRUE,
        dom = "frtip"
      ),
      rownames = FALSE
    )
  })

  output$output_table <- renderDT({
    req(pivot_result())
    datatable(
      pivot_result(),
      options = list(
        pageLength = 15,
        scrollX = TRUE,
        dom = "frtip"
      ),
      rownames = FALSE
    )
  })

  output$generated_code <- renderText({
    req(code_text())
    code_text()
  })

  output$download_result <- downloadHandler(
    filename = function() {
      paste0("pivot_result_", format(Sys.time(), "%Y%m%d_%H%M%S"), ".csv")
    },
    content = function(file) {
      req(pivot_result())
      readr::write_csv(pivot_result(), file)
    }
  )
}

shinyApp(ui, server)
