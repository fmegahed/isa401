# Charts for the Exam 02 review (exam02/charts/*.png) and the build-practice file (exam02/data/).
# Run from games/exam-review:  "C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" make_exam02_charts.R
# Real course data where it exists (attendance, season records, the Cincinnati crash file, penguins);
# everything else is simulated and says so on the chart. Each chart's stopifnot() pins the property
# its question depends on, so a change of seed or data cannot quietly break a question.

out = "exam02/charts"; dir.create(out, recursive = TRUE, showWarnings = FALSE)
dat = "exam02/data"; dir.create(dat, recursive = TRUE, showWarnings = FALSE)
course = "../../data"
red = "#C3142D"; gray = "#585E60"
th = ggplot2::theme_minimal(base_size = 15) +
  ggplot2::theme(plot.title = ggplot2::element_text(face = "bold"), plot.title.position = "plot",
                 plot.caption = ggplot2::element_text(color = gray, size = 10.5, hjust = 0), plot.caption.position = "plot",
                 panel.grid.minor = ggplot2::element_blank())
save = function(p, name, w = 8, h = 5) ggplot2::ggsave(file.path(out, paste0(name, ".png")), p, width = w, height = h, dpi = 200, bg = "white")
# a few rows of a file, drawn as a table under a chart
glimpse_table = function(rows, title) {
  g = gridExtra::tableGrob(rows, rows = NULL, theme = gridExtra::ttheme_minimal(base_size = 12, core = list(fg_params = list(hjust = 0, x = 0.04)), colhead = list(fg_params = list(hjust = 0, x = 0.04, fontface = "bold"))))
  patchwork::wrap_elements(g) + ggplot2::labs(title = title) + ggplot2::theme(plot.title = ggplot2::element_text(size = 12.5, face = "bold", color = gray))
}

# ---- 1. Honest charts: real attendance, y-axis starting at 11,000 ----------------------------------
att = readr::read_csv(file.path(course, "redhawks_home_attendance_2013_2026.csv"), show_col_types = FALSE) |>
  dplyr::filter(season >= 2021) |>
  dplyr::group_by(season) |> dplyr::summarise(avg = mean(attendance), .groups = "drop")
stopifnot(nrow(att) == 6, max(att$avg) / min(att$avg) < 1.4, (max(att$avg) - 11000) / (min(att$avg) - 11000) > 5)
p = ggplot2::ggplot(att, ggplot2::aes(factor(season), avg)) +
  ggplot2::geom_col(fill = red, width = 0.7) +
  ggplot2::coord_cartesian(ylim = c(11000, 15500), expand = FALSE) +
  ggplot2::scale_y_continuous(labels = scales::comma, breaks = seq(11000, 15500, 500)) +
  ggplot2::labs(x = NULL, y = "Average attendance per home game", title = "RedHawks football: average home attendance",
                caption = "Yager Stadium. Source: miamiredhawks.com box scores, 2021 to 2026 (2026: the four home games played so far).") + th
save(p, "honest")

# ---- 2. Encodings: real season records, five channels -------------------------------------------
sr = readr::read_csv(file.path(course, "..", "games", "game-day", "data", "season_records_2010_2025.csv"), show_col_types = FALSE) |>
  dplyr::mutate(bowl = ifelse(bowl_game == "" | is.na(bowl_game), "No", "Yes"), champ = ifelse(mac_champion == "Yes", "Yes", "No"))
stopifnot(nrow(sr) == 16, length(unique(sr$bowl)) == 2, length(unique(sr$champ)) == 2)
p = ggplot2::ggplot(sr, ggplot2::aes(ppg_for, ppg_against, size = wins, color = bowl, shape = champ)) +
  ggplot2::geom_point(alpha = 0.85) +
  ggplot2::scale_color_manual(values = c(No = "#9AA3AD", Yes = red)) +
  ggplot2::scale_shape_manual(values = c(No = 16, Yes = 17)) +
  ggplot2::scale_size(range = c(2.5, 9), breaks = c(2, 4, 6, 8, 10)) +
  ggplot2::labs(x = "Points scored per game", y = "Points allowed per game", size = "Wins", color = "Bowl game", shape = "MAC champion",
                title = "Miami football seasons, 2010 to 2025", caption = "Source: Miami football record book and miamiredhawks.com. One point per season.") + th
