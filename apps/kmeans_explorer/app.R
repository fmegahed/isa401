# K-Means Clustering Explorer
# ISA 401: Business Intelligence & Data Visualization
# Spring 2026

library(shiny)
library(bslib)
library(ggplot2)
library(dplyr)
library(tidyr)
library(factoextra)
library(cluster)

# --------------------------------------------------------------------------
# Sample job market data (100 rows)
# --------------------------------------------------------------------------
set.seed(401)
job_data <- data.frame(
  salary = round(c(
    runif(25, 35000, 52000), runif(15, 48000, 62000),
    runif(25, 58000, 90000), runif(15, 85000, 110000),
    runif(20, 105000, 160000)
  ), -3),
  skills_count = c(
    sample(3:6, 25, replace = TRUE), sample(5:8, 15, replace = TRUE),
    sample(6:10, 25, replace = TRUE), sample(8:12, 15, replace = TRUE),
    sample(10:15, 20, replace = TRUE)
  ),
  experience_years = round(c(
    runif(25, 0, 2.5), runif(15, 1.5, 5),
    runif(25, 3, 9), runif(15, 6, 13),
    runif(20, 10, 22)
  ), 1),
  education_level_num = c(
    sample(1:2, 25, replace = TRUE, prob = c(0.6, 0.4)),
    sample(1:3, 15, replace = TRUE, prob = c(0.3, 0.5, 0.2)),
    sample(2:3, 25, replace = TRUE, prob = c(0.5, 0.5)),
    sample(2:4, 15, replace = TRUE, prob = c(0.3, 0.5, 0.2)),
    sample(3:4, 20, replace = TRUE, prob = c(0.5, 0.5))
  ),
  is_remote_num = sample(c(0, 1), 100, replace = TRUE, prob = c(0.55, 0.45))
)

feature_names <- names(job_data)

# --------------------------------------------------------------------------
# UI
# --------------------------------------------------------------------------
ui <- page_sidebar(
  title = "K-Means Clustering Explorer",
  theme = bs_theme(
    bootswatch = "flatly",
    primary = "#C3142D"
  ),

  sidebar = sidebar(
    width = 300,
    h4("Clustering Controls"),
    hr(),

    sliderInput(
      "k", "Number of Clusters (k):",
      min = 2, max = 10, value = 3, step = 1
    ),

    selectInput(
      "x_var", "X-axis Variable:",
      choices = feature_names,
      selected = "experience_years"
    ),

    selectInput(
      "y_var", "Y-axis Variable:",
      choices = feature_names,
      selected = "salary"
    ),

    hr(),
    h5("Feature Selection"),
    p("Select features to include in clustering:"),

    checkboxGroupInput(
      "features", NULL,
      choices = feature_names,
      selected = feature_names
    ),

    hr(),

    actionButton(
      "run", "Run K-Means",
      class = "btn-primary btn-lg w-100"
    ),

    hr(),
    p(
      class = "text-muted small",
      "ISA 401 | Spring 2026 | Data is generated for demonstration."
    )
  ),

  layout_columns(
    col_widths = c(6, 6),

    card(
      card_header("Cluster Scatter Plot"),
      plotOutput("cluster_plot", height = "400px")
    ),

    card(
      card_header("Cluster Summary Statistics"),
      tableOutput("cluster_table")
    )
  ),

  layout_columns(
    col_widths = c(6, 6),

    card(
      card_header("Elbow Plot (Within-Cluster Sum of Squares)"),
      plotOutput("elbow_plot", height = "350px")
    ),

    card(
      card_header("Average Silhouette Width by K"),
      plotOutput("silhouette_plot", height = "350px")
    )
  )
)

