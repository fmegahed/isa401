# Game Day at Yager: draws every chart in charts/ and computes every answer the game uses.
#   Rscript make_charts.R      (run from games/game-day)
# Writes charts/*.svg (ggplot2 + svglite, 8 x 5 in, base size 18) and data/computed.json, which
# content/questions.mjs reads for every number shown in a prompt or option. The stopifnot() guards
# check each computed answer against the value the question was written for.

d_ = function(f) utils::read.csv(file.path("data", f), stringsAsFactors = FALSE, check.names = FALSE)
miami_red = "#C41230"   # official Miami Red (data/colors.csv); no tints
gray_dark = "#585E60"
gray_mid  = "#8A8F91"
ink       = "#1B1B1B"

stopifnot(toupper(d_("colors.csv")$hex[1]) == miami_red)

th = ggplot2::theme_minimal(base_size = 18) +
  ggplot2::theme(text = ggplot2::element_text(color = ink),
                 axis.text = ggplot2::element_text(color = ink),
                 plot.title = ggplot2::element_text(face = "bold", size = 20),
                 plot.title.position = "plot",
                 panel.grid.minor = ggplot2::element_blank(),
                 plot.margin = ggplot2::margin(12, 16, 12, 12),
                 plot.background = ggplot2::element_rect(fill = "white", colour = NA),
                 panel.background = ggplot2::element_blank())

save_svg = function(p, name, w = 8, h = 5) {
  ggplot2::ggsave(file.path("charts", name), p, width = w, height = h, units = "in",
                  device = svglite::svglite, bg = "white")
}
dir.create("charts", showWarnings = FALSE)
comp = list()

ex = d_("examples.csv")

# ---- Q1 Fox: y-axis from 58 -------------------------------------------------------------------
fox = ex[ex$example == "fox", ]
base = 58
v0 = fox$value[fox$label == "2009"]; v1 = fox$value[fox$label == "2019"]
g_eff = ((v0 - base) - (v1 - base)) / (v0 - base)   # drop in drawn bar height
d_eff = (v0 - v1) / v0                               # drop in the data
lf_fox = g_eff / d_eff
trap_fox = (100 * g_eff) / (v0 - v1)                 # treating the 12-point drop as 12%
stopifnot(v0 == 77, v1 == 65, round(lf_fox, 2) == 4.05, round(trap_fox, 1) == 5.3)
comp$fox = list(v0 = v0, v1 = v1, base = base, graphic_drop = round(g_eff, 4), data_drop = round(d_eff, 4),
                lie_factor = round(lf_fox, 2), trap = round(trap_fox, 2))

p = ggplot2::ggplot(fox, ggplot2::aes(label, value)) +
  ggplot2::geom_col(fill = gray_dark, width = 0.55) +
  ggplot2::geom_text(ggplot2::aes(label = paste0(value, "%")), vjust = -0.4, size = 7, fontface = "bold") +
  ggplot2::scale_y_continuous(breaks = seq(58, 78, 4), labels = function(x) paste0(x, "%")) +
  ggplot2::coord_cartesian(ylim = c(base, 80), expand = FALSE) +
  ggplot2::labs(title = "U.S. adults who describe themselves as Christian", x = NULL, y = NULL) +
  th + ggplot2::theme(panel.grid.major.x = ggplot2::element_blank(), axis.text.x = ggplot2::element_text(size = 20))
save_svg(p, "fox.svg")

# ---- Q2 Russia vs Ukraine squares, side proportional to budget -----------------------------------
ru = ex[ex$example == "russia", ]
r = ru$value[ru$label == "Russia"]; u = ru$value[ru$label == "Ukraine"]
side_ratio = r / u; area_ratio = side_ratio^2
stopifnot(round(side_ratio, 1) == 14.0, round(area_ratio) == 197, round(sqrt(side_ratio), 1) == 3.7)
comp$russia = list(russia = r, ukraine = u, side_ratio = round(side_ratio, 2), area_ratio = round(area_ratio, 1),
                   sqrt_ratio = round(sqrt(side_ratio), 2))
