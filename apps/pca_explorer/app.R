# PCA / t-SNE Explorer
# ISA 401: Business Intelligence & Data Visualization
# Spring 2026

library(shiny)
library(bslib)
library(ggplot2)
library(dplyr)
library(tidyr)
library(Rtsne)

# --------------------------------------------------------------------------
# Sample job market data (100 rows) -- same as kmeans_explorer
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
  title = "PCA / t-SNE Explorer",
  theme = bs_theme(
    bootswatch = "flatly",
    primary = "#C3142D"
  ),

  sidebar = sidebar(
    width = 320,
    h4("Dimensionality Reduction"),
    hr(),

    radioButtons(
      "method", "Method:",
      choices = c("PCA" = "pca", "t-SNE" = "tsne"),
      selected = "pca",
      inline = TRUE
    ),

    hr(),
    h5("Feature Selection"),
    p("Select at least 3 features:"),

    checkboxGroupInput(
      "features", NULL,
      choices = feature_names,
      selected = feature_names
    ),

    hr(),

    conditionalPanel(
      condition = "input.method == 'tsne'",
      sliderInput(
        "perplexity", "t-SNE Perplexity:",
        min = 5, max = 50, value = 15, step = 1
      )
    ),

    hr(),
    h5("Cluster Coloring"),

    sliderInput(
      "k_clusters", "K-Means Clusters (for coloring):",
      min = 2, max = 8, value = 3, step = 1
    ),

    hr(),

    actionButton(
      "run", "Run Analysis",
      class = "btn-primary btn-lg w-100"
    ),

    hr(),
    p(
      class = "text-muted small",
      "ISA 401 | Spring 2026 | Data is generated for demonstration."
    )
  ),

  layout_columns(
    col_widths = c(7, 5),

    card(
      card_header(textOutput("scatter_title")),
      plotOutput("scatter_plot", height = "450px")
    ),

    card(
      card_header(textOutput("info_title")),
      conditionalPanel(
        condition = "input.method == 'pca'",
        plotOutput("scree_plot", height = "200px"),
        hr(),
        h5("Variance Explained"),
        tableOutput("variance_table")
      ),
      conditionalPanel(
        condition = "input.method == 'tsne'",
        p("t-SNE does not produce interpretable components like PCA."),
        p("The axes represent abstract dimensions optimized to preserve",
          "local neighborhood structure."),
        hr(),
        h5("t-SNE Parameters"),
        tableOutput("tsne_params"),
        hr(),
        p(class = "text-muted",
          "Tip: Try different perplexity values (5-50) to see how the ",
          "visualization changes. Lower perplexity focuses on local ",
          "structure; higher perplexity captures more global patterns.")
      )
    )
  ),

  layout_columns(
    col_widths = c(6, 6),

    card(
      card_header("Loadings / Feature Contributions"),
      conditionalPanel(
        condition = "input.method == 'pca'",
        plotOutput("loadings_plot", height = "350px")
      ),
      conditionalPanel(
        condition = "input.method == 'tsne'",
        p("t-SNE does not produce feature loadings. Switch to PCA to see",
          "how individual features contribute to each component."),
        plotOutput("cluster_profile_plot", height = "300px")
      )
    ),

    card(
      card_header("Cluster Summary"),
      tableOutput("cluster_summary")
    )
  )
)

