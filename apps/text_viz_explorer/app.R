# ISA 401: Text Viz Explorer
# Paste text or choose a pre-loaded job description, then see
# a word cloud, frequency bar chart, and sentiment summary
# Built with bslib, wordcloud2, tidytext, and ggplot2

library(shiny)
library(bslib)
library(tidyverse)
library(tidytext)
library(wordcloud2)
library(scales)

# ---------------------------------------------------------------------------
# Pre-loaded job descriptions
# ---------------------------------------------------------------------------

sample_descriptions <- list(
  "Data Analyst (Tech)" = paste(
    "We are seeking a passionate Data Analyst to join our innovative team.",
    "You will analyze large datasets using SQL, Python, and Tableau to uncover",
    "actionable insights. Experience with statistical modeling and data visualization",
    "required. Strong communication skills to present findings to stakeholders.",
    "We offer excellent benefits, flexible remote work, and exciting growth",
    "opportunities in a collaborative, fast-paced environment."
  ),

  "Data Scientist (Finance)" = paste(
    "Senior Data Scientist needed for our risk analytics division.",
    "Must have rigorous experience with machine learning, deep learning, and",
    "advanced statistical methods. Strong Python and R skills mandatory.",
    "You will build predictive models for fraud detection and credit risk.",
    "Demanding deadlines and strict compliance with regulatory standards required.",
    "Competitive compensation for qualified candidates with proven track record."
  ),

  "Business Analyst (Healthcare)" = paste(
    "Join our compassionate team improving patient outcomes through data.",
    "The Business Analyst will support clinical decision-making with reports,",
    "dashboards, and data-driven recommendations. Proficiency in Excel, Power BI,",
    "and SQL required. Knowledge of healthcare regulations is a plus.",
    "Meaningful work with a supportive team dedicated to community wellness.",
    "Comprehensive benefits, generous PTO, and stable career growth."
  ),

  "BI Developer (Retail)" = paste(
    "We need a skilled BI Developer to design and maintain enterprise dashboards.",
    "You will work with Tableau, Power BI, and SQL Server to deliver reliable",
    "reporting solutions for supply chain and sales analytics. ETL pipeline",
    "development experience preferred. Must handle complex data from multiple",
    "sources. Fast-paced environment with tight deadlines. Good problem solving",
    "and attention to detail essential for success."
  ),

  "Software Engineer (Startup)" = paste(
    "Exciting opportunity at a cutting-edge AI startup! We are building the",
    "future of automated analytics. Looking for a creative and driven Software",
    "Engineer with expertise in Python, JavaScript, React, and cloud platforms.",
    "You will design beautiful, scalable products used by thousands. Amazing",
    "culture, equity compensation, unlimited PTO, and incredible team.",
    "Move fast, break things, and help us change the world."
  )
)

# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------

