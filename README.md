# ISA 401: Business Intelligence & Data Visualization
## Spring 2026

This course teaches the complete data analytics pipeline through two parallel case studies:
- **In-Class:** Job Market Analytics — *"What skills should you develop? Where are the opportunities?"*
- **Homework:** Airbnb Market Analysis — *"What drives pricing and success in short-term rentals?"*

### Course Structure
- **Phase 1: Data Acquisition & Transformation** — Get data from anywhere (files, APIs, web scraping, LLMs), clean it, and make it analysis-ready using R.
- **Phase 2: Data Visualization & Communication** — Turn data into insight using Tableau, Power BI, Flourish, and R. Learn to tell stories with data.
- **Phase 3: Exploratory Data Mining** — Use unsupervised learning (clustering, dimensionality reduction) to discover hidden patterns.

---

## Schedule — Spring 2026

**Class Times:** Mondays & Wednesdays | **Spring Break:** March 23-29

---

### PHASE 1: DATA ACQUISITION & TRANSFORMATION

| Week | Date | Topic | In-Class Activities (Job Market Data) | Homework (Airbnb Data) |
|:---:|:---:|:---|:---|:---|
| **01** | Mon 01/26 | **The Modern Data Landscape** | Demo finished dashboard; brainstorm job market questions; map data sources to data types | **HW01:** Explore Inside Airbnb; brainstorm 5 questions; map to data types |
| | Wed 01/28 | **R Foundations + Reproducibility** | Set up R project; load sample job postings CSV; basic exploration; initialize Git | **HW02:** Download Airbnb data for chosen city; create project structure; initial exploration; Git commit |
| **02** | Mon 02/02 | **Structured Data: Files** | Import BLS wage data (CSV); import O*NET skills (Excel); join by occupation code | **HW03:** Download calendar.csv and neighbourhoods.csv; join to listings; calculate price by neighborhood |
| | Wed 02/04 | **Structured Data: APIs** | Query BLS API for wage trends; query USAJobs API; parse JSON to data frames | **HW04:** Use Nominatim API to geocode neighborhoods; reverse geocode listing coordinates |
| **03** | Mon 02/09 | **Semi-Structured Data: Web Scraping I** | Scrape single USAJobs posting; use `rvest` for HTML parsing; handle missing fields | **HW05:** Scrape sample Airbnb listing HTML; extract title, price, bedrooms, host name |
| | Wed 02/11 | **Semi-Structured Data: Web Scraping II** | Build reusable scraping function; scrape 50 postings with `purrr::map()`; polite delays | **HW06:** Apply scraping function to 20 sample pages; error handling with `possibly()` |
| **04** | Mon 02/16 | **Unstructured Data: LLM Text Extraction** | Use Claude/GPT API to extract skills, experience, salary from job descriptions; compare to regex | **HW07:** Extract amenities, house rules, host style from Airbnb descriptions via LLM |
| | Wed 02/18 | **Unstructured Data: Images & Documents** | Extract data from job posting PDFs; analyze salary infographics with vision API | **HW08:** Analyze listing photos with vision API; extract property type, quality, visible amenities |
| **05** | Mon 02/23 | **Transformation: Tidy Data** | Reshape BLS wide→long; separate location fields; normalize job-skills relationship table | **HW09:** Normalize amenities (comma-separated → rows); pivot calendar data; save tidy CSVs |
| | Wed 02/25 | **Transformation: Validation** | Define validation rules; check salary bounds; standardize job titles; detect duplicates | **HW10:** Validate price>0, bedrooms>=0; standardize neighborhood names; detect duplicate listings |
| **06** | Mon 03/02 | **Transformation: Cleaning & Imputation** | Impute missing salaries from BLS; clean description text; standardize locations | **HW11:** Handle missing values; clean price field; remove HTML from descriptions |
| | Wed 03/04 | **Phase 1 Capstone: Data Pipeline** | Build end-to-end pipeline script; generate data quality report; document workflow | **HW12:** Create complete pipeline with modular scripts; README documentation; data dictionary |
| **07** | Mon 03/09 | **EXAM 1** | Covers Phase 1: Acquisition & Transformation | *No homework — exam prep* |
| | Wed 03/11 | **Fundamentals of Data Viz** | Perception principles; chart type selection; critique 5 job market charts; identify misleading visualizations | **HW13:** Find 3 Airbnb visualizations (good, mediocre, poor); analyze each; sketch redesign of poor one |

---

### PHASE 2: DATA VISUALIZATION & COMMUNICATION