# --------------------------------------------------------------------------
# Server
# --------------------------------------------------------------------------
server <- function(input, output, session) {

  # Reactive: validate and prepare data
  selected_data <- reactive({
    req(length(input$features) >= 3)
    job_data[, input$features, drop = FALSE]
  })

  scaled_data <- reactive({
    scale(selected_data())
  })

  # Reactive: k-means for coloring
  km_result <- reactive({
    req(scaled_data())
    set.seed(123)
    kmeans(scaled_data(), centers = input$k_clusters, nstart = 25, iter.max = 100)
  })

  # Reactive: PCA or t-SNE (runs on button click)
  analysis_result <- eventReactive(input$run, {
    req(scaled_data())
    sd <- scaled_data()

    if (input$method == "pca") {
      pca <- prcomp(sd, center = FALSE, scale. = FALSE)
      list(
        method = "pca",
        coords = data.frame(Dim1 = pca$x[, 1], Dim2 = pca$x[, 2]),
        pca = pca
      )
    } else {
      perp <- min(input$perplexity, floor((nrow(sd) - 1) / 3))
      set.seed(42)
      tsne <- Rtsne::Rtsne(
        sd, dims = 2, perplexity = perp,
        max_iter = 1000, check_duplicates = FALSE
      )
      list(
        method = "tsne",
        coords = data.frame(Dim1 = tsne$Y[, 1], Dim2 = tsne$Y[, 2]),
        perplexity = perp
      )
    }
  }, ignoreNULL = FALSE)

  # ------ Dynamic titles ------
  output$scatter_title <- renderText({
    res <- analysis_result()
    if (res$method == "pca") {
      "PCA: First Two Principal Components"
    } else {
      paste0("t-SNE Visualization (perplexity = ", res$perplexity, ")")
    }
  })

  output$info_title <- renderText({
    res <- analysis_result()
    if (res$method == "pca") "PCA Details" else "t-SNE Details"
  })

  # ------ Scatter Plot ------
  output$scatter_plot <- renderPlot({
    req(analysis_result(), km_result())
    res <- analysis_result()
    km <- km_result()

    plot_df <- res$coords
    plot_df$cluster <- factor(km$cluster)

    x_lab <- if (res$method == "pca") {
      pve <- summary(res$pca)$importance[2, 1] * 100
      paste0("PC1 (", round(pve, 1), "% variance)")
    } else {
      "t-SNE Dimension 1"
    }

    y_lab <- if (res$method == "pca") {
      pve <- summary(res$pca)$importance[2, 2] * 100
      paste0("PC2 (", round(pve, 1), "% variance)")
    } else {
      "t-SNE Dimension 2"
    }

    ggplot(plot_df, aes(x = Dim1, y = Dim2, color = cluster)) +
      geom_point(size = 3.5, alpha = 0.75) +
      scale_color_brewer(palette = "Set1") +
      theme_minimal(base_size = 14) +
      labs(x = x_lab, y = y_lab, color = "Cluster") +
      theme(
        legend.position = "bottom",
        plot.title = element_text(face = "bold")
      )
  })

  # ------ Scree Plot (PCA only) ------
  output$scree_plot <- renderPlot({
    req(analysis_result())
    res <- analysis_result()
    req(res$method == "pca")

    pca <- res$pca
    var_pct <- summary(pca)$importance[2, ] * 100
    n_pcs <- length(var_pct)

    scree_df <- data.frame(PC = factor(1:n_pcs), Variance = var_pct)

    ggplot(scree_df, aes(x = PC, y = Variance)) +
      geom_col(fill = "#C3142D", alpha = 0.8) +
      geom_text(aes(label = paste0(round(Variance, 1), "%")),
                vjust = -0.5, size = 3.5) +
      theme_minimal(base_size = 13) +
      labs(
        title = "Scree Plot",
        x = "Principal Component",
        y = "% Variance Explained"
      ) +
      ylim(0, max(var_pct) * 1.15) +
      theme(plot.title = element_text(face = "bold"))
  })

  # ------ Variance Table (PCA only) ------
  output$variance_table <- renderTable({
    req(analysis_result())
    res <- analysis_result()
    req(res$method == "pca")

    imp <- summary(res$pca)$importance
    n_pcs <- ncol(imp)
    data.frame(
      Component = paste0("PC", 1:n_pcs),
      `Std Dev` = round(imp[1, ], 3),
      `Var (%)` = round(imp[2, ] * 100, 1),
      `Cumulative (%)` = round(imp[3, ] * 100, 1),
      check.names = FALSE
    )
  }, striped = TRUE, hover = TRUE, bordered = TRUE)

  # ------ t-SNE Parameters Table ------
  output$tsne_params <- renderTable({
    req(analysis_result())
    res <- analysis_result()
    req(res$method == "tsne")

    data.frame(
      Parameter = c("Perplexity", "Dimensions", "Max Iterations", "Features Used"),
      Value = c(res$perplexity, 2, 1000, length(input$features))
    )
  }, striped = TRUE, hover = TRUE, bordered = TRUE)

  # ------ Loadings Plot (PCA only) ------
  output$loadings_plot <- renderPlot({
    req(analysis_result())
    res <- analysis_result()
    req(res$method == "pca")

    pca <- res$pca
    loadings <- as.data.frame(pca$rotation[, 1:2])
    loadings$Feature <- rownames(loadings)

    loadings_long <- loadings %>%
      pivot_longer(cols = c(PC1, PC2), names_to = "Component", values_to = "Loading")

    ggplot(loadings_long, aes(x = reorder(Feature, abs(Loading)), y = Loading, fill = Component)) +
      geom_col(position = "dodge", alpha = 0.85) +
      coord_flip() +
      scale_fill_manual(values = c("PC1" = "#C3142D", "PC2" = "#377EB8")) +
      theme_minimal(base_size = 13) +
      labs(
        title = "Feature Loadings on PC1 and PC2",
        x = "Feature",
        y = "Loading",
        fill = ""
      ) +
      theme(
        plot.title = element_text(face = "bold"),
        legend.position = "bottom"
      )
  })

  # ------ Cluster Profile Plot (t-SNE mode) ------
  output$cluster_profile_plot <- renderPlot({
    req(km_result(), selected_data())
    km <- km_result()
    df <- selected_data()
    df$Cluster <- factor(km$cluster)

    df %>%
      pivot_longer(-Cluster, names_to = "Feature", values_to = "Value") %>%
      ggplot(aes(x = Feature, y = Value, fill = Cluster)) +
      geom_boxplot(alpha = 0.7) +
      scale_fill_brewer(palette = "Set1") +
      theme_minimal(base_size = 12) +
      labs(title = "Feature Distributions by Cluster", x = "", y = "Value") +
      theme(
        axis.text.x = element_text(angle = 30, hjust = 1),
        plot.title = element_text(face = "bold"),
        legend.position = "bottom"
      )
  })

  # ------ Cluster Summary Table ------
  output$cluster_summary <- renderTable({
    req(km_result(), selected_data())
    km <- km_result()
    df <- selected_data()
    df$Cluster <- factor(km$cluster)

    df %>%
      group_by(Cluster) %>%
      summarise(
        across(everything(), ~ round(mean(.x), 1)),
        N = n(),
        .groups = "drop"
      )
  }, striped = TRUE, hover = TRUE, bordered = TRUE)
}

# --------------------------------------------------------------------------
# Run
# --------------------------------------------------------------------------
shinyApp(ui, server)
