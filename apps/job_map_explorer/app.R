# ISA 401: Job Map Explorer
# Interactive Leaflet map with filters for occupation, salary, and state
# Built with bslib for modern UI

library(shiny)
library(bslib)
library(leaflet)
library(dplyr)
library(scales)

# ---------------------------------------------------------------------------
# Sample Data (inline)
# ---------------------------------------------------------------------------

job_data <- tibble::tribble(
  ~title, ~company, ~occupation, ~salary, ~state, ~city, ~lat, ~lng,
  "Data Analyst", "Google", "Data Analyst", 105000, "California", "Mountain View", 37.3861, -122.0839,
  "Data Analyst", "Meta", "Data Analyst", 110000, "California", "Menlo Park", 37.4530, -122.1817,
  "Data Analyst", "Apple", "Data Analyst", 108000, "California", "Cupertino", 37.3230, -122.0322,
  "Data Analyst", "Salesforce", "Data Analyst", 98000, "California", "San Francisco", 37.7749, -122.4194,
  "Data Analyst", "Netflix", "Data Analyst", 115000, "California", "Los Gatos", 37.2263, -121.9744,
  "Data Analyst", "Amazon", "Data Analyst", 95000, "Washington", "Seattle", 47.6062, -122.3321,
  "Data Analyst", "Microsoft", "Data Analyst", 100000, "Washington", "Redmond", 47.6740, -122.1215,
  "Data Analyst", "T-Mobile", "Data Analyst", 88000, "Washington", "Bellevue", 47.6101, -122.2015,
  "Data Analyst", "JPMorgan Chase", "Data Analyst", 92000, "New York", "New York City", 40.7128, -74.0060,
  "Data Analyst", "Goldman Sachs", "Data Analyst", 98000, "New York", "New York City", 40.7145, -74.0134,
  "Data Analyst", "Bloomberg", "Data Analyst", 95000, "New York", "New York City", 40.7484, -73.9967,
  "Data Scientist", "Google", "Data Scientist", 140000, "California", "Mountain View", 37.3870, -122.0838,
  "Data Scientist", "Meta", "Data Scientist", 145000, "California", "Menlo Park", 37.4520, -122.1810,
  "Data Scientist", "OpenAI", "Data Scientist", 160000, "California", "San Francisco", 37.7755, -122.4180,
  "Data Scientist", "Amazon", "Data Scientist", 135000, "Washington", "Seattle", 47.6075, -122.3360,
  "Data Scientist", "Microsoft", "Data Scientist", 138000, "Washington", "Redmond", 47.6750, -122.1220,
  "Data Scientist", "Netflix", "Data Scientist", 155000, "California", "Los Gatos", 37.2270, -121.9750,
  "Data Scientist", "Spotify", "Data Scientist", 130000, "New York", "New York City", 40.7420, -73.9890,
  "Data Scientist", "Capital One", "Data Scientist", 125000, "Virginia", "McLean", 38.9339, -77.1773,
  "Data Scientist", "Deloitte", "Data Scientist", 120000, "Illinois", "Chicago", 41.8781, -87.6298,
  "Business Analyst", "Accenture", "Business Analyst", 82000, "Illinois", "Chicago", 41.8800, -87.6295,
  "Business Analyst", "McKinsey", "Business Analyst", 95000, "New York", "New York City", 40.7580, -73.9855,
  "Business Analyst", "Deloitte", "Business Analyst", 85000, "Texas", "Dallas", 32.7767, -96.7970,
  "Business Analyst", "PwC", "Business Analyst", 80000, "Texas", "Houston", 29.7604, -95.3698,
  "Business Analyst", "KPMG", "Business Analyst", 78000, "Georgia", "Atlanta", 33.7490, -84.3880,
  "Business Analyst", "EY", "Business Analyst", 83000, "Florida", "Miami", 25.7617, -80.1918,
  "Business Analyst", "BCG", "Business Analyst", 90000, "Massachusetts", "Boston", 42.3601, -71.0589,
  "Business Analyst", "Bain", "Business Analyst", 88000, "Massachusetts", "Boston", 42.3555, -71.0605,
  "Software Engineer", "Google", "Software Engineer", 155000, "California", "Mountain View", 37.3880, -122.0845,
  "Software Engineer", "Microsoft", "Software Engineer", 148000, "Washington", "Redmond", 47.6730, -122.1205,
  "Software Engineer", "Amazon", "Software Engineer", 145000, "Washington", "Seattle", 47.6050, -122.3340,
  "Software Engineer", "Meta", "Software Engineer", 160000, "California", "Menlo Park", 37.4540, -122.1825,
  "Software Engineer", "Apple", "Software Engineer", 152000, "California", "Cupertino", 37.3240, -122.0330,
  "Software Engineer", "Stripe", "Software Engineer", 165000, "California", "San Francisco", 37.7805, -122.4160,
  "Software Engineer", "Airbnb", "Software Engineer", 150000, "California", "San Francisco", 37.7710, -122.4050,
  "Software Engineer", "Uber", "Software Engineer", 148000, "California", "San Francisco", 37.7750, -122.4170,
  "Software Engineer", "Oracle", "Software Engineer", 130000, "Texas", "Austin", 30.2672, -97.7431,
  "Software Engineer", "Dell", "Software Engineer", 125000, "Texas", "Round Rock", 30.5083, -97.6789,
  "BI Developer", "Target", "BI Developer", 90000, "Minnesota", "Minneapolis", 44.9778, -93.2650,
  "BI Developer", "Best Buy", "BI Developer", 85000, "Minnesota", "Richfield", 44.8831, -93.2779,
  "BI Developer", "UnitedHealth", "BI Developer", 92000, "Minnesota", "Minnetonka", 44.9214, -93.4688,
  "BI Developer", "Humana", "BI Developer", 87000, "Kentucky", "Louisville", 38.2527, -85.7585,
  "BI Developer", "FedEx", "BI Developer", 83000, "Tennessee", "Memphis", 35.1495, -90.0490,
  "BI Developer", "Home Depot", "BI Developer", 88000, "Georgia", "Atlanta", 33.7490, -84.3900,
  "BI Developer", "Walmart", "BI Developer", 80000, "Arkansas", "Bentonville", 36.3729, -94.2088,
  "BI Developer", "P&G", "BI Developer", 91000, "Ohio", "Cincinnati", 39.1031, -84.5120,
  "BI Developer", "Kroger", "BI Developer", 82000, "Ohio", "Cincinnati", 39.1000, -84.5150,
  "BI Developer", "Nationwide", "BI Developer", 86000, "Ohio", "Columbus", 39.9612, -82.9988,
  "Data Engineer", "Snowflake", "Data Engineer", 155000, "California", "San Mateo", 37.5630, -122.3255,
  "Data Engineer", "Databricks", "Data Engineer", 160000, "California", "San Francisco", 37.7720, -122.3950,
  "Data Engineer", "Palantir", "Data Engineer", 150000, "Colorado", "Denver", 39.7392, -104.9903,
  "Data Engineer", "Lockheed Martin", "Data Engineer", 125000, "Maryland", "Bethesda", 38.9847, -77.0947,
  "Data Engineer", "Booz Allen", "Data Engineer", 130000, "Virginia", "McLean", 38.9340, -77.1775
)

# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------

ui <- bslib::page_sidebar(
  title = "ISA 401: Job Map Explorer",
  theme = bslib::bs_theme(primary = "#C3142D"),

  sidebar = bslib::sidebar(
    title = "Filters",
    width = 300,

    selectInput(
      inputId = "occupation",
      label = "Occupation",
      choices = c("All", sort(unique(job_data$occupation))),
      selected = "All"
    ),

    sliderInput(
      inputId = "salary_range",
      label = "Salary Range",
      min = floor(min(job_data$salary) / 10000) * 10000,
      max = ceiling(max(job_data$salary) / 10000) * 10000,
      value = c(
        floor(min(job_data$salary) / 10000) * 10000,
        ceiling(max(job_data$salary) / 10000) * 10000
      ),
      step = 5000,
      pre = "$",
      sep = ","
    ),

    selectInput(
      inputId = "state",
      label = "State",
      choices = c("All", sort(unique(job_data$state))),
      selected = "All"
    ),

    tags$hr(),

    tags$div(
      class = "text-muted small",
      tags$p(
        tags$strong("About:"),
        "This app displays job postings on an interactive map. ",
        "Circle size represents relative salary; color encodes salary level. ",
        "Click a marker to see job details."
      ),
      tags$p(
        "Built for ISA 401: Business Intelligence & Data Visualization at Miami University."
      )
    )
  ),

  # Main content
  bslib::layout_column_wrap(
    width = 1,
    heights_equal = "row",

    # Value boxes row
    bslib::layout_column_wrap(
      width = 1 / 4,
      fill = FALSE,
      bslib::value_box(
        title = "Jobs Shown",
        value = textOutput("n_jobs"),
        showcase = bsicons::bs_icon("briefcase"),
        theme = "primary"
      ),
      bslib::value_box(
        title = "Avg Salary",
        value = textOutput("avg_salary"),
        showcase = bsicons::bs_icon("currency-dollar"),
        theme = "success"
      ),
      bslib::value_box(
        title = "Min Salary",
        value = textOutput("min_salary"),
        showcase = bsicons::bs_icon("arrow-down"),
        theme = "info"
      ),
      bslib::value_box(
        title = "Max Salary",
        value = textOutput("max_salary"),
        showcase = bsicons::bs_icon("arrow-up"),
        theme = "warning"
      )
    ),

    # Map
    bslib::card(
      full_screen = TRUE,
      bslib::card_header(
        class = "fw-bold",
        bsicons::bs_icon("geo-alt-fill"), " Job Locations"
      ),
      bslib::card_body(
        padding = 0,
        leafletOutput("map", height = "100%")
      ),
      height = "550px"
    )
  )
)

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------