ui <- bslib::page_sidebar(
  title = "ISA 401: Text Viz Explorer",
  theme = bslib::bs_theme(primary = "#C3142D"),

  sidebar = bslib::sidebar(
    title = "Input",
    width = 350,

    selectInput(
      inputId = "sample_choice",
      label = "Choose a sample job description",
      choices = c("(Custom text)" = "custom", names(sample_descriptions))
    ),

    textAreaInput(
      inputId = "custom_text",
      label = "Or paste your own text below",
      value = "",
      rows = 8,
      placeholder = "Paste any text here (a job description, review, article, etc.) and click Analyze..."
    ),

    sliderInput(
      inputId = "min_freq",
      label = "Min word frequency to display",
      min = 1, max = 5, value = 1, step = 1
    ),

    actionButton(
      inputId = "analyze",
      label = "Analyze Text",
      class = "btn-primary w-100 mt-2",
      icon = icon("magnifying-glass")
    ),

    tags$hr(),

    tags$div(
      class = "text-muted small",
      tags$p(
        tags$strong("How to use:"),
        "Select a pre-loaded job description or paste your own text. ",
        "Click 'Analyze Text' to generate a word cloud, frequency chart, ",
        "and sentiment breakdown."
      ),
      tags$p(
        "Sentiment is computed using the ",
        tags$strong("Bing"), " (positive/negative) and ",
        tags$strong("AFINN"), " (scored -5 to +5) lexicons from the ",
        tags$code("tidytext"), " package."
      ),
      tags$p("Built for ISA 401 at Miami University.")
    )
  ),

  # Main content: three cards
  bslib::layout_column_wrap(
    width = 1,

    # Top row: word cloud and bar chart side by side
    bslib::layout_column_wrap(
      width = 1 / 2,

      bslib::card(
        full_screen = TRUE,
        bslib::card_header(
          class = "fw-bold",
          bsicons::bs_icon("cloud"), " Word Cloud"
        ),
        bslib::card_body(
          wordcloud2Output("wordcloud", height = "350px")
        )
      ),

      bslib::card(
        full_screen = TRUE,
        bslib::card_header(
          class = "fw-bold",
          bsicons::bs_icon("bar-chart-line"), " Top 15 Words (Frequency)"
        ),
        bslib::card_body(
          plotOutput("freq_chart", height = "350px")
        )
      )
    ),

    # Bottom row: sentiment summary
    bslib::layout_column_wrap(
      width = 1 / 2,

      bslib::card(
        full_screen = TRUE,
        bslib::card_header(
          class = "fw-bold",
          bsicons::bs_icon("emoji-smile"), " Sentiment Breakdown (Bing)"
        ),
        bslib::card_body(
          bslib::layout_column_wrap(
            width = 1 / 3,
            fill = FALSE,
            bslib::value_box(
              title = "Positive Words",
              value = textOutput("n_positive"),
              showcase = bsicons::bs_icon("hand-thumbs-up-fill"),
              theme = "success"
            ),
            bslib::value_box(
              title = "Negative Words",
              value = textOutput("n_negative"),
              showcase = bsicons::bs_icon("hand-thumbs-down-fill"),
              theme = "danger"
            ),
            bslib::value_box(
              title = "Neutral Words",
              value = textOutput("n_neutral"),
              showcase = bsicons::bs_icon("dash-circle"),
              theme = "light"
            )
          ),
          plotOutput("sentiment_bar", height = "200px")
        )
      ),

      bslib::card(
        full_screen = TRUE,
        bslib::card_header(
          class = "fw-bold",
          bsicons::bs_icon("speedometer2"), " AFINN Sentiment Score"
        ),
        bslib::card_body(
          bslib::layout_column_wrap(
            width = 1 / 2,
            fill = FALSE,
            bslib::value_box(
              title = "Total Score",
              value = textOutput("afinn_total"),
              showcase = bsicons::bs_icon("calculator"),
              theme = "info"
            ),
            bslib::value_box(
              title = "Avg Score per Word",
              value = textOutput("afinn_avg"),
              showcase = bsicons::bs_icon("graph-up"),
              theme = "info"
            )
          ),
          plotOutput("afinn_words", height = "200px")
        )
      )
    )
  )
)

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------

