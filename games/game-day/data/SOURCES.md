# Data sources for Game Day at Yager

Every row in these files carries a `source_url`. The football files were compiled on 2026-10-18 from
miamiredhawks.com (box scores, schedules, stats, roster) and the 2026 Football Record Book; only rows
with a `source_url` were copied here. `make_charts.R` reads these files, draws `charts/*.svg`, and writes
`computed.json`, which holds every number used in a prompt or option (with `stopifnot()` guards).

| File | What it holds | Source | Used in |
|---|---|---|---|
| `examples.csv` | Values printed on three outside charts, redrawn in ggplot2 (no images copied) | Fox: Pew Research Center (2019) https://www.pewresearch.org/religion/2019/10/17/in-u-s-decline-of-christianity-continues-at-rapid-pace/ (77% in 2009, 65% in 2019), as drawn in https://video.foxnews.com/v/6274513508001 with a y-axis from 58. Russia/Ukraine: values on the squares chart shared at https://x.com/CedScherer/status/1498593405408059394 (original outlet unclear). Miners: Tufte, E. R. (2001), *The Visual Display of Quantitative Information*, 2nd ed., p. 54, https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/ (all 15 values read from the printed chart) | Q1, Q2, Q4 |
| `latest_game_2026.csv` | Miami 34, Akron 14, Oct 17, 2026: time of possession, rushing and passing yards, attendance, temperature | https://miamiredhawks.com/sports/football/stats/2026/akron/boxscore/20842 | Q3, Q13 |
| `scoring_by_quarter_latest_2026.csv` | Akron game points by quarter (Miami 7-10-10-7, Akron 7-0-7-0) | same box score | Q12 |
| `gamelog_2026.csv` | Seven 2026 games through Oct 17: site, result, scores, margin, attendance, kickoff temperature | per-game box scores + https://miamiredhawks.com/sports/football/schedule/2026 | Q7, Q10, Q11, Q14 |
| `roster_2025_sample.csv` | 25 sampled players, names removed (jersey, position, class year, height, weight, home state) | https://miamiredhawks.com/sports/football/roster/2025 | Q5, Q6 |
| `season_records_2010_2025.csv` | Season records; Q8 uses points per game 2021-2025 | schedule pages + 2026 Football Record Book, https://miamiredhawks.com/documents/2026/6/17/2026_FB_Record_Book.pdf (Year-By-Year Records, printed p. 57) | Q8 |
| `colors.csv` | Miami Red #C41230 (official; no tints) | https://miamioh.edu/brand/style/ | all charts |
| `facts.csv` | Cited flavor facts (Cradle of Coaches, Victory Bell, Yager) | URLs in the file | not used in the final questions |

Other sources cited in questions:
- Family Weekend, Oct 16-18, 2026 (the Akron game was its football game): https://miamioh.edu/news/2026/10/family-weekend-puts-focus-on-miami-traditions-oct-16-18.html (Q7).
- Cleveland, W. S., and McGill, R. (1984). Graphical perception. *JASA* 79(387), 531-554. https://doi.org/10.1080/01621459.1984.10478080 (Q9).
- Stevens, S. S. (1946). On the theory of scales of measurement. *Science* 103(2684), 677-680. https://doi.org/10.1126/science.103.2684.677 (Q6).

## Color vision simulation (Q11)

The right panel of `charts/redgreen.svg` is computed live in `make_charts.R` with `colorspace::deutan()`
(colorspace 2.1.3; the Machado, Oliveira and Fernandes 2009 model, severity 1,
https://doi.org/10.1109/TVCG.2009.113). It is not a precomputed image. The win green #00831C was chosen so
that its simulation (#796D28) nearly matches the simulation of Miami Red (#7C6F29); Miami Red itself is
the loss color.

## Scope notes
- 2026 figures are through the Oct 17, 2026 game (7 games, 4-3).
- Q3's chart repeats a baseline error seen in student sketches (y-axis starting well above zero), drawn with real box-score values; no student work is reproduced.
- Q4's redraw keeps the original's flaws (no axis, no zero line, tallest bars equal height across panels,
  shortest bar in each panel 30% of the tallest, the 1970 loss drawn upward) but replaces the photographs
  with plain gray bars. The exact bar heights of the original were not measured; the 30% floor is ours.