server <- function(input, output, session) {

  # Reactive filtered data
  filtered_data <- reactive({
    df <- job_data

    if (input$occupation != "All") {
      df <- df |> filter(occupation == input$occupation)
    }

    df <- df |> filter(salary >= input$salary_range[1],
                       salary <= input$salary_range[2])

    if (input$state != "All") {
      df <- df |> filter(state == input$state)
    }

    df
  })

  # Value boxes
  output$n_jobs <- renderText({
    format(nrow(filtered_data()), big.mark = ",")
  })

  output$avg_salary <- renderText({
    if (nrow(filtered_data()) == 0) return("--")
    dollar(mean(filtered_data()$salary), accuracy = 1)
  })

  output$min_salary <- renderText({
    if (nrow(filtered_data()) == 0) return("--")
    dollar(min(filtered_data()$salary), accuracy = 1)
  })

  output$max_salary <- renderText({
    if (nrow(filtered_data()) == 0) return("--")
    dollar(max(filtered_data()$salary), accuracy = 1)
  })

  # Leaflet map
  output$map <- renderLeaflet({
    # Initialize the base map once
    leaflet() |>
      addTiles(group = "OpenStreetMap") |>
      addProviderTiles(providers$CartoDB.Positron, group = "Light") |>
      addProviderTiles(providers$Esri.WorldImagery, group = "Satellite") |>
      setView(lng = -98.58, lat = 39.83, zoom = 4) |>
      addLayersControl(
        baseGroups = c("OpenStreetMap", "Light", "Satellite"),
        options = layersControlOptions(collapsed = TRUE)
      )
  })

  # Update markers when filters change
  observe({
    df <- filtered_data()

    # Create a color palette
    if (nrow(df) == 0) {
      leafletProxy("map") |> clearMarkers() |> clearControls()
      return()
    }

    pal <- colorNumeric(
      palette = "YlOrRd",
      domain = job_data$salary  # use full domain so colors are consistent
    )

    leafletProxy("map", data = df) |>
      clearMarkers() |>
      clearControls() |>
      addCircleMarkers(
        lng = ~lng, lat = ~lat,
        radius = ~scales::rescale(salary, to = c(5, 15)),
        color = ~pal(salary),
        fillOpacity = 0.75,
        stroke = TRUE,
        weight = 1,
        popup = ~paste0(
          "<div style='min-width: 200px;'>",
          "<h4 style='margin: 0 0 5px 0; color: #C3142D;'>", title, "</h4>",
          "<table style='width: 100%;'>",
          "<tr><td><b>Company:</b></td><td>", company, "</td></tr>",
          "<tr><td><b>Salary:</b></td><td>", dollar(salary), "</td></tr>",
          "<tr><td><b>Location:</b></td><td>", city, ", ", state, "</td></tr>",
          "<tr><td><b>Occupation:</b></td><td>", occupation, "</td></tr>",
          "</table></div>"
        ),
        label = ~paste0(title, " at ", company, " - ", dollar(salary))
      ) |>
      addLegend(
        "bottomright",
        pal = pal,
        values = job_data$salary,
        title = "Salary",
        labFormat = labelFormat(prefix = "$"),
        opacity = 0.8
      )
  })
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

shinyApp(ui, server)