save(p, "encodings")

# ---- 3. Color: a qualitative palette on ordered bins (simulated garage counts) -------------------
set.seed(1505)
hours = 6:23; days = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
garage = tidyr::expand_grid(day = factor(days, levels = rev(days)), hour = hours) |>
  dplyr::mutate(weekday = !day %in% c("Sat", "Sun"),
                base = ifelse(weekday, 560 * exp(-((hour - 12.5) / 3.6)^2) + 60, 190 * exp(-((hour - 15) / 4.5)^2) + 30),
                cars = pmax(0, round(base * exp(rnorm(dplyr::n(), 0, 0.08)))),
                bin = cut(cars, c(-1, 100, 200, 300, 400, 500, Inf), labels = c("0 to 100", "100 to 200", "200 to 300", "300 to 400", "400 to 500", "Over 500")))
stopifnot(all(table(garage$bin) > 0))
qual = c("#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#A65628")   # six unrelated hues
p = ggplot2::ggplot(garage, ggplot2::aes(hour, day, fill = bin)) +
  ggplot2::geom_tile(color = "white", linewidth = 0.6) +
  ggplot2::scale_fill_manual(values = qual, drop = FALSE) +
  ggplot2::scale_x_continuous(breaks = seq(6, 22, 2), labels = c("6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm"), expand = c(0, 0)) +
  ggplot2::labs(x = NULL, y = NULL, fill = "Cars parked", title = "Cars parked in a Miami campus garage, by hour",
                caption = "Average for each hour of the week, Fall 2026. Simulated data.") + th + ggplot2::theme(panel.grid = ggplot2::element_blank())
save(p, "color")

# ---- 4. Common charts: stacked bars, the biggest growth is a middle segment (simulated) ---------
majors = c("Accountancy", "Business Analytics", "Economics", "Finance", "Marketing")
fy = tibble::tibble(year = rep(2022:2026, each = 5), major = factor(rep(majors, 5), levels = majors),
                    n = c(210, 95, 120, 260, 190,
                          216, 112, 118, 268, 186,
                          222, 131, 121, 275, 192,
                          230, 150, 117, 288, 189,
                          238, 176, 119, 297, 193))
growth = fy |> dplyr::group_by(major) |> dplyr::summarise(g = n[year == 2026] - n[year == 2022])
stopifnot(growth$major[which.max(growth$g)] == "Business Analytics", max(growth$g) > 1.8 * sort(growth$g, decreasing = TRUE)[2])
p = ggplot2::ggplot(fy, ggplot2::aes(factor(year), n, fill = major)) +
  ggplot2::geom_col(width = 0.7, position = ggplot2::position_stack(reverse = TRUE)) +
  ggplot2::scale_fill_manual(values = c("#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9")) +
  ggplot2::scale_y_continuous(labels = scales::comma, expand = ggplot2::expansion(c(0, 0.04))) +
  ggplot2::labs(x = NULL, y = "First-year students", fill = "Intended major", title = "Farmer School first-year students by intended major",
                caption = "Simulated data.") + th
save(p, "common")

# ---- 5. Time: monthly library visits with a semester rhythm (simulated) -------------------------
set.seed(2105)
months = seq(as.Date("2022-01-01"), as.Date("2026-10-01"), by = "month")
season = c(0.85, 1.05, 1.00, 1.15, 0.45, 0.20, 0.20, 0.50, 1.05, 1.10, 1.15, 0.60)
lib = tibble::tibble(month = months, visits = round((52000 + 3200 * (seq_along(months) - 1) / 12) * season[as.integer(format(months, "%m"))] * exp(rnorm(length(months), 0, 0.04))))
stopifnot(all(lib$visits[format(lib$month, "%m") %in% c("06", "07")] < 0.35 * max(lib$visits)))
p = ggplot2::ggplot(lib, ggplot2::aes(month, visits)) +
  ggplot2::geom_line(color = red, linewidth = 1) + ggplot2::geom_point(color = red, size = 1.4) +
  ggplot2::scale_y_continuous(labels = scales::comma, limits = c(0, NA)) +
  ggplot2::scale_x_date(date_breaks = "6 months", date_labels = "%b\n%Y") +
  ggplot2::labs(x = NULL, y = "Visits per month", title = "Visits to King Library, by month", caption = "January 2022 to October 2026. Simulated data.") + th