sq = data.frame(country = c("Russia", "Ukraine"), xmin = c(0, r + 12), side = c(r, u))
p = ggplot2::ggplot(sq) +
  ggplot2::geom_rect(ggplot2::aes(xmin = xmin, xmax = xmin + side, ymin = 0, ymax = side), fill = gray_dark) +
  ggplot2::geom_text(ggplot2::aes(x = xmin + side / 2, y = -4, label = paste0(country, "\n$", side, "B")),
                     vjust = 1, size = 6.5, lineheight = 0.95) +
  ggplot2::coord_equal(xlim = c(-2, r + 12 + u + 10), ylim = c(-18, r + 2), clip = "off") +
  ggplot2::labs(title = "Defense budgets, 2020 (US$ billion)") +
  th + ggplot2::theme_void(base_size = 18) +
  ggplot2::theme(plot.title = ggplot2::element_text(face = "bold", size = 20, color = ink),
                 plot.title.position = "plot", plot.margin = ggplot2::margin(12, 16, 12, 12),
                 plot.background = ggplot2::element_rect(fill = "white", colour = NA),
                 panel.background = ggplot2::element_blank())
save_svg(p, "russia.svg")

# ---- Q3 time of possession, y-axis from 27:00 (the baseline error, drawn with real box-score values) ----
lg = d_("latest_game_2026.csv")
mmss = function(s) { x = as.integer(strsplit(s, ":")[[1]]); 60 * x[1] + x[2] }
fmt = function(s) sprintf("%d:%02d", s %/% 60, s %% 60)
top = data.frame(team = c("Miami", "Akron"),
                 sec = c(mmss(lg$mia_time_of_possession), mmss(lg$opp_time_of_possession)))
t_m = top$sec[1]; t_a = top$sec[2]; t0 = 27 * 60
data_ratio = t_a / t_m
drawn_ratio = (t_a - t0) / (t_m - t0)
lf_top = (drawn_ratio - 1) / (data_ratio - 1)
stopifnot(fmt(t_m) == "27:56", fmt(t_a) == "32:04", round(drawn_ratio, 2) == 5.43, round(lf_top, 1) == 29.9)
comp$possession = list(miami = fmt(t_m), akron = fmt(t_a), data_ratio = round(data_ratio, 3),
                       data_gap_pct = round(100 * (data_ratio - 1), 1), drawn_ratio = round(drawn_ratio, 2),
                       lie_factor = round(lf_top, 1), date = lg$date, opponent = lg$opponent, source_url = lg$source_url)
top$team = factor(top$team, levels = c("Miami", "Akron"))
p = ggplot2::ggplot(top, ggplot2::aes(team, sec, fill = team)) +
  ggplot2::geom_col(width = 0.55, show.legend = FALSE) +
  ggplot2::geom_text(ggplot2::aes(label = fmt(sec)), vjust = -0.4, size = 7, fontface = "bold") +
  ggplot2::scale_fill_manual(values = c(Miami = miami_red, Akron = gray_mid)) +
  ggplot2::scale_y_continuous(breaks = seq(t0, 33 * 60, 60), labels = fmt) +
  ggplot2::coord_cartesian(ylim = c(t0, 33 * 60), expand = FALSE) +
  ggplot2::labs(title = "Time of possession, Miami vs Akron, Oct 17, 2026", x = NULL, y = NULL) +
  th + ggplot2::theme(panel.grid.major.x = ggplot2::element_blank(), axis.text.x = ggplot2::element_text(size = 20))
save_svg(p, "possession.svg")

# ---- Q4 Tufte's mining company chart, redrawn without the photographs -----------------------------
mn = ex[ex$example == "miners", ]
mn$panel = factor(mn$panel, levels = c("Operating revenues", "Net income (loss)", "Exploration and development expenditures"),
                  labels = c("Operating\nrevenues", "Net income\n(loss)", "Exploration and\ndevelopment\nexpenditures"))
