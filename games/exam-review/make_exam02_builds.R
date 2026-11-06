# Data, answers and test screenshots for the Exam 02 review's "Build it" steps (checked by code and by Jev).
# Run from games/exam-review:  "C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" make_exam02_builds.R
#   exam02/data/<file>.csv        the four practice files students download (real course data)
#   content/build_answers.json    the numbers each build is checked against (server only: content/ is never served)
#   tests/build_shots/*.png       stand-in screenshots, good and flawed, that tests/run_builds.mjs sends to Jev
# Each build practices one trap: rows that repeat a player, a skewed price, a range chart, and cancelled flights in a
# share.
library(dplyr)
course = "../../data"; dat = "exam02/data"; shots = "tests/build_shots"
dir.create(dat, showWarnings = FALSE, recursive = TRUE); dir.create(shots, showWarnings = FALSE, recursive = TRUE)
red = "#C3142D"
th = ggplot2::theme_minimal(base_size = 15) +
  ggplot2::theme(plot.title = ggplot2::element_text(face = "bold"), plot.title.position = "plot", panel.grid.minor = ggplot2::element_blank())
shot = function(p, name, w = 8, h = 5) ggplot2::ggsave(file.path(shots, paste0(name, ".png")), p, width = w, height = h, dpi = 110, bg = "white")
answers = list()

# ---- 1. NBA players by position: a traded player has a row per team plus a season-total row; one row is the league average
nba = readr::read_csv(file.path(course, "nba_per_game26.csv"), show_col_types = FALSE)
readr::write_csv(nba, file.path(dat, "nba_per_game_2025_26.csv"), na = "")
players = nba |> filter(Player != "League Average", !is.na(Pos)) |> distinct(Player, .keep_all = TRUE)
by_pos = players |> count(Pos, sort = TRUE)
rows_c = sum(nba$Pos == "C", na.rm = TRUE); dist_c = by_pos$n[by_pos$Pos == "C"]
traded = nba |> count(Player) |> filter(n > 1, Player != "League Average") |> nrow()
stopifnot(dist_c == 107, rows_c == 141, traded == 70)
answers[["x2-build-nba"]] = list(list(id = "centers", answer = dist_c, tol = 0, wrong = list(list(value = rows_c, tol = 0))))
p = ggplot2::ggplot(by_pos, ggplot2::aes(reorder(Pos, n), n)) + ggplot2::geom_col(fill = red) + ggplot2::coord_flip() +
  ggplot2::geom_text(ggplot2::aes(label = n), hjust = -0.2) + ggplot2::labs(title = "NBA Players by Position, 2025-26", x = NULL, y = "Players") + th
shot(p, "nba_good")
p = ggplot2::ggplot(nba |> filter(!is.na(Pos)) |> count(Pos), ggplot2::aes(Pos, n)) + ggplot2::geom_col(fill = c("#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f")) + th +
  ggplot2::labs(x = NULL, y = NULL)
shot(p, "nba_unsorted_no_title")
p = ggplot2::ggplot(by_pos, ggplot2::aes("", n, fill = Pos)) + ggplot2::geom_col(width = 1) + ggplot2::coord_polar("y") + ggplot2::theme_void(base_size = 15) +
  ggplot2::labs(title = "NBA Players by Position")
shot(p, "nba_pie")

# ---- 2. Columbus Airbnb: one row per listing; prices are skewed, so the median and the mean differ a lot -----------------
air = readr::read_csv(file.path(course, "midwest_airbnb.csv"), show_col_types = FALSE) |>
  filter(city == "Columbus") |> select(id, neighbourhood, latitude, longitude, room_type, accommodates, bedrooms, price)
readr::write_csv(air, file.path(dat, "columbus_airbnb_2026.csv"), na = "")
ent = air$price[air$room_type == "Entire home/apt"]
med = median(ent); avg = round(mean(ent), 2); n_priv = sum(air$room_type == "Private room")
stopifnot(nrow(air) == 2587, med == 208, n_priv == 429)
answers[["x2-build-airbnb"]] = list(list(id = "median_entire", answer = med, tol = 0.5, wrong = list(list(value = avg, tol = 1))),
                                    list(id = "private_rooms", answer = n_priv, tol = 0))
p = ggplot2::ggplot(air, ggplot2::aes(longitude, latitude, color = room_type)) + ggplot2::geom_point(size = 1, alpha = 0.7) +
  ggplot2::coord_quickmap() + ggplot2::labs(title = "Airbnb Listings in Columbus by Room Type", color = "Room type", x = NULL, y = NULL) + th
shot(p, "airbnb_good")
p = ggplot2::ggplot(air |> count(room_type), ggplot2::aes(reorder(room_type, n), n)) + ggplot2::geom_col(fill = red) + ggplot2::coord_flip() +
  ggplot2::labs(title = "Columbus Listings by Room Type", x = NULL, y = "Listings") + th
shot(p, "airbnb_bar_not_map")
p = ggplot2::ggplot(air, ggplot2::aes(longitude, latitude)) + ggplot2::geom_point(size = 1, alpha = 0.5, color = "gray30") +
  ggplot2::coord_quickmap() + ggplot2::labs(title = "Airbnb Listings in Columbus", x = NULL, y = NULL) + th
shot(p, "airbnb_map_one_color")

# ---- 3. Analytics salaries: the middle 50% (25th to 75th percentile) of pay for eight occupations -------------------------
sal = readr::read_csv(file.path(course, "oews_2025_analytics_salaries.csv"), show_col_types = FALSE)
names(sal) = c("occupation", "p25", "median", "p75")
readr::write_csv(sal, file.path(dat, "analytics_salaries_2025.csv"))
sal = sal |> mutate(spread = p75 - p25)
widest = sal |> slice_max(spread, n = 1)
stopifnot(widest$occupation == "Data Scientists", widest$spread == 73220)
answers[["x2-build-salaries"]] = list(list(id = "widest_spread", answer = widest$spread, tol = 10,
                                           wrong = list(list(value = max(sal$p75) - min(sal$p25), tol = 10))))   # top of one row minus bottom of another
