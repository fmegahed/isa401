
# =============================================================================
# LLM-Based Structured Data Extraction Demo
# ISA 401 - Spring 2026
# =============================================================================
# This Shiny app demonstrates how LLMs can extract structured data from
# unstructured job descriptions. It uses pattern matching to simulate
# what an actual LLM API call (e.g., Claude) would return.
# =============================================================================

library(shiny)
library(bslib)
library(DT)
library(jsonlite)
library(stringr)
library(dplyr)

# =============================================================================
# 10 Sample Job Descriptions
# =============================================================================

sample_jobs <- list(

  "Data Analyst - Google" = paste0(
    "Job Title: Data Analyst\n",
    "Company: Google LLC\n",
    "Location: Mountain View, CA (Hybrid - 3 days in office)\n\n",
    "About the Role:\n",
    "We are looking for a Data Analyst to join our Google Ads team. ",
    "You will analyze large-scale advertising data to uncover insights that drive ",
    "product improvements and business strategy. The ideal candidate is passionate ",
    "about turning data into actionable recommendations and communicating findings ",
    "to both technical and non-technical stakeholders.\n\n",
    "Responsibilities:\n",
    "- Analyze advertising performance metrics and build dashboards using Looker and SQL\n",
    "- Design and evaluate A/B tests to measure the impact of product changes\n",
    "- Collaborate with product managers and engineers to define KPIs\n",
    "- Create automated reporting pipelines using Python and BigQuery\n",
    "- Present findings to senior leadership through clear visualizations\n\n",
    "Requirements:\n",
    "- Bachelor's degree in Statistics, Mathematics, Economics, or related field\n",
    "- 2-4 years of experience in data analysis or a related role\n",
    "- Proficiency in SQL, Python, and data visualization tools (Looker, Tableau)\n",
    "- Strong skills in Excel, statistical analysis, and A/B testing\n",
    "- Excellent communication and presentation skills\n\n",
    "Compensation:\n",
    "- Salary Range: $95,000 - $140,000 per year\n",
    "- Job Type: Full-time\n",
    "- Benefits include health insurance, 401(k) matching, and education stipend"
  ),

  "Data Scientist - Meta" = paste0(
    "Job Title: Data Scientist\n",
    "Company: Meta Platforms, Inc.\n",
    "Location: Menlo Park, CA (On-site)\n\n",
    "About the Role:\n",
    "Meta is seeking a Data Scientist to work on our Instagram Growth team. ",
    "You will leverage machine learning and statistical modeling to understand ",
    "user behavior, predict engagement trends, and optimize content recommendation ",
    "systems. This is a high-impact role where your analyses will directly influence ",
    "product decisions affecting billions of users worldwide.\n\n",
    "Responsibilities:\n",
    "- Build predictive models for user engagement and retention\n",
    "- Design experiments and analyze results using causal inference techniques\n",
    "- Develop ETL pipelines and work with petabyte-scale data using Spark and Presto\n",
    "- Collaborate with ML engineers to deploy models into production\n",
    "- Communicate complex findings to cross-functional teams\n\n",
    "Requirements:\n",
    "- Master's degree or Ph.D. in Computer Science, Statistics, or quantitative field\n",
    "- 3-5 years of industry experience in data science or machine learning\n",
    "- Expert-level proficiency in Python, R, SQL, and statistical modeling\n",
    "- Experience with deep learning frameworks (PyTorch, TensorFlow)\n",
    "- Strong background in experimental design, causal inference, and Bayesian methods\n\n",
    "Compensation:\n",
    "- Salary Range: $150,000 - $220,000 per year plus equity\n",
    "- Job Type: Full-time\n",
    "- Comprehensive benefits including RSUs, wellness programs, and on-site amenities"
  ),

  "Business Analyst - Deloitte" = paste0(
    "Job Title: Business Analyst\n",
    "Company: Deloitte Consulting LLP\n",
    "Location: Chicago, IL (Hybrid)\n\n",
    "About the Role:\n",
    "Deloitte is hiring a Business Analyst to support our Technology Strategy & ",
    "Transformation practice. You will work directly with Fortune 500 clients to ",
    "analyze business processes, identify inefficiencies, and recommend technology ",
    "solutions. This role combines analytical thinking with client-facing consulting ",
    "and offers rapid career growth in one of the Big Four firms.\n\n",
    "Responsibilities:\n",
    "- Gather and document business requirements through stakeholder interviews\n",
    "- Analyze current-state processes and create data-driven recommendations\n",
    "- Build financial models and ROI analyses for proposed solutions\n",
    "- Create presentations and deliverables for C-suite executives\n",
    "- Support project management activities and track deliverables\n\n",
    "Requirements:\n",
    "- Bachelor's degree in Business Administration, Information Systems, or related field\n",
    "- 1-3 years of experience in business analysis, consulting, or related role\n",
    "- Proficiency in Excel, PowerPoint, SQL, and Visio\n",
    "- Knowledge of Agile methodology, JIRA, and process mapping\n",
    "- Strong analytical, problem-solving, and communication skills\n\n",
    "Compensation:\n",
    "- Salary Range: $70,000 - $100,000 per year\n",
    "- Job Type: Full-time\n",
    "- Benefits include performance bonuses, CPA/CFA support, and travel opportunities"
  ),

  "Software Engineer - Amazon" = paste0(
    "Job Title: Software Engineer II\n",
    "Company: Amazon Web Services (AWS)\n",
    "Location: Seattle, WA (On-site)\n\n",
    "About the Role:\n",
    "Amazon Web Services is looking for a Software Engineer to join our EC2 ",
    "Networking team. You will design, build, and maintain highly scalable ",
    "distributed systems that power the world's largest cloud infrastructure. ",
    "This role requires deep technical expertise and the ability to solve complex ",
    "problems at massive scale, serving millions of customers globally.\n\n",
    "Responsibilities:\n",
    "- Design and implement microservices using Java, Python, and AWS services\n",
    "- Build and optimize distributed systems handling millions of requests per second\n",
    "- Write clean, testable, and well-documented code following best practices\n",
    "- Participate in on-call rotations and incident response\n",
    "- Mentor junior engineers and conduct code reviews\n\n",
    "Requirements:\n",
    "- Bachelor's degree in Computer Science, Software Engineering, or equivalent\n",
    "- 3-7 years of professional software development experience\n",
    "- Strong proficiency in Java, Python, C++, and distributed systems design\n",
    "- Experience with AWS, Docker, Kubernetes, and CI/CD pipelines\n",
    "- Solid understanding of data structures, algorithms, and system design\n\n",
    "Compensation:\n",
    "- Salary Range: $130,000 - $185,000 per year plus RSUs and signing bonus\n",
    "- Job Type: Full-time\n",
    "- Benefits include relocation assistance, stock vesting, and career development"
  ),

  "ML Engineer - OpenAI" = paste0(
    "Job Title: Machine Learning Engineer\n",
    "Company: OpenAI\n",
    "Location: San Francisco, CA (Remote-friendly)\n\n",
    "About the Role:\n",
    "OpenAI is hiring a Machine Learning Engineer to work on our foundation model ",
    "training infrastructure. You will help build and optimize the systems that train ",
    "our most capable AI models. This is a unique opportunity to work at the frontier ",
    "of artificial intelligence and contribute to ensuring that AGI benefits all of ",
    "humanity. You will collaborate with world-class researchers and engineers.\n\n",
    "Responsibilities:\n",
    "- Optimize large-scale distributed training pipelines across thousands of GPUs\n",
    "- Implement novel model architectures and training techniques in PyTorch\n",
    "- Build evaluation frameworks and monitoring systems for model performance\n",
    "- Collaborate with research scientists to translate papers into production code\n",
    "- Improve training efficiency, reducing costs and time-to-convergence\n\n",
    "Requirements:\n",
    "- Master's degree or Ph.D. in Computer Science, Machine Learning, or related field\n",
    "- 4-8 years of experience in machine learning engineering or ML infrastructure\n",
    "- Expert proficiency in Python, PyTorch, CUDA, and distributed computing\n",
    "- Deep understanding of transformer architectures, NLP, and deep learning\n",
    "- Experience with large-scale GPU clusters, NCCL, and model parallelism\n\n",
    "Compensation:\n",
    "- Salary Range: $200,000 - $370,000 per year plus profit participation units\n",
    "- Job Type: Full-time\n",
    "- Benefits include generous equity, unlimited PTO, and learning budget"
  ),

  "BI Developer - Microsoft" = paste0(
    "Job Title: Business Intelligence Developer\n",
    "Company: Microsoft Corporation\n",
    "Location: Redmond, WA (Hybrid - 2 days in office)\n\n",
    "About the Role:\n",
    "Microsoft is seeking a Business Intelligence Developer to join our Finance ",
    "Analytics team. You will design and develop enterprise BI solutions that ",
    "provide actionable insights to finance leaders across the organization. ",
    "This role involves building data models, creating interactive dashboards, ",
    "and optimizing our data warehouse infrastructure for reporting and analytics.\n\n",
    "Responsibilities:\n",
    "- Design and develop Power BI dashboards and reports for executive stakeholders\n",
    "- Build and maintain dimensional data models in Azure Synapse Analytics\n",
    "- Create and optimize ETL/ELT pipelines using Azure Data Factory and SSIS\n",
    "- Implement data quality checks and automated testing for BI solutions\n",
    "- Collaborate with business users to translate requirements into technical solutions\n\n",
    "Requirements:\n",
    "- Bachelor's degree in Computer Science, Information Systems, or related field\n",
    "- 2-5 years of experience in business intelligence or data warehousing\n",
    "- Strong proficiency in SQL, Power BI, DAX, and data modeling\n",
    "- Experience with Azure cloud services, SSIS, and Python scripting\n",
    "- Familiarity with dimensional modeling (Kimball methodology)\n\n",
    "Compensation:\n",
    "- Salary Range: $110,000 - $160,000 per year\n",
    "- Job Type: Full-time\n",
    "- Benefits include stock awards, ESPP, health coverage, and tuition reimbursement"
  ),

  "Data Engineer - Netflix" = paste0(
    "Job Title: Data Engineer\n",
    "Company: Netflix, Inc.\n",
    "Location: Los Gatos, CA (Remote)\n\n",
    "About the Role:\n",
    "Netflix is looking for a Data Engineer to join our Content Data Engineering ",
    "team. You will build and maintain the data infrastructure that powers content ",
    "acquisition decisions, recommendation algorithms, and studio analytics. ",
    "Our data platform processes trillions of events daily, and you will play a ",
    "critical role in ensuring data quality, reliability, and accessibility.\n\n",
    "Responsibilities:\n",
    "- Design and build scalable data pipelines using Spark, Flink, and Kafka\n",
    "- Develop and maintain data models in our Iceberg-based data lakehouse\n",
    "- Implement real-time streaming architectures for event processing\n",
    "- Build data quality monitoring and alerting frameworks\n",
    "- Optimize query performance and storage costs across petabyte-scale datasets\n\n",
    "Requirements:\n",
    "- Bachelor's or Master's degree in Computer Science or Engineering\n",
    "- 3-6 years of experience in data engineering or related backend engineering\n",
    "- Expert proficiency in Python, Scala, SQL, and Apache Spark\n",
    "- Experience with streaming technologies (Kafka, Flink) and cloud platforms (AWS)\n",
    "- Strong understanding of data modeling, warehousing, and distributed systems\n\n",
    "Compensation:\n",
    "- Salary Range: $170,000 - $250,000 per year (Netflix pays top-of-market)\n",
    "- Job Type: Full-time\n",
    "- Netflix offers a unique culture of freedom and responsibility with unlimited PTO"
  ),

  "Product Analyst - Spotify" = paste0(
    "Job Title: Product Analyst\n",
    "Company: Spotify Technology S.A.\n",
    "Location: New York, NY (Hybrid)\n\n",
    "About the Role:\n",
    "Spotify is hiring a Product Analyst to join our Premium Subscriptions team. ",
    "You will be responsible for analyzing user behavior, evaluating feature ",
    "launches, and providing data-driven insights that shape Spotify's premium ",
    "experience for over 200 million subscribers worldwide. This role bridges ",
    "the gap between data and product strategy.\n\n",
    "Responsibilities:\n",
    "- Define and track key product metrics for the Premium subscription experience\n",
    "- Design and analyze A/B tests to evaluate new features and pricing strategies\n",
    "- Build dashboards and automated reports using Looker and Google BigQuery\n",
    "- Conduct deep-dive analyses on user conversion, retention, and churn patterns\n",
    "- Partner with product managers and designers to inform the product roadmap\n\n",
    "Requirements:\n",
    "- Bachelor's degree in Statistics, Economics, Mathematics, or related field\n",
    "- 2-4 years of experience in product analytics, data analytics, or related role\n",
    "- Strong proficiency in SQL, Python, and data visualization tools\n",
    "- Experience with experimentation platforms and A/B testing methodologies\n",
    "- Excellent storytelling and communication skills for diverse audiences\n\n",
    "Compensation:\n",
    "- Salary Range: $100,000 - $145,000 per year\n",
    "- Job Type: Full-time\n",
    "- Benefits include stock options, free Spotify Premium, and flexible work hours"
  ),

  "Marketing Analyst - Nike" = paste0(
    "Job Title: Marketing Analyst\n",
    "Company: Nike, Inc.\n",
    "Location: Portland, OR (On-site)\n\n",
    "About the Role:\n",
    "Nike is looking for a Marketing Analyst to join our Digital Marketing ",
    "Analytics team. You will measure and optimize marketing campaigns across ",
    "digital channels, develop attribution models, and provide insights that ",
    "maximize return on ad spend. This role sits at the intersection of marketing ",
    "strategy and data science, helping Nike connect with athletes worldwide.\n\n",
    "Responsibilities:\n",
    "- Analyze digital marketing campaign performance across paid, owned, and earned media\n",
    "- Build multi-touch attribution models to measure marketing effectiveness\n",
    "- Create weekly and monthly marketing performance dashboards in Tableau\n",
    "- Conduct customer segmentation analysis using clustering techniques\n",
    "- Collaborate with media agencies and creative teams to optimize spend allocation\n\n",
    "Requirements:\n",
    "- Bachelor's degree in Marketing, Statistics, Business Analytics, or related field\n",
    "- 2-4 years of experience in marketing analytics or digital analytics\n",
    "- Proficiency in SQL, Python or R, Tableau, and Google Analytics\n",
    "- Experience with marketing mix modeling, attribution, and customer segmentation\n",
    "- Knowledge of digital marketing platforms (Google Ads, Meta Ads, DV360)\n\n",
    "Compensation:\n",
    "- Salary Range: $80,000 - $115,000 per year\n",
    "- Job Type: Full-time\n",
    "- Benefits include product discounts, on-site fitness center, and wellness programs"
  ),

  "Financial Analyst - JPMorgan" = paste0(
    "Job Title: Financial Analyst\n",
    "Company: JPMorgan Chase & Co.\n",
    "Location: New York, NY (Hybrid - 3 days in office)\n\n",
    "About the Role:\n",
    "JPMorgan Chase is seeking a Financial Analyst to join our Corporate & ",
    "Investment Banking division. You will support deal execution, build complex ",
    "financial models, and conduct valuation analyses for M&A transactions and ",
    "capital markets offerings. This role provides exceptional exposure to senior ",
    "bankers and high-profile transactions across multiple industries.\n\n",
    "Responsibilities:\n",
    "- Build and maintain detailed financial models (DCF, LBO, merger models)\n",
    "- Conduct industry research and competitive benchmarking analyses\n",
    "- Prepare pitch books, presentations, and memoranda for client meetings\n",
    "- Analyze financial statements and perform ratio analysis and trend identification\n",
    "- Support due diligence processes for M&A transactions\n\n",
    "Requirements:\n",
    "- Bachelor's degree in Finance, Accounting, Economics, or related field\n",
    "- 1-3 years of experience in investment banking, corporate finance, or FP&A\n",
    "- Advanced proficiency in Excel (financial modeling), PowerPoint, and Bloomberg\n",
    "- Knowledge of accounting principles (GAAP), valuation methods, and capital markets\n",
    "- Strong quantitative skills and attention to detail\n",
    "- CFA Level I or progress toward CFA preferred\n\n",
    "Compensation:\n",
    "- Salary Range: $85,000 - $120,000 per year plus performance bonus\n",
    "- Job Type: Full-time\n",
    "- Benefits include 401(k) matching, health insurance, and professional development"
  )
)