| Week | Date | Topic | In-Class Activities (Job Market Data) | Homework (Airbnb Data) |
|:---:|:---:|:---|:---|:---|
| **08** | Mon 03/16 | **Tool Safari: Tableau** | Import job data; create salary box plots by occupation; build interactive filters; basic dashboard | **HW14:** Build 4 Airbnb visualizations in Tableau; create dashboard with filters |
| | Wed 03/18 | **Tool Safari: Power BI** | Import job data; recreate Tableau charts; add slicers; intro to DAX measures | **HW15:** Recreate Tableau charts in Power BI; add DAX measure (price per bedroom); compare tools |
| | | **SPRING BREAK (Mar 23-29)** | | |
| **09** | Mon 03/30 | **Tool Safari: Flourish + DataWrapper** | Create animated bar chart race (top skills by year); searchable table; embed in HTML | **HW16:** Create animated neighborhood ranking; interactive table; embed visualizations |
| | Wed 04/01 | **Visualizing Time Series** | Plot job posting volume 2020-2025; annotate COVID/recovery/AI boom; facet by industry | **HW17:** Plot price trends over time; explore seasonality; annotate key events |
| **10** | Mon 04/06 | **Visualizing Spatial Data** | Choropleth of median salary by state; dot map of job postings; interactive Leaflet map | **HW18:** Choropleth of price by neighborhood; dot map of listings colored by price; spatial clusters |
| | Wed 04/08 | **Visualizing Text Data** | Word cloud of skills; top 20 skills bar chart; skill co-occurrence network; sentiment trends | **HW19:** Word cloud of descriptions; top amenities bar chart; sentiment analysis of reviews |
| **11** | Mon 04/13 | **Visualizing High-Dimensional Data** | Parallel coordinates; radar charts; small multiples for job comparisons | **HW20:** Create high-dimensional visualization of listing features; compare property types |
| | Wed 04/15 | **Data Storytelling + Dashboards** | Build "Job Market Explorer" dashboard; add narrative elements; user testing with partner | **HW21:** Build Airbnb storytelling dashboard; narrative structure; get peer feedback |
| **12** | Mon 04/20 | **EXAM 2** | Covers Phase 2: Visualization & Communication | *No homework — exam prep* |
| | Wed 04/22 | **Data Mining Overview** | Supervised vs unsupervised; prepare job feature matrix; feature scaling; explore correlations | **HW22:** Hypothesize listing clusters; select features; scale data; explore correlations |

---

### PHASE 3: EXPLORATORY DATA MINING

| Week | Date | Topic | In-Class Activities (Job Market Data) | Homework (Airbnb Data) |
|:---:|:---:|:---|:---|:---|
| **13** | Mon 04/27 | **Clustering** | Run k-means (k=2,3,4,5); elbow/silhouette for optimal k; interpret and name clusters; visualize | **HW23:** Run k-means on Airbnb features; choose optimal k; name clusters; map clusters geographically |
| | Wed 04/29 | **Dimensionality Reduction** | Run PCA; interpret loadings; create biplot; compare PCA vs t-SNE; color by cluster | **HW24:** Run PCA and t-SNE on Airbnb features; compare visualizations; interpret structure |

---

### PHASE 4: PROJECT SYNTHESIS

| Week | Date | Topic | In-Class Activities | Homework |
|:---:|:---:|:---|:---|:---|
| **14** | Mon 05/04 | **Project Work Session** | Guided work time; instructor consultations; troubleshooting; peer feedback | -- |
| | Wed 05/06 | **Project Work Session**| Guided work time; instructor consultations; troubleshooting; peer feedback| -- |

---

## Data Sources

### Job Market Analytics (In-Class)
| Source | URL | Data Type |
|--------|-----|-----------|
| BLS OEWS | https://www.bls.gov/oes/tables.htm | Structured (CSV) |
| O*NET Database | https://www.onetcenter.org/database.html | Structured (Excel) |
| USAJobs API | https://developer.usajobs.gov/ | API (JSON) |
| USAJobs Website | https://www.usajobs.gov/ | Semi-structured (HTML) |

### Airbnb Analysis (Homework)
| Source | URL | Data Type |
|--------|-----|-----------|
| Inside Airbnb | http://insideairbnb.com/get-the-data | Structured (CSV) |
| Nominatim API | https://nominatim.openstreetmap.org/ | API (JSON) |
| Sample Listing Pages | [Provided in course materials] | Semi-structured (HTML) |
| Listing Photos | [Provided in course materials] | Unstructured (Images) |

---

## Detailed Course Materials

- **[In-Class Activities Guide](in_class_activities.md)** — Detailed prompts, code, and expected insights for each class session
- **[Homework Guide](homework_guide.md)** — Complete homework specifications with starter code and rubrics
- **[Spring 2026 Course Plan](spring2026_course_plan.md)** — Full pedagogical plan with learning objectives

---

## Acknowledgments
* Phase I has benefited heavily from:
    + [STATS 220 Data Technologies](https://stats220.earo.me/) by @earowang
    + [An Introduction to Data Cleaning with R](https://cran.r-project.org/doc/contrib/de_Jonge+van_der_Loo-Introduction_to_data_cleaning_with_R.pdf)
    + Hadley Wickham's [R For Data Science](https://r4ds.had.co.nz/) and [Advanced R](https://adv-r.hadley.nz/)
* Phase III draws from [Mining of Massive Datasets](http://www.mmds.org/)

## Previous Versions
* [Fall 2025](https://github.com/fmegahed/isa401/releases/tag/fall2025)
* [Fall 2024](https://github.com/fmegahed/isa401/releases/tag/fall2024)
* [Spring 2024](https://github.com/fmegahed/isa401/releases/tag/spring2024)
* [Fall 2023](https://github.com/fmegahed/isa401/releases/tag/fall2023)
* [Fall 2022](https://github.com/fmegahed/isa401/releases/tag/fall2022)
* [Spring 2022](https://github.com/fmegahed/isa401/releases/tag/spring2022)

## Notes
* References are provided throughout. Please submit a PR if any are missing.
* Typos/mistakes? Please let me know!