save(p, "time")

# ---- 6. Maps: alumni counts that mostly follow population (simulated counts, real populations) ---
oh = sf::st_read(file.path(course, "ohio_counties.geojson"), quiet = TRUE)
pop = readr::read_csv(file.path(course, "covid_cases_county.csv"), show_col_types = FALSE) |>
  dplyr::filter(state == "Ohio") |> dplyr::distinct(county, population) |>
  dplyr::mutate(NAME = sub(" County$", "", county)) |> dplyr::group_by(NAME) |> dplyr::summarise(population = max(population), .groups = "drop")
set.seed(1901)
rate = c(Butler = 0.012, Warren = 0.0105, Hamilton = 0.0085, Preble = 0.0095, Montgomery = 0.0065, Franklin = 0.006, Cuyahoga = 0.0045, Greene = 0.006, Clermont = 0.006)
alumni = pop |> dplyr::mutate(r = ifelse(NAME %in% names(rate), rate[NAME], 0.0018 * exp(rnorm(dplyr::n(), 0, 0.25))),
                              alumni = round(population * r), per_10k = alumni / population * 1e4)
mp = dplyr::left_join(oh, alumni, by = "NAME")
stopifnot(nrow(mp) == 88, !anyNA(mp$alumni), alumni$NAME[which.max(alumni$alumni)] == "Franklin",
          alumni$NAME[which.max(alumni$per_10k)] == "Butler", rank(-alumni$alumni)[alumni$NAME == "Butler"] >= 3)
readr::write_csv(alumni |> dplyr::select(county = NAME, population, alumni, per_10k), file.path(dat, "alumni_by_county_simulated.csv"))
p = ggplot2::ggplot(mp) + ggplot2::geom_sf(ggplot2::aes(fill = alumni), color = "white", linewidth = 0.25) +
  ggplot2::scale_fill_gradient(low = "#FBE3E6", high = "#7A0019", labels = scales::comma, name = "Alumni") +
  ggplot2::labs(title = "Miami University alumni living in each Ohio county", caption = "Simulated counts.") +
  th + ggplot2::theme(axis.text = ggplot2::element_blank(), panel.grid = ggplot2::element_blank())
save(p, "maps", w = 7, h = 7)

# ---- 7. Many variables: small multiples with free y-axes (simulated) ----------------------------
set.seed(2202)
days22 = seq(as.Date("2026-09-01"), as.Date("2026-10-31"), by = "day")
halls = c("Western Dining Commons" = 4200, "Garden Commons" = 2600, "Maplestreet Station" = 1300, "Bell Tower Place" = 380)
dine = purrr::map_dfr(names(halls), function(h) tibble::tibble(hall = h, date = days22,
  swipes = round(halls[[h]] * ifelse(lubridate::wday(days22) %in% c(1, 7), 0.72, 1) * exp(rnorm(length(days22), 0, 0.07))))) |>
  dplyr::mutate(hall = factor(hall, levels = c("Bell Tower Place", "Garden Commons", "Maplestreet Station", "Western Dining Commons")))
m = tapply(dine$swipes, dine$hall, mean); stopifnot(max(m) / min(m) > 9)
p = ggplot2::ggplot(dine, ggplot2::aes(date, swipes)) + ggplot2::geom_line(color = red, linewidth = 0.7) +
  ggplot2::facet_wrap(~hall, scales = "free_y") +
  ggplot2::scale_y_continuous(labels = scales::comma) + ggplot2::scale_x_date(date_labels = "%b %d", date_breaks = "3 weeks") +
  ggplot2::labs(x = NULL, y = "Meal swipes per day", title = "Daily meal swipes at four Miami dining halls", caption = "September and October 2026. Simulated data.") +
  th + ggplot2::theme(strip.text = ggplot2::element_text(face = "bold", size = 13))
save(p, "many", w = 9, h = 5.5)