# =============================================================================
# Extraction Function (Simulated LLM)
# =============================================================================

extract_job_info <- function(text) {

  # --- Job Title ---
  job_title <- NA_character_
  # Try "Job Title:" label first

  m <- str_match(text, regex("(?:Job\\s*Title)\\s*[:.]\\s*(.+)", ignore_case = TRUE))
  if (!is.na(m[1, 2])) {
    job_title <- str_trim(m[1, 2])
  } else {
    # Try common title patterns
    title_patterns <- c(
      "Data Analyst", "Data Scientist", "Business Analyst",
      "Software Engineer", "Machine Learning Engineer", "ML Engineer",
      "Business Intelligence Developer", "BI Developer",
      "Data Engineer", "Product Analyst", "Marketing Analyst",
      "Financial Analyst", "Research Scientist", "Analytics Engineer",
      "DevOps Engineer", "Cloud Engineer", "Full Stack Developer",
      "Frontend Engineer", "Backend Engineer", "UX Researcher",
      "Project Manager", "Product Manager", "Consultant"
    )
    for (tp in title_patterns) {
      if (grepl(tp, text, ignore.case = TRUE)) {
        job_title <- tp
        break
      }
    }
  }

  # --- Company ---
  company <- NA_character_
  m <- str_match(text, regex("(?:Company|Employer|Organization)\\s*[:.]\\s*(.+)", ignore_case = TRUE))
  if (!is.na(m[1, 2])) {
    company <- str_trim(m[1, 2])
  } else {
    # Try to find well-known company names
    companies <- c(
      "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix",
      "Spotify", "OpenAI", "Anthropic", "Tesla", "Nike", "Deloitte",
      "JPMorgan", "Goldman Sachs", "McKinsey", "Accenture", "IBM",
      "Salesforce", "Adobe", "Oracle", "Uber", "Airbnb", "Stripe"
    )
    for (co in companies) {
      if (grepl(co, text, ignore.case = TRUE)) {
        company <- co
        break
      }
    }
  }

  # --- Location ---
  location <- NA_character_
  m <- str_match(text, regex("(?:Location|Based in|Office)\\s*[:.]\\s*([^\\n(]+)", ignore_case = TRUE))
  if (!is.na(m[1, 2])) {
    location <- str_trim(m[1, 2])
  } else {
    # Try city, state pattern
    m2 <- str_match(text, "([A-Z][a-z]+(?:\\s[A-Z][a-z]+)*,\\s*[A-Z]{2})")
    if (!is.na(m2[1, 1])) {
      location <- str_trim(m2[1, 1])
    }
  }

  # --- Remote Status ---
  remote_status <- "Not specified"
  text_lower <- tolower(text)
  if (grepl("fully\\s*remote|100%\\s*remote|location:\\s*remote|\\(remote\\)", text_lower)) {
    remote_status <- "Remote"
  } else if (grepl("hybrid", text_lower)) {
    remote_status <- "Hybrid"
  } else if (grepl("on[- ]?site|in[- ]?office|in[- ]?person", text_lower)) {
    remote_status <- "On-site"
  } else if (grepl("remote[- ]?friendly|remote[- ]?optional", text_lower)) {
    remote_status <- "Remote-friendly"
  }

  # --- Required Skills ---
  # Comprehensive skill dictionary
  skill_keywords <- c(
    # Programming Languages
    "Python", "R", "SQL", "Java", "C\\+\\+", "Scala", "JavaScript",
    "TypeScript", "Go", "Rust", "Julia", "MATLAB", "SAS",
    # Data & ML
    "Spark", "Hadoop", "Kafka", "Flink", "Hive", "Presto", "Airflow",
    "dbt", "Snowflake", "Redshift", "BigQuery",
    "TensorFlow", "PyTorch", "scikit-learn", "Keras",
    "Pandas", "NumPy", "CUDA",
    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes",
    "CI/CD", "Terraform", "Jenkins",
    # BI & Visualization
    "Tableau", "Power BI", "Looker", "Excel",
    "DAX", "SSIS",
    # Databases
    "PostgreSQL", "MySQL", "MongoDB", "Cassandra", "DynamoDB",
    # Methodologies & Concepts
    "A/B testing", "statistical modeling", "machine learning",
    "deep learning", "NLP", "computer vision",
    "data modeling", "ETL", "data warehousing",
    "Agile", "JIRA", "Git",
    # Finance-specific
    "Bloomberg", "financial modeling",
    # Marketing-specific
    "Google Analytics", "Google Ads", "SEO"
  )

  found_skills <- c()
  for (sk in skill_keywords) {
    if (grepl(sk, text, ignore.case = (sk != "R" && sk != "C\\+\\+" && sk != "Go"))) {
      # Clean up regex characters for display
      clean_skill <- gsub("\\\\\\+", "+", sk)
      found_skills <- c(found_skills, clean_skill)
    }
  }
  # Special handling for "R" - require word boundary to avoid false positives
  if (grepl("\\bR\\b", text) && !"R" %in% found_skills) {
    # Check it's in a context that implies the R language
    if (grepl("\\bR,|\\bR\\b.*Python|Python.*\\bR\\b|proficiency in R|experience with R|\\bR\\b.*SQL|SQL.*\\bR\\b", text, ignore.case = TRUE)) {
      found_skills <- c(found_skills, "R")
    }
  }
  found_skills <- unique(found_skills)
  skills_str <- if (length(found_skills) > 0) paste(found_skills, collapse = ", ") else "Not specified"

  # --- Education Level ---
  education <- "Not specified"
  if (grepl("Ph\\.?D|Doctorate|Doctoral", text, ignore.case = TRUE) &&
      grepl("Master", text, ignore.case = TRUE)) {
    education <- "Master's or Ph.D."
  } else if (grepl("Ph\\.?D|Doctorate|Doctoral", text, ignore.case = TRUE)) {
    education <- "Ph.D."
  } else if (grepl("Master'?s?\\s*degree|M\\.?S\\.?\\s|MBA", text, ignore.case = TRUE)) {
    # Check if Master's is required or just preferred alongside Bachelor's
    if (grepl("Bachelor'?s?.*or.*Master|Master'?s?.*or.*Ph\\.?D", text, ignore.case = TRUE)) {
      education <- "Bachelor's (Master's preferred)"
    } else {
      education <- "Master's degree"
    }
  } else if (grepl("Bachelor'?s?\\s*degree|B\\.?S\\.?\\s|B\\.?A\\.?\\s|undergraduate", text, ignore.case = TRUE)) {
    education <- "Bachelor's degree"
  } else if (grepl("Associate'?s?\\s*degree|A\\.?S\\.?\\s", text, ignore.case = TRUE)) {
    education <- "Associate's degree"
  }

  # --- Experience Required ---
  experience <- "Not specified"
  m <- str_match(text, "(\\d+)\\s*[-\u2013to]+\\s*(\\d+)\\s*(?:\\+\\s*)?years?\\s*(?:of\\s*)?(?:experience|professional|industry)",)
  if (!is.na(m[1, 1])) {
    experience <- paste0(m[1, 2], "-", m[1, 3], " years")
  } else {
    m2 <- str_match(text, "(\\d+)\\+?\\s*years?\\s*(?:of\\s*)?(?:experience|professional|industry)")
    if (!is.na(m2[1, 1])) {
      experience <- paste0(m2[1, 2], "+ years")
    }
  }

  # --- Salary Range ---
  salary <- "Not specified"
  m <- str_match(text, "\\$([\\d,]+)\\s*[-\u2013to]+\\s*\\$([\\d,]+)")
  if (!is.na(m[1, 1])) {
    salary <- paste0("$", m[1, 2], " - $", m[1, 3])
  } else {
    m2 <- str_match(text, "\\$([\\d,]+)\\s*(?:per year|annually|/year|/yr)")
    if (!is.na(m2[1, 1])) {
      salary <- paste0("$", m2[1, 2], " per year")
    }
  }

  # --- Job Type ---
  job_type <- "Not specified"
  if (grepl("full[- ]?time", text_lower)) {
    job_type <- "Full-time"
  } else if (grepl("part[- ]?time", text_lower)) {
    job_type <- "Part-time"
  } else if (grepl("contract|contractor|freelance", text_lower)) {
    job_type <- "Contract"
  } else if (grepl("internship|intern\\b", text_lower)) {
    job_type <- "Internship"
  }

  # Return as a named list
  list(
    "Job Title"          = job_title %||% "Not specified",
    "Company"            = company %||% "Not specified",
    "Location"           = location %||% "Not specified",
    "Remote Status"      = remote_status,
    "Required Skills"    = skills_str,
    "Education Level"    = education,
    "Experience Required" = experience,
    "Salary Range"       = salary,
    "Job Type"           = job_type
  )
}