# --------------------------------------------------------------------------
# Server
# --------------------------------------------------------------------------
server <- function(input, output, session) {

  # Reactive: selected and scaled features
  selected_data <- reactive({
    req(length(input$features) >= 2)
    job_data[, input$features, drop = FALSE]
  })

  scaled_data <- reactive({
    scale(selected_data())
  })

  # Reactive: k-means result (runs on button click)
  km_result <- eventReactive(input$run, {
    req(scaled_data())
    set.seed(123)
    kmeans(scaled_data(), centers = input$k, nstart = 25, iter.max = 100)
  }, ignoreNULL = FALSE)

  # ------ Cluster Scatter Plot ------
  output$cluster_plot <- renderPlot({
    req(km_result())
    km <- km_result()

    plot_df <- job_data
    plot_df$cluster <- factor(km$cluster)

    ggplot(plot_df, aes(
      x = .data[[input$x_var]],
      y = .data[[input$y_var]],
      color = cluster
    )) +
      geom_point(size = 3, alpha = 0.75) +
      scale_color_brewer(palette = "Set1") +
      theme_minimal(base_size = 14) +
      labs(
        title = paste0("K-Means Clustering (k = ", input$k, ")"),
        x = input$x_var,
        y = input$y_var,
        color = "Cluster"
      ) +
      theme(
        legend.position = "bottom",
        plot.title = element_text(face = "bold")
      )
  })

  # ------ Cluster Summary Table ------
  output$cluster_table <- renderTable({
    req(km_result())
    km <- km_result()

    plot_df <- selected_data()
    plot_df$Cluster <- factor(km$cluster)

    plot_df %>%
      group_by(Cluster) %>%
      summarise(
        across(everything(), ~ round(mean(.x), 1)),
        N = n(),
        .groups = "drop"
      )
  }, striped = TRUE, hover = TRUE, bordered = TRUE)

  # ------ Elbow Plot ------
  output$elbow_plot <- renderPlot({
    req(scaled_data())
    sd <- scaled_data()

    wss_values <- sapply(1:10, function(k) {
      set.seed(123)
      km <- kmeans(sd, centers = k, nstart = 25, iter.max = 100)
      km$tot.withinss
    })

    elbow_df <- data.frame(k = 1:10, WSS = wss_values)

    ggplot(elbow_df, aes(x = k, y = WSS)) +
      geom_line(color = "#C3142D", linewidth = 1) +
      geom_point(color = "#C3142D", size = 3) +
      geom_vline(xintercept = input$k, linetype = "dashed", color = "steelblue", linewidth = 0.8) +
      annotate("text", x = input$k + 0.3, y = max(wss_values) * 0.9,
               label = paste("k =", input$k), color = "steelblue", hjust = 0, size = 4) +
      scale_x_continuous(breaks = 1:10) +
      theme_minimal(base_size = 14) +
      labs(
        title = "Elbow Method",
        x = "Number of Clusters (k)",
        y = "Total Within-Cluster Sum of Squares"
      ) +
      theme(plot.title = element_text(face = "bold"))
  })

  # ------ Silhouette Plot ------
  output$silhouette_plot <- renderPlot({
    req(scaled_data())
    sd <- scaled_data()

    sil_values <- sapply(2:10, function(k) {
      set.seed(123)
      km <- kmeans(sd, centers = k, nstart = 25, iter.max = 100)
      sil <- cluster::silhouette(km$cluster, dist(sd))
      mean(sil[, 3])
    })

    sil_df <- data.frame(k = 2:10, Silhouette = sil_values)

    ggplot(sil_df, aes(x = k, y = Silhouette)) +
      geom_line(color = "#377EB8", linewidth = 1) +
      geom_point(color = "#377EB8", size = 3) +
      geom_vline(xintercept = input$k, linetype = "dashed", color = "#C3142D", linewidth = 0.8) +
      annotate("text", x = input$k + 0.3, y = max(sil_values) * 0.95,
               label = paste("k =", input$k), color = "#C3142D", hjust = 0, size = 4) +
      scale_x_continuous(breaks = 2:10) +
      theme_minimal(base_size = 14) +
      labs(
        title = "Silhouette Method",
        x = "Number of Clusters (k)",
        y = "Average Silhouette Width"
      ) +
      theme(plot.title = element_text(face = "bold"))
  })
}

# --------------------------------------------------------------------------
# Run
# --------------------------------------------------------------------------
shinyApp(ui, server)