# As in the original: no axis, no zero line, the tallest bar of every panel drawn at the same height,
# the shortest bar of every panel still 30% of the tallest, and the loss drawn upward like a profit.
mn = do.call(rbind, lapply(split(mn, mn$panel), function(g) {
  a = abs(g$value); g$h = 0.3 + 0.7 * (a - min(a)) / (max(a) - min(a)); g }))
money = function(v) ifelse(v < 0, paste0("$(", format(abs(v), big.mark = ",", trim = TRUE), ")"), paste0("$", format(v, big.mark = ",", trim = TRUE)))
mn$lab = money(mn$value)
tallest = tapply(mn$value, mn$panel, max)
stopifnot(money(-11014) == "$(11,014)", all(tallest == c(7382599, 1647001, 1226007)),
          all(tapply(mn$h, mn$panel, max) == 1), mn$h[mn$value == -11014] > 0)
comp$miners = list(tallest = unname(as.list(money(tallest))), loss = money(-11014))
p = ggplot2::ggplot(mn, ggplot2::aes(factor(label), h)) +
  ggplot2::scale_x_discrete(labels = function(x) paste0("'", substr(x, 3, 4))) +
  ggplot2::geom_col(fill = gray_dark, width = 0.92) +
  ggplot2::geom_text(ggplot2::aes(label = lab), angle = 90, hjust = -0.06, size = 6.2) +
  ggplot2::facet_wrap(~ panel, nrow = 1) +
  ggplot2::scale_y_continuous(limits = c(0, 2.05), expand = c(0, 0)) +
  ggplot2::labs(x = NULL, y = NULL) +
  th + ggplot2::theme(axis.text.y = ggplot2::element_blank(), panel.grid = ggplot2::element_blank(),
                      strip.text = ggplot2::element_text(face = "bold", size = 17, vjust = 0),
                      axis.text.x = ggplot2::element_text(size = 15), panel.spacing = ggplot2::unit(1.2, "lines"))
save_svg(p, "miners.svg")

# The fix shown at the reveal: horizontal bars from a zero baseline on a labeled dollar axis, the
# 1970 loss to the left of zero, and every value label reading left to right.
short = function(v) { a = abs(v); s = ifelse(a >= 1e6, paste0("$", formatC(a / 1e6, format = "f", digits = 2), "M"),
                                         paste0("$", round(a / 1e3), "K")); ifelse(v < 0, paste0("-", s), s) }
mn$short = short(mn$value)
mn$year = factor(paste0("'", substr(mn$label, 3, 4)), levels = rev(paste0("'", 70:74)))
room = do.call(rbind, lapply(split(mn, mn$panel), function(g) {
  hi = max(g$value); data.frame(panel = g$panel[1], value = c(if (min(g$value) < 0) -0.75 * hi else 0, 1.75 * hi)) }))
stopifnot(short(-11014) == "-$11K", short(7382599) == "$7.38M", short(75243) == "$75K")
p = ggplot2::ggplot(mn, ggplot2::aes(value, year)) +
  ggplot2::geom_blank(data = room, ggplot2::aes(x = value), inherit.aes = FALSE) +
  ggplot2::geom_col(fill = gray_dark, width = 0.7) +
  ggplot2::geom_vline(xintercept = 0, color = ink, linewidth = 0.6) +
  ggplot2::geom_text(ggplot2::aes(label = ifelse(value < 0, paste(short, "loss"), short), hjust = ifelse(value < 0, 1.12, -0.12)), size = 5.2) +
  ggplot2::facet_wrap(~ panel, nrow = 1, scales = "free_x") +
  ggplot2::scale_x_continuous(labels = function(x) ifelse(x == 0, "0", ifelse(x >= 1e6, paste0("$", x / 1e6, "M"), paste0("$", x / 1e3, "K"))),
                              breaks = function(l) { b = pretty(c(0, l[2] / 1.75), 2); b[b >= 0] }, expand = c(0, 0)) +
  ggplot2::coord_cartesian(clip = "off") +
  ggplot2::labs(title = "Redrawn: bars start at zero, the 1970 loss goes left of zero", x = NULL, y = NULL) +
  th + ggplot2::theme(panel.grid.major.y = ggplot2::element_blank(),
                      strip.text = ggplot2::element_text(face = "bold", size = 16, hjust = 0, vjust = 0),
                      axis.text.x = ggplot2::element_text(size = 12), axis.text.y = ggplot2::element_text(size = 15),
                      panel.spacing = ggplot2::unit(1.6, "lines"), plot.title = ggplot2::element_text(face = "bold", size = 17))