# =============================================================================
# UI
# =============================================================================

ui <- page_sidebar(
  title = "LLM Structured Data Extraction Demo",
  theme = bs_theme(
    version = 5,
    bootswatch = "flatly",
    primary = "#2c3e50"
  ),

  sidebar = sidebar(
    width = 400,
    title = "Input",

    selectInput(
      "sample_select",
      label = "Choose a sample job description:",
      choices = c("-- Paste your own below --" = "", names(sample_jobs))
    ),

    textAreaInput(
      "job_text",
      label = "Job Description Text:",
      placeholder = "Paste a job description here, or select a sample above...",
      rows = 14,
      width = "100%"
    ),

    actionButton(
      "extract_btn",
      label = "Extract Information",
      class = "btn-primary w-100 mt-2",
      icon = icon("magnifying-glass")
    ),

    hr(),

    tags$p(
      class = "text-muted small",
      tags$strong("Note:"),
      "This demo uses pattern matching to simulate LLM extraction.",
      "In class, we'll connect to the actual Claude API."
    )
  ),

  # Main panel content
  layout_columns(
    col_widths = 12,

    card(
      card_header(
        class = "bg-primary text-white",
        "Extracted Structured Data"
      ),
      card_body(
        DT::dataTableOutput("results_table")
      )
    ),

    layout_columns(
      col_widths = c(6, 6),

      card(
        card_header(
          class = "bg-dark text-white",
          "Equivalent JSON Output"
        ),
        card_body(
          verbatimTextOutput("json_output")
        )
      ),

      card(
        card_header(
          class = "bg-dark text-white",
          "Equivalent R Code (Claude API)"
        ),
        card_body(
          verbatimTextOutput("r_code_output")
        )
      )
    )
  )
)

