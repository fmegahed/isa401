# ISA 401: Business Intelligence & Data Visualization
## Fall 2026

ISA 401 teaches the complete business intelligence pipeline: acquiring data from anywhere (files, APIs, web scraping, and LLM-based extraction), transforming messy inputs into tidy, validated datasets in R, and turning them into insight through visualization, dashboards, and exploratory data mining. The course is taught hands-on in a lab, with AI tools (via [ChatISA](https://chatisa.fsb.miamioh.edu)) woven into how we explore, verify, and communicate with data. By the end of the semester, students build a portfolio that takes real-world data from raw source to business decision.

---

## Source Structure

```
├── apps/                  # Shiny apps used in class
├── dashboards/            # Job Market Explorer (template, standalone build, data + build docs)
├── data/                  # Course datasets (Cincinnati crashes, ChatISA Job Scout, Airbnb extracts)
├── docs/                  # Canvas pages, assignments (one folder per HW), planning documents
├── figures/               # Figures used across the slide decks (TikZ sources + images)
├── lectures/              # xaringan slide decks, one folder per class
├── notebooklm_summaries/  # Sources for the AI recap videos and podcasts
├── old/                   # Materials from previous offerings
├── scripts/               # Data pipelines (dashboard build, data pulls and refreshes)
└── style_files/           # Shared slide theme (CSS, fonts, LaTeX preamble)
```

---

## Schedule

**Class Times:** Mondays & Wednesdays

### Phase I: Data Acquisition & Transformation

| Week | Date | Topic | Slides |
|:---:|:---:|:---|:---:|
| **01** | Mon 08/24 | Introduction to BI and Data Viz | [Slides](http://fmegahed.github.io/isa401/fall2026/class01/01_introduction.html) |
| | Wed 08/26 | Git Foundations + Reproducibility | [Slides](http://fmegahed.github.io/isa401/fall2026/class02/02_git_foundations.html) |
| **02** | Mon 08/31 | R Foundations | [Slides](http://fmegahed.github.io/isa401/fall2026/class03/03_r_foundations.html) |
| | Wed 09/02 | R Data Structures + Data Import & Export | [Slides](http://fmegahed.github.io/isa401/fall2026/class04/04_data_import_export.html) |
| **03** | Mon 09/07 | *No Class - Labor Day* | |
| | Wed 09/09 | Data Wrangling with dplyr | |
| **04** | Mon 09/14 | Structured Data: APIs | |
| | Wed 09/16 | Semi-Structured Data: Web Scraping I | |
| **05** | Mon 09/21 | Semi-Structured Data: Web Scraping II | |
| | Wed 09/23 | Semi-Structured Data: Web Scraping III | |
| **06** | Mon 09/28 | Unstructured Data: LLM Text Extraction | |
| | Wed 09/30 | Transformation: Tidy Data | |
| **07** | Mon 10/05 | Technically Correct & Consistent Data | |
| | Wed 10/07 | End-to-End Data Pipeline Example | |
| **08** | Mon 10/12 | **Exam 01: Data Acquisition & Transformation** | |

### Phase II: Data Visualization & Communication

| Week | Date | Topic | Slides |
|:---:|:---:|:---|:---:|
| **08** | Wed 10/14 | Fundamentals of Data Visualization | |
| **09** | Mon 10/19 | Fundamentals of Data Visualization (Cont.) | |
| | Wed 10/21 | Lab: Tableau + Power BI | |
| **10** | Mon 10/26 | Lab: Flourish + DataWrapper | |
| | Wed 10/28 | Commonly Used Charts | |
| **11** | Mon 11/02 | Visualizing Time Series | |
| | Wed 11/04 | Spatial & Spatiotemporal Charts | |
| **12** | Mon 11/09 | Visualizing High-Dimensional Data | |
| | Wed 11/11 | Business Reporting | |
| **13** | Mon 11/16 | **Exam 02: Data Visualization & Communication** | |

### Phase III: Exploratory Data Mining & Project Synthesis

| Week | Date | Topic | Slides |
|:---:|:---:|:---|:---:|
| **13** | Wed 11/18 | Intro to Data Mining | |
| **14** | Mon 11/23 | Clustering | |
| | Wed 11/25 | *No Class - Thanksgiving* | |
| **15** | Mon 11/30 | Project Work Session | |
| | Wed 12/02 | Project Work Session | |

---

## Acknowledgments
* Phase I has benefited heavily from:
    + STATS 220 Data Technologies by [@earowang](https://github.com/earowang) (site no longer online)
    + [An Introduction to Data Cleaning with R](https://cran.r-project.org/doc/contrib/de_Jonge+van_der_Loo-Introduction_to_data_cleaning_with_R.pdf)
    + Hadley Wickham's [R For Data Science (2e)](https://r4ds.hadley.nz/) and [Advanced R](https://adv-r.hadley.nz/)
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