s2 = sal |> mutate(occupation = reorder(occupation, median))
p = ggplot2::ggplot(s2) + ggplot2::geom_segment(ggplot2::aes(x = p25, xend = p75, y = occupation, yend = occupation), linewidth = 3, color = "#f3b6c0") +
  ggplot2::geom_point(ggplot2::aes(median, occupation), size = 3.5, color = red) + ggplot2::scale_x_continuous(labels = scales::label_dollar()) +
  ggplot2::labs(title = "Pay for Analytics Occupations, 2025", subtitle = "Bar: 25th to 75th percentile. Dot: median.", x = "Annual pay", y = NULL) + th
shot(p, "salaries_good", w = 9)
p = ggplot2::ggplot(sal, ggplot2::aes(occupation, median)) + ggplot2::geom_col(fill = red) +
  ggplot2::scale_y_continuous(labels = scales::label_dollar()) + ggplot2::labs(title = "Median Pay", x = NULL, y = NULL) + th +
  ggplot2::theme(axis.text.x = ggplot2::element_text(angle = 45, hjust = 1))
shot(p, "salaries_median_bars_only", w = 9)

# ---- 4. Late flights from Ohio airports, August 2026: cancelled and diverted flights have no arrival delay ---------------
# (The gap is small, 22.7% vs 21.6% for American, so the second number makes students find the blanks first.)
car = readr::read_csv(file.path(course, "L_UNIQUE_CARRIERS.csv"), show_col_types = FALSE)
fl = readr::read_csv(file.path(course, "T_ONTIME_August_2026.csv"), show_col_types = FALSE) |>
  filter(grepl(", OH$", ORIGIN_CITY_NAME)) |>
  left_join(car, by = c("MKT_UNIQUE_CARRIER" = "Code")) |>
  transmute(date = as.Date(lubridate::mdy_hms(FL_DATE)), airline = Description, origin = ORIGIN_CITY_NAME, destination = DEST_CITY_NAME,
            dep_delay_min = DEP_DELAY, arr_delay_min = ARR_DELAY)
readr::write_csv(fl, file.path(dat, "ohio_flights_august_2026.csv"), na = "")
late = fl |> filter(!is.na(arr_delay_min)) |> group_by(airline) |> summarise(n = n(), share = mean(arr_delay_min >= 15), .groups = "drop")
aa = fl |> filter(airline == "American Airlines Inc.")
aa_right = round(100 * mean(aa$arr_delay_min[!is.na(aa$arr_delay_min)] >= 15), 1)
aa_wrong = round(100 * sum(aa$arr_delay_min >= 15, na.rm = TRUE) / nrow(aa), 1)       # cancelled flights counted as on time
n_missing = sum(is.na(fl$arr_delay_min))
stopifnot(nrow(fl) == 13261, n_missing == 467, abs(aa_right - aa_wrong) >= 1)
answers[["x2-build-flights"]] = list(list(id = "no_arrival", answer = n_missing, tol = 0),
                                     list(id = "american_late", answer = aa_right, tol = 0.15, wrong = list(list(value = aa_wrong, tol = 0.15))))
p = ggplot2::ggplot(late, ggplot2::aes(reorder(airline, share), share)) + ggplot2::geom_col(fill = red) + ggplot2::coord_flip() +
  ggplot2::scale_y_continuous(labels = scales::label_percent()) +
  ggplot2::labs(title = "Share of Flights from Ohio Arriving 15+ Minutes Late, August 2026", x = NULL, y = "Flights arriving 15+ minutes late") + th
shot(p, "flights_good", w = 9)
p = ggplot2::ggplot(fl |> filter(!is.na(arr_delay_min)) |> group_by(airline) |> summarise(late = sum(arr_delay_min >= 15)), ggplot2::aes(airline, late)) +
  ggplot2::geom_col(fill = "#4e79a7") + ggplot2::labs(title = "Late Flights by Airline", x = NULL, y = "Late flights") + th +
  ggplot2::theme(axis.text.x = ggplot2::element_text(angle = 45, hjust = 1))
shot(p, "flights_counts_unsorted", w = 9)

# ---- a screenshot that is not a chart (text only), for the "is this a chart?" check --------------------------------
p = ggplot2::ggplot() + ggplot2::annotate("text", x = 0, y = 0, size = 6, lineheight = 1.2, hjust = 0,
  label = "Team meeting notes, November 5\n\n1. Finish the Tableau workbook\n2. Send the draft to the group by Friday\n3. Book a room for the presentation") +
  ggplot2::xlim(0, 3) + ggplot2::theme_void()
shot(p, "not_a_chart")

# ---- the good stand-ins double as the example the page shows after a build is done ---------------------------------
for (k in c("nba", "airbnb", "salaries", "flights"))
  file.copy(file.path(shots, paste0(k, "_good.png")), file.path("exam02/charts", paste0("build_", k, "_example.png")), overwrite = TRUE)

jsonlite::write_json(answers, "content/build_answers.json", auto_unbox = TRUE, pretty = TRUE, digits = NA)
cat("NBA centers", dist_c, "(rows", rows_c, ") | Airbnb median", med, "mean", avg, "private", n_priv,
    "| widest spread", widest$occupation, widest$spread, "| American late", aa_right, "% (wrong", aa_wrong, "%), no arrival", n_missing, "\n")
print(late |> arrange(desc(share)))
