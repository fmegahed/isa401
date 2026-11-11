# ISA 401: Business Intelligence & Data Visualization
## Fall 2026

ISA 401 teaches the complete business intelligence pipeline: acquiring data from anywhere (files, APIs, web scraping, and LLM-based extraction), transforming messy inputs into tidy, validated datasets in R, and turning them into insight through visualization, dashboards, and exploratory data mining. The course is taught hands-on in a lab, with AI tools (via [ChatISA](https://chatisa.fsb.miamioh.edu)) woven into how we explore, verify, and communicate with data. By the end of the semester, students build a portfolio that takes real-world data from raw source to business decision.

**On this page:** [Schedule and slides](#schedule) · [Practice site and class games](#practice-site-and-class-games) · [Repository layout](#repository-layout) · [Acknowledgments](#acknowledgments) · [Previous versions](#previous-versions)

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
| | Wed 09/09 | Data Import II: Excel, JSON, and Export | [Slides](http://fmegahed.github.io/isa401/fall2026/class05/05_data_import_apps.html) |
| **04** | Mon 09/14 | SQLite and Your First Deployed App | [Slides](http://fmegahed.github.io/isa401/fall2026/class06/06_sqlite_deployed_app.html) |
| | Wed 09/16 | Data Wrangling with dplyr | [Slides](http://fmegahed.github.io/isa401/fall2026/class07/07_data_wrangling.html) |
| **05** | Mon 09/21 | Structured Data: APIs | [Slides](http://fmegahed.github.io/isa401/fall2026/class08/08_apis.html) |
| | Wed 09/23 | Structured Data: APIs (Cont.) | [Slides](http://fmegahed.github.io/isa401/fall2026/class08/08_apis.html) |
| **06** | Mon 09/28 | Semi-Structured Data: Web Scraping I | [Slides](http://fmegahed.github.io/isa401/fall2026/class10/10_web_scraping_1.html) |
| | Wed 09/30 | Semi-Structured Data: Web Scraping II | |
| **07** | Mon 10/05 | Unstructured Data: LLM Text Extraction | [Slides](http://fmegahed.github.io/isa401/fall2026/class12/12_structured_text_extraction.html) |
| | Wed 10/07 | Tidy and Technically Correct Data | [Slides](http://fmegahed.github.io/isa401/fall2026/class13/13_tidy_data.html) |
| **08** | Mon 10/12 | **Exam 01: Data Acquisition & Transformation** | |

### Phase II: Data Visualization & Communication

| Week | Date | Topic | Slides |
|:---:|:---:|:---|:---:|
| **08** | Wed 10/14 | Fundamentals of Data Visualization | [Slides](http://fmegahed.github.io/isa401/fall2026/class15/15_fundamentals_data_viz.html) |
| **09** | Mon 10/19 | Fundamentals of Data Visualization (Cont.) | [Slides](http://fmegahed.github.io/isa401/fall2026/class16/16_grammar_of_graphics.html) |
| | Wed 10/21 | Lab: Tableau | [PDF](lectures/17_lab_tableau/17_tableau_lab.pdf) |
| **10** | Mon 10/26 | Lab: Power BI | [PDF](lectures/18_lab_powerbi/18_powerbi_lab.pdf) |
| | Wed 10/28 | Lab: AI Maps | [PDF](lectures/19_lab_ai_maps/19_ai_maps_lab.pdf) |
| **11** | Mon 11/02 | Commonly Used Charts | [Slides](http://fmegahed.github.io/isa401/fall2026/class20/20_commonly_used_charts.html) |
| | Wed 11/04 | Time Series, Spatial & Spatiotemporal Charts | [Slides](http://fmegahed.github.io/isa401/fall2026/class21/21_ts_spatial_and_spatiotemporal_charts.html) |
| **12** | Mon 11/09 | Visualizing High-Dimensional Data | [Slides](http://fmegahed.github.io/isa401/fall2026/class22/22_high_dimensional_charts.html) |
| | Wed 11/11 | Business Reporting | [Slides](http://fmegahed.github.io/isa401/fall2026/class23/23_business_reporting.html) · [After the game](http://fmegahed.github.io/isa401/fall2026/class23/23b_after_the_game.html) |
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

## Practice Site and Class Games

Ten small web apps go with the lectures. Each one runs in a browser with nothing to install, and none of them is graded.

| Class | What | What students do | Source |
|:---:|:---|:---|:---:|
| Classes 04 and 05 | [**The Import Heist**](https://isa401-import-heist.vercel.app) | Work a three-stage incident investigation in which the value read from one CSV or JSON file unlocks the next. | [`games/data-import`](games/data-import) |
| Class 05 | [**Find Your Seat**](https://isa401-find-your-seat.vercel.app) | Read a JSON file into R and pull values out of a nested list with `[[ ]]` and `$` to find their seat. | [`games/find-your-seat`](games/find-your-seat) |
| Classes 11 and 12 | [**Salvage Run**](https://isa401-salvage.vercel.app) | Scrape a registry of 400 ships spread over eight pages: pick a CSS selector, work out how the address changes, and loop over every page. | [`games/salvage-run`](games/salvage-run) |
| Class 13, and before each exam | [**ISA 401 Review**](https://isa401-review.vercel.app) | For each unit: watch a one-minute narrated recap, explain the idea in their own words and see which key ideas they covered as they type, fix R code that runs in the browser, and read real output. Each question links to real job postings that ask for the skill. | [`games/exam-review`](games/exam-review) |
| Class 16 | [**Game Day at Yager**](https://isa401-game-day.vercel.app) | Answer 14 questions on their phones, Kahoot style, from their seat on a map of FSB 2050: distortion, data-ink, data types, encodings, color, and the grammar of graphics, told with Miami RedHawks football data. Two typed answers are checked against key ideas, and each reveal shows a strong answer. | [`games/game-day`](games/game-day) |
| Class 18 | [**Press Time**](https://isa401-press-time.vercel.app) | Race for 15 minutes to build a Tableau map of COVID cases by county and a table of Ohio county populations, then submit the workbook and screenshots. AI reads the screenshots for Butler County's two numbers, and the projector shows seat maps of who got each part right. | Not in this repository |
| Class 19 | [**Map Gallery**](https://isa401-map-gallery.vercel.app) | Plan a map of Butler County's COVID experience, build it with any AI chat tool, submit a screenshot, and vote in six blind matchups between classmates' maps. A personal code brings them back to their map and results. | [`games/map-gallery`](games/map-gallery) |
| Class 20 | [**Pie on Trial**](https://isa401-pie-on-trial.vercel.app/?section=Z) | Tap the largest slice or bar on six charts, with 15 seconds each: three datasets as pies, then the same three as bars. The projector shows how the class answered, pie next to bars. | [`games/pie-on-trial`](games/pie-on-trial) |
| Class 22 (on Class 21's charts) | [**Race Call**](https://isa401-race-call.vercel.app) | Play analysts on an election-night chart desk and make their projection on 13 races from their seat on a map of FSB 2050, Kahoot style: line charts, seasonality, a calendar plot, an animated bubble chart, choropleth vs. symbol maps, color schemes, and small multiples vs. animation. Each reveal names the room's projection, then the actual winner with why. | [`games/race-call`](games/race-call) |
| Class 23 | [**Flight Plan**](https://isa401-flight-plan.vercel.app/?section=Z) | Work in seating-row teams to design a paper plane that hits an X on the whiteboard: write a shared brief with operational and product KPIs (typed or spoken), get AI feedback on whether each KPI can be measured, vote on how accuracy is scored, throw, and see every distance measured from a photo of the board. | [`games/flight-plan`](games/flight-plan) |

How the review site works, and whose ideas and tools it rests on, is on its [landing page](https://isa401-review.vercel.app) and under [Acknowledgments](#acknowledgments).

---

## Repository Layout

```
├── apps/                  # Shiny apps used in class
├── dashboards/            # Job Market Explorer (template, standalone build, data + build docs)
├── data/                  # Course datasets (Cincinnati crashes, ChatISA Job Scout, Airbnb extracts, Ohio COVID, BLS wages, Gapminder)
├── docs/                  # Canvas pages, assignments (one folder per HW), planning documents
├── figures/               # Figures used across the slide decks (TikZ sources + images)
├── games/                 # The review site and the class games (each deploys to Vercel)
├── lectures/              # xaringan slide decks, one folder per class
├── notebooklm_summaries/  # Sources for the AI recap videos and podcasts
├── old/                   # Materials from previous offerings
├── scripts/               # Data pipelines (dashboard build, data pulls and refreshes)
└── style_files/           # Shared slide theme (CSS, fonts, LaTeX preamble)
```

---

## Acknowledgments
* Phase I has benefited heavily from:
    + STATS 220 Data Technologies by [@earowang](https://github.com/earowang) (site no longer online)
    + [An Introduction to Data Cleaning with R](https://cran.r-project.org/doc/contrib/de_Jonge+van_der_Loo-Introduction_to_data_cleaning_with_R.pdf)
    + Hadley Wickham's [R For Data Science (2e)](https://r4ds.hadley.nz/) and [Advanced R](https://adv-r.hadley.nz/)
* Phase III draws from [Mining of Massive Datasets](http://www.mmds.org/)
* The review site rests on:
    + [Jeffrey Biles](https://x.com/JeffreyBiles/status/2107211222320021722) of PhysicsGraph, for the idea of checking an explanation while it is being typed
    + [Jev](https://docs.typesafe.ai) from TypeSafe AI, which checks the written answers
    + [webR](https://docs.r-wasm.org/webr/latest/), which runs R in the browser
    + [ChatISA](https://github.com/fmegahed/chatisa), whose Job Scout database supplies the job postings behind each skill tag

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