save_svg(p, "miners_fix.svg")

# ---- Q5 roster table (no names) ---------------------------------------------------------------------
ro = d_("roster_2025_sample.csv")
pick = ro[ro$row_id %in% c(1, 3, 4, 5, 9, 10), ]
pick = pick[order(pick$jersey_number, pick$row_id), ]
stopifnot(nrow(pick) == 6, sum(duplicated(pick$jersey_number)) == 2)
comp$roster = list(cols = c("Jersey", "Position", "Class", "Height (in)", "Weight (lb)", "Home state"),
                   rows = lapply(seq_len(nrow(pick)), function(i) with(pick[i, ], c(as.character(jersey_number), position, class_year,
                                                                                    as.character(height_in), as.character(weight_lb), hometown_state))),
                   class_levels = sort(unique(ro$class_year)), source_url = ro$source_url[1])

# ---- Q7 ratio vs interval claims (Family Weekend game vs Holy Cross) ------------------------------------
gl = d_("gamelog_2026.csv")
ak = gl[gl$opponent == "Akron", ]; hc = gl[gl$opponent == "Holy Cross", ]
crowd_ratio = ak$attendance / hc$attendance
temp_claim = hc$temperature_f / ak$temperature_f - 1
stopifnot(ak$attendance == 18515, hc$attendance == 11126, round(crowd_ratio, 2) == 1.66,
          ak$temperature_f == 53, hc$temperature_f == 76, round(100 * temp_claim) == 43)
home = gl[gl$site == "home", ]
stopifnot(ak$attendance == max(home$attendance))
comp$stevens = list(akron_att = ak$attendance, hc_att = hc$attendance, crowd_ratio = round(crowd_ratio, 2),
                    akron_temp = ak$temperature_f, hc_temp = hc$temperature_f, temp_pct = round(100 * temp_claim),
                    akron_url = sub(" ;.*", "", ak$source_url), hc_url = sub(" ;.*", "", hc$source_url))

# ---- Q8 chartjunk: points per game by season ----------------------------------------------------------
sr = d_("season_records_2010_2025.csv")
sr = sr[sr$season >= 2021, ]
stopifnot(nrow(sr) == 5, all(abs(sr$points_for / sr$games - sr$ppg_for) < 0.06))
comp$ppg = list(seasons = sr$season, ppg = sr$ppg_for)
p = ggplot2::ggplot(sr, ggplot2::aes(season, ppg_for)) +
  ggplot2::geom_col(ggplot2::aes(x = season + 0.12, y = ppg_for - 0.5), fill = "#202020", width = 0.6) +
  ggplot2::geom_col(fill = miami_red, color = "black", linewidth = 2.2, width = 0.6) +
  ggplot2::scale_x_continuous(breaks = sr$season) +
  ggplot2::scale_y_continuous(breaks = seq(0, 30, 5), limits = c(0, 32), expand = c(0, 0)) +
  ggplot2::labs(title = "MIAMI POINTS PER GAME!!", x = NULL, y = NULL) +
  th + ggplot2::theme(panel.background = ggplot2::element_rect(fill = "#2F6B2F", color = "white", linewidth = 3),
                      panel.grid.major.y = ggplot2::element_line(color = "white", linewidth = 2.4),
                      panel.grid.major.x = ggplot2::element_blank(),
                      plot.title = ggplot2::element_text(face = "bold.italic", size = 26, hjust = 0.5),
                      axis.text = ggplot2::element_text(face = "bold", size = 18))