server <- function(input, output, session) {

  # Update text area when sample is selected
  observeEvent(input$sample_choice, {
    if (input$sample_choice != "custom") {
      updateTextAreaInput(session, "custom_text",
                          value = sample_descriptions[[input$sample_choice]])
    }
  })

  # The text to analyze (reactive, triggered by button)
  analysis_text <- eventReactive(input$analyze, {
    txt <- input$custom_text
    if (is.null(txt) || trimws(txt) == "") {
      # Fall back to first sample if nothing is entered
      sample_descriptions[[1]]
    } else {
      txt
    }
  })

  # Tokenized words (removing stop words)
  tokens <- reactive({
    req(analysis_text())
    tibble(text = analysis_text()) |>
      unnest_tokens(word, text) |>
      anti_join(stop_words, by = "word") |>
      filter(str_detect(word, "^[a-z]+$"))  # keep only alphabetic tokens
  })

  # Word counts
  word_counts <- reactive({
    tokens() |>
      count(word, sort = TRUE)
  })

  # Bing sentiment
  bing_sentiment <- reactive({
    tokens() |>
      inner_join(get_sentiments("bing"), by = "word")
  })

  # AFINN sentiment
  afinn_sentiment <- reactive({
    tokens() |>
      inner_join(get_sentiments("afinn"), by = "word")
  })

  # ---- Word Cloud ----
  output$wordcloud <- renderWordcloud2({
    wc <- word_counts() |>
      filter(n >= input$min_freq) |>
      select(word, freq = n)

    if (nrow(wc) == 0) return(NULL)

    wordcloud2(wc, size = 0.7, color = "random-dark",
               backgroundColor = "white", shape = "circle")
  })

  # ---- Frequency Bar Chart ----
  output$freq_chart <- renderPlot({
    df <- word_counts() |>
      slice_max(n, n = 15) |>
      mutate(word = fct_reorder(word, n))

    if (nrow(df) == 0) return(NULL)

    ggplot(df, aes(x = n, y = word)) +
      geom_col(fill = "#C3142D", alpha = 0.85) +
      geom_text(aes(label = n), hjust = -0.2, size = 3.5) +
      labs(x = "Count", y = NULL) +
      theme_minimal(base_size = 13) +
      theme(plot.title = element_text(face = "bold")) +
      xlim(0, max(df$n) * 1.15)
  })

  # ---- Bing Sentiment Counts ----
  output$n_positive <- renderText({
    sum(bing_sentiment()$sentiment == "positive")
  })

  output$n_negative <- renderText({
    sum(bing_sentiment()$sentiment == "negative")
  })

  output$n_neutral <- renderText({
    n_total <- nrow(tokens())
    n_scored <- nrow(bing_sentiment())
    n_total - n_scored
  })

  # ---- Bing Sentiment Bar ----
  output$sentiment_bar <- renderPlot({
    df <- bing_sentiment() |>
      count(word, sentiment, sort = TRUE) |>
      group_by(sentiment) |>
      slice_max(n, n = 5) |>
      ungroup() |>
      mutate(
        contribution = ifelse(sentiment == "positive", n, -n),
        word = reorder_within(word, contribution, sentiment)
      )

    if (nrow(df) == 0) return(NULL)

    ggplot(df, aes(x = contribution, y = word, fill = sentiment)) +
      geom_col(show.legend = FALSE) +
      scale_y_reordered() +
      scale_fill_manual(values = c("positive" = "#2E7D32", "negative" = "#C3142D")) +
      facet_wrap(~sentiment, scales = "free") +
      labs(x = "Contribution", y = NULL) +
      theme_minimal(base_size = 11)
  })

  # ---- AFINN Scores ----
  output$afinn_total <- renderText({
    af <- afinn_sentiment()
    if (nrow(af) == 0) return("0")
    sum(af$value)
  })

  output$afinn_avg <- renderText({
    af <- afinn_sentiment()
    if (nrow(af) == 0) return("--")
    round(mean(af$value), 2)
  })

  # ---- AFINN Word Scores ----
  output$afinn_words <- renderPlot({
    df <- afinn_sentiment() |>
      group_by(word) |>
      summarise(total_value = sum(value), .groups = "drop") |>
      mutate(
        direction = ifelse(total_value >= 0, "positive", "negative"),
        word = fct_reorder(word, total_value)
      )

    if (nrow(df) == 0) return(NULL)

    ggplot(df, aes(x = total_value, y = word, fill = direction)) +
      geom_col(show.legend = FALSE) +
      scale_fill_manual(values = c("positive" = "#2E7D32", "negative" = "#C3142D")) +
      labs(x = "AFINN Score", y = NULL,
           subtitle = "Each word's total sentiment contribution") +
      theme_minimal(base_size = 11)
  })
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

shinyApp(ui, server)