# ---- 8a. Is the data right? Weekend zeros: requests dated when staff process them (simulated) ----
set.seed(1808)
dd = seq(as.Date("2026-08-24"), as.Date("2026-11-01"), by = "day")
wd = lubridate::wday(dd, week_start = 1)               # 1 = Monday ... 7 = Sunday
true_req = rpois(length(dd), 36)                        # what students actually submit, every day
logged = ifelse(wd >= 6, 0, true_req)
for (i in which(wd == 1 & seq_along(dd) > 2)) logged[i] = true_req[i] + true_req[i - 1] + true_req[i - 2]   # Monday holds the weekend
req = tibble::tibble(date = dd, requests = logged)
stopifnot(all(req$requests[wd >= 6] == 0), mean(req$requests[wd == 1][-1]) > 2.4 * mean(req$requests[wd %in% 2:5]))
p = ggplot2::ggplot(req, ggplot2::aes(date, requests)) + ggplot2::geom_col(fill = red, width = 0.8) +
  ggplot2::scale_x_date(date_breaks = "1 week", date_labels = "%b %d") + ggplot2::scale_y_continuous(expand = ggplot2::expansion(c(0, 0.05))) +
  ggplot2::labs(x = NULL, y = "Requests", title = "Maintenance requests per day, Miami residence halls",
                caption = "August 24 to November 1, 2026. Simulated data.") + th + ggplot2::theme(axis.text.x = ggplot2::element_text(angle = 45, hjust = 1, size = 10))
save(p, "dataright_weekend", w = 9, h = 5)

# ---- 8b. Counted many times: a campus enrollment summed once per course section (simulated) -----
set.seed(1818)
campus = tibble::tibble(campus = c("Oxford", "Hamilton", "Middletown"), enrolled = c(19240, 3390, 2310), sections = c(3105, 520, 410))
sections = purrr::pmap_dfr(campus, function(campus, enrolled, sections) tibble::tibble(campus = campus, campus_enrollment = enrolled, n = seq_len(sections))) |>
  dplyr::mutate(subject = sample(c("ISA", "ACC", "ENG", "MTH", "BIO", "PSY", "FIN", "ECO", "STA", "MKT"), dplyr::n(), TRUE),
                course = paste(subject, sample(101:499, dplyr::n(), TRUE)),
                section_id = sprintf("%s-%05d", toupper(substr(campus, 1, 1)), dplyr::row_number())) |>
  dplyr::select(section_id, campus, course, campus_enrollment)
tot = sections |> dplyr::group_by(campus) |> dplyr::summarise(students = sum(campus_enrollment), .groups = "drop") |>
  dplyr::mutate(campus = factor(campus, levels = c("Oxford", "Hamilton", "Middletown")))
stopifnot(tot$students[tot$campus == "Oxford"] > 5e7)
readr::write_csv(sections, file.path(dat, "course_sections_fall2026_simulated.csv"))
bars = ggplot2::ggplot(tot, ggplot2::aes(campus, students)) + ggplot2::geom_col(fill = red, width = 0.6) +
  ggplot2::geom_text(ggplot2::aes(label = scales::comma(students)), vjust = -0.4, size = 4.6) +
  ggplot2::scale_y_continuous(labels = scales::label_comma(), expand = ggplot2::expansion(c(0, 0.12))) +
  ggplot2::labs(x = NULL, y = "Students", title = "Students enrolled by Miami campus, Fall 2026", caption = "Simulated data.") + th
rows = sections |> dplyr::filter(campus == "Oxford") |> head(5) |> dplyr::mutate(campus_enrollment = scales::comma(campus_enrollment))
p = bars / glimpse_table(as.data.frame(rows), "The first rows of course_sections_fall2026.csv, the file behind the chart") + patchwork::plot_layout(heights = c(3, 1.35))
save(p, "dataright_campus", w = 8, h = 7)