# =============================================================================
# Server
# =============================================================================

server <- function(input, output, session) {

  # When a sample is selected, populate the text area
  observeEvent(input$sample_select, {
    if (input$sample_select != "") {
      updateTextAreaInput(
        session, "job_text",
        value = sample_jobs[[input$sample_select]]
      )
    }
  })

  # Reactive value to hold extraction results
  extracted <- reactiveVal(NULL)

  # Extract button click
  observeEvent(input$extract_btn, {
    req(nchar(str_trim(input$job_text)) > 0)
    result <- extract_job_info(input$job_text)
    extracted(result)
  })

  # Render the results table
  output$results_table <- DT::renderDataTable({
    req(extracted())
    result <- extracted()

    df <- data.frame(
      Field = names(result),
      Value = unlist(result),
      stringsAsFactors = FALSE,
      row.names = NULL
    )

    DT::datatable(
      df,
      options = list(
        dom = "t",
        paging = FALSE,
        searching = FALSE,
        ordering = FALSE,
        columnDefs = list(
          list(width = "200px", targets = 0),
          list(width = "auto", targets = 1)
        )
      ),
      rownames = FALSE,
      class = "table table-striped table-hover"
    )
  })

  # Render JSON output
  output$json_output <- renderText({
    req(extracted())
    result <- extracted()
    jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
  })

  # Render R code example
  output$r_code_output <- renderText({
    req(extracted())
    paste0(
      '# Install the ellmer package (if not already installed)\n',
      '# install.packages("ellmer")\n',
      'library(ellmer)\n',
      '\n',
      '# Define the structured output schema\n',
      'type_job <- type_object(\n',
      '  job_title          = type_string("The job title"),\n',
      '  company            = type_string("The company name"),\n',
      '  location           = type_string("City and state"),\n',
      '  remote_status      = type_enum(\n',
      '    "Remote work status",\n',
      '    values = c("Remote", "Hybrid", "On-site", "Not specified")\n',
      '  ),\n',
      '  required_skills    = type_string("Comma-separated list of skills"),\n',
      '  education_level    = type_string("Minimum education required"),\n',
      '  experience_required = type_string("Years of experience required"),\n',
      '  salary_range       = type_string("Salary range if mentioned"),\n',
      '  job_type           = type_enum(\n',
      '    "Employment type",\n',
      '    values = c("Full-time", "Part-time", "Contract", "Internship")\n',
      '  )\n',
      ')\n',
      '\n',
      '# Create a Claude chat object\n',
      'chat <- chat_claude(model = "claude-sonnet-4-20250514")\n',
      '\n',
      '# Extract structured data from the job description\n',
      'job_text <- "...paste job description here..."\n',
      '\n',
      'result <- chat$extract_data(\n',
      '  job_text,\n',
      '  type = type_job\n',
      ')\n',
      '\n',
      '# result is a data frame with one row\n',
      'print(result)\n',
      '\n',
      '# Convert to JSON\n',
      'jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)\n'
    )
  })
}

# =============================================================================
# Run the App
# =============================================================================

shinyApp(ui, server)