save_svg(p, "chartjunk.svg")

# ---- Q10 point differential range ----------------------------------------------------------------------
stopifnot(all(gl$margin == gl$miami_pts - gl$opp_pts))
comp$margin = list(min = min(gl$margin), min_opp = gl$opponent[which.min(gl$margin)],
                   max = max(gl$margin), max_opp = gl$opponent[which.max(gl$margin)])
stopifnot(comp$margin$min == -45, comp$margin$max == 38)

# ---- Q11 red/green win-loss chart and its deutan simulation -----------------------------------------------
gl$opp_f = factor(gl$opponent, levels = rev(gl$opponent))        # first game at the top
rg = c(W = "#00831C", L = miami_red)   # green chosen so its deutan simulation nearly matches Miami Red's
rg_sim = stats::setNames(colorspace::deutan(rg), names(rg))
comp$redgreen = list(original = as.list(rg), deutan = as.list(rg_sim), method = "colorspace::deutan (Machado et al. 2009 model, severity 1)")
rg_plot = function(pal, title) {
  ggplot2::ggplot(gl, ggplot2::aes(miami_pts, opp_f, fill = result)) +
    ggplot2::geom_col(width = 0.7) +
    ggplot2::scale_fill_manual(values = pal, breaks = c("W", "L"), labels = c("Win", "Loss"), name = NULL) +
    ggplot2::scale_x_continuous(expand = c(0, 0), limits = c(0, 50)) +
    ggplot2::labs(title = title, x = "Miami points", y = NULL) +
    th + ggplot2::theme(legend.position = "top", legend.justification = "left", panel.grid.major.y = ggplot2::element_blank(),
                        plot.title = ggplot2::element_text(face = "bold", size = 18))
}
p = patchwork::wrap_plots(rg_plot(rg, "As drawn"),
                          rg_plot(rg_sim, "Simulated deuteranopia") + ggplot2::theme(axis.text.y = ggplot2::element_blank()),
                          nrow = 1) +
  patchwork::plot_annotation(title = "Miami points by game, 2026", theme = th)
save_svg(p, "redgreen.svg")

# ---- Q12 fill = team: Akron game by quarter ---------------------------------------------------------------
sq4 = d_("scoring_by_quarter_latest_2026.csv")
sq4$team = factor(ifelse(sq4$team == "Miami (OH)", "Miami", sq4$team), levels = c("Miami", "Akron"))
tot = tapply(sq4$points, sq4$team, sum)
stopifnot(tot[["Miami"]] == lg$miami_pts, tot[["Akron"]] == lg$opp_pts, tot[["Miami"]] == 34, tot[["Akron"]] == 14)
comp$quarters = list(miami = sq4$points[sq4$team == "Miami"], akron = sq4$points[sq4$team == "Akron"],
                     source_url = sq4$source_url[1])
p = ggplot2::ggplot(sq4, ggplot2::aes(quarter, points, fill = team)) +
  ggplot2::geom_col(position = ggplot2::position_dodge(width = 0.8), width = 0.75) +
  ggplot2::scale_fill_manual(name = NULL, values = c(Miami = miami_red, Akron = gray_mid)) +
  ggplot2::scale_y_continuous(breaks = seq(0, 10, 2), expand = ggplot2::expansion(mult = c(0, 0.05))) +
  ggplot2::labs(title = "Points by quarter, Miami vs Akron, Oct 17, 2026", x = NULL, y = "Points") +
  th + ggplot2::theme(panel.grid.major.x = ggplot2::element_blank(), legend.position = "top", legend.justification = "left")
save_svg(p, "fill.svg")