# ---- 8c. What is one row? The real crash file: one row per person involved ----------------------
cr = readr::read_csv(file.path(course, "cincy_2025_crashes.csv"), show_col_types = FALSE)
days3 = c("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN")
byday = cr |> dplyr::count(dayofweek) |> dplyr::mutate(day = factor(dayofweek, levels = days3, labels = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")))
crashes = cr |> dplyr::distinct(instanceid, dayofweek) |> dplyr::count(dayofweek)
stopifnot(nrow(cr) / dplyr::n_distinct(cr$instanceid) > 1.9, byday$dayofweek[which.max(byday$n)] == "FRI")
bars = ggplot2::ggplot(byday, ggplot2::aes(day, n)) + ggplot2::geom_col(fill = red, width = 0.65) +
  ggplot2::geom_text(ggplot2::aes(label = scales::comma(n)), vjust = -0.4, size = 4.4) +
  ggplot2::scale_y_continuous(labels = scales::comma, expand = ggplot2::expansion(c(0, 0.1))) +
  ggplot2::labs(x = NULL, y = "Number of crashes", title = "Traffic crashes in Cincinnati by day of the week, 2025",
                caption = "Source: City of Cincinnati, Traffic Crash Reports (CPD). The bars count the rows of the file.") + th
pick = cr |> dplyr::add_count(instanceid, name = "k") |> dplyr::filter(k == 3) |> head(3)
pick = dplyr::bind_rows(pick, cr |> dplyr::add_count(instanceid, name = "k") |> dplyr::filter(k == 2, !instanceid %in% pick$instanceid) |> head(2))
rows = pick |> dplyr::transmute(instanceid = paste0(substr(instanceid, 1, 8), "..."), crashdate = substr(crashdate, 1, 16), dayofweek, typeofperson, age = ifelse(is.na(age), "", age))
p = bars / glimpse_table(as.data.frame(rows), "Five rows of cincy_2025_crashes.csv, the file behind the chart") + patchwork::plot_layout(heights = c(3, 1.4))
save(p, "dataright_crashes", w = 8, h = 7)
jsonlite::write_json(list(rows = nrow(cr), crashes = dplyr::n_distinct(cr$instanceid), fri_rows = byday$n[byday$dayofweek == "FRI"],
                          fri_crashes = crashes$n[crashes$dayofweek == "FRI"]), file.path(dat, "crash_numbers.json"), auto_unbox = TRUE)

# ---- 8d. The AI describes what it expects: penguins with the relationship reversed --------------
pg = datasets::penguins |> dplyr::filter(!is.na(flipper_len), !is.na(body_mass)) |>
  dplyr::mutate(body_mass_shown = max(body_mass) + min(body_mass) - body_mass)   # altered for this example: heavier is drawn lighter
stopifnot(cor(pg$flipper_len, pg$body_mass) > 0.8, cor(pg$flipper_len, pg$body_mass_shown) < -0.8)
p = ggplot2::ggplot(pg, ggplot2::aes(flipper_len, body_mass_shown, color = species)) + ggplot2::geom_point(size = 2.2, alpha = 0.8) +
  ggplot2::scale_color_manual(values = c(Adelie = "#FF8C00", Chinstrap = "#A034F0", Gentoo = "#159090")) +
  ggplot2::scale_y_continuous(labels = scales::comma) +
  ggplot2::labs(x = "Flipper length (mm)", y = "Body mass (g)", color = "Species", title = "Palmer penguins: flipper length and body mass",
                caption = "Data: the penguins dataset in R (datasets::penguins).") + th
save(p, "dataright_penguins")

# ---- 9. Build practice: Rec Center visits, one row per visit (simulated) ------------------------
set.seed(1717)
fac = c("Main gym" = 0.31, "Fitness studios" = 0.24, "Pool" = 0.14, "Climbing wall" = 0.08, "Courts" = 0.23)
who = c("Undergraduate" = 0.78, "Graduate" = 0.12, "Faculty or staff" = 0.10)
n = 2400
visits = tibble::tibble(visit_id = sprintf("V%05d", 1:n),
                        date = sort(sample(seq(as.Date("2026-09-01"), as.Date("2026-10-31"), by = "day"), n, TRUE)),
                        facility = sample(names(fac), n, TRUE, fac),
                        visitor_type = sample(names(who), n, TRUE, who)) |>
  dplyr::mutate(minutes = round(pmax(10, rlnorm(n, log(c("Undergraduate" = 62, "Graduate" = 55, "Faculty or staff" = 41)[visitor_type]), 0.38))))
readr::write_csv(visits, file.path(dat, "rec_center_visits_fall2026.csv"))
key = list(by_facility = as.list(table(visits$facility)[order(-table(visits$facility))]),
           median_minutes = as.list(tapply(visits$minutes, visits$visitor_type, median)))
stopifnot(names(key$by_facility)[1] == "Main gym", key$median_minutes[["Undergraduate"]] > key$median_minutes[["Faculty or staff"]] + 12)
jsonlite::write_json(key, file.path(dat, "rec_center_answers.json"), auto_unbox = TRUE, pretty = TRUE)
cat("charts written to", out, "\n")