# ---- Q13 same code, one layer changed: coord_polar --------------------------------------------------------
yd = data.frame(team = factor(rep(c("Miami", "Akron"), each = 2), levels = c("Miami", "Akron")),
                type = factor(rep(c("Rushing", "Passing"), 2), levels = c("Rushing", "Passing")),
                yards = c(lg$mia_rush_yds, lg$mia_pass_yds, lg$opp_rush_yds, lg$opp_pass_yds))
stopifnot(sum(yd$yards[yd$team == "Miami"]) == lg$mia_total_yds, sum(yd$yards[yd$team == "Akron"]) == lg$opp_total_yds,
          lg$mia_rush_yds == 324, lg$opp_pass_yds == 234)
comp$yards = list(miami_rush = lg$mia_rush_yds, miami_pass = lg$mia_pass_yds, akron_rush = lg$opp_rush_yds, akron_pass = lg$opp_pass_yds)
base_p = ggplot2::ggplot(yd, ggplot2::aes(x = "", y = yards, fill = type)) +
  ggplot2::geom_col(position = "fill", width = 0.9) +
  ggplot2::facet_wrap(~ team) +
  ggplot2::scale_fill_manual(values = c(Rushing = miami_red, Passing = gray_mid), name = NULL) +
  ggplot2::labs(x = NULL, y = NULL) + th +
  ggplot2::theme(legend.position = "bottom", strip.text = ggplot2::element_text(face = "bold", size = 18),
                 panel.grid = ggplot2::element_blank(), axis.text = ggplot2::element_blank(),
                 plot.title = ggplot2::element_text(face = "bold", size = 20))
p = patchwork::wrap_plots(base_p + ggplot2::labs(title = "Chart A"),
                          base_p + ggplot2::coord_polar(theta = "y") + ggplot2::labs(title = "Chart B"), nrow = 1) +
  patchwork::plot_annotation(title = "Share of total yards, Miami vs Akron, Oct 17, 2026", theme = th) +
  patchwork::plot_layout(guides = "collect") & ggplot2::theme(legend.position = "bottom")
save_svg(p, "coord.svg")

# ---- Q14 describe in grammar-of-graphics terms ------------------------------------------------------------
gl$conf = factor(ifelse(gl$conference_game == "Yes", "MAC", "Non-conference"), levels = c("Non-conference", "MAC"))
gl$site_f = factor(gl$site, levels = c("home", "away"))
stopifnot(all(gl$site %in% c("home", "away")), any(gl$site == "home" & gl$result == "L"), any(gl$site == "away" & gl$result == "W"))
comp$describe = list(n = nrow(gl), wins = sum(gl$result == "W"), losses = sum(gl$result == "L"),
                     opponents = gl$opponent, margins = gl$margin, sites = gl$site, conf = as.character(gl$conf))
p = ggplot2::ggplot(gl, ggplot2::aes(x = margin, y = opp_f, fill = site_f)) +
  ggplot2::geom_col(width = 0.7) +
  ggplot2::geom_vline(xintercept = 0, color = ink, linewidth = 0.6) +
  ggplot2::facet_grid(conf ~ ., scales = "free_y", space = "free_y") +
  ggplot2::scale_fill_manual(values = c(home = miami_red, away = gray_mid), name = "site") +
  ggplot2::scale_x_continuous(breaks = seq(-40, 40, 20)) +
  ggplot2::labs(title = "Miami point differential by game, 2026", x = "Miami points minus opponent points", y = NULL) +
  th + ggplot2::theme(panel.grid.major.y = ggplot2::element_blank(), legend.position = "top", legend.justification = "left",
                      strip.text.y = ggplot2::element_text(face = "bold", angle = 0, hjust = 0))
save_svg(p, "describe.svg")

jsonlite::write_json(comp, "data/computed.json", auto_unbox = TRUE, pretty = TRUE, digits = NA)
cat("charts:", paste(list.files("charts"), collapse = ", "), "\n")
