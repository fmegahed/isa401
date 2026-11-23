# Draws two pictures for the Quiz 03 review (exam03/img/):
#   luck.png     2,000 people each call 10 hidden red/blue cards by pure guessing: how many get all 10?
#   kmeans.png   k-means step by step on the penguins (scaled bill length and flipper length, k = 3)
# Run from games/exam-review:  "C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" make_exam03_pictures.R
library(ggplot2)
red = "#C3142D"; ink = "#1D1D1D"; grey = "#9AA3AD"
dir.create("exam03/img", recursive = TRUE, showWarnings = FALSE)
base = theme_minimal(base_size = 15) +
  theme(plot.title = element_text(face = "bold", color = ink, size = 17), plot.subtitle = element_text(color = "gray35", size = 12.5),
        panel.grid.minor = element_blank(), panel.grid.major.x = element_blank(), plot.background = element_rect(fill = "white", color = NA))

# ---- luck.png: one simulated run (seed chosen so the run matches the expected 1.95 people at 10 of 10) ----
set.seed(410)
scores = rbinom(2000, 10, 0.5)
stopifnot(sum(scores == 10) == 2)
d = data.frame(score = 0:10, n = tabulate(factor(scores, levels = 0:10), nbins = 11))
p = ggplot(d, aes(factor(score), n, fill = score == 10)) +
  geom_col(width = 0.75) +
  geom_text(aes(label = n), vjust = -0.4, size = 4.4, color = ink) +
  annotate("label", x = 9.9, y = 190, label = "2 people called\nall 10 right,\nby luck alone", color = red, fill = "white", size = 4.6, fontface = "bold") +
  annotate("segment", x = 10.3, xend = 10.95, y = 140, yend = 30, color = red, arrow = arrow(length = unit(0.18, "cm"))) +   # bar 11 is score 10
  scale_fill_manual(values = c(`FALSE` = grey, `TRUE` = red), guide = "none") +
  scale_y_continuous(expand = expansion(mult = c(0, 0.08))) +
  labs(title = "2,000 people guess 10 hidden red/blue cards", subtitle = "How many cards each one called right (one simulated run of pure guessing)",
       x = "Cards called right (out of 10)", y = "People") + base
ggsave("exam03/img/luck.png", p, width = 8.5, height = 4.6, dpi = 150, bg = "white")

# ---- kmeans.png: steps 0, 1, 2, and the result after repeating ----
pg = na.omit(palmerpenguins::penguins[, c("bill_length_mm", "flipper_length_mm")])
X = scale(as.matrix(pg)); colnames(X) = c("bill", "flipper")
k = 3
set.seed(25)
centers0 = X[sample(nrow(X), k), , drop = FALSE]
assign_to = function(C) apply(X, 1, function(x) which.min(colSums((t(C) - x)^2)))
means_of = function(a) t(sapply(1:k, function(j) colMeans(X[a == j, , drop = FALSE])))
a1 = assign_to(centers0); centers1 = means_of(a1)
C = centers1; a = a1; rounds = 1
repeat { a_new = assign_to(C); C_new = means_of(a_new); rounds = rounds + 1
         if (all(a_new == a)) { a = a_new; C = C_new; break }; a = a_new; C = C_new }
stopifnot(rounds >= 3)
cols = c("1" = "#0072B2", "2" = "#E69F00", "3" = "#009E73")
labs4 = c("0. Pick 3 starting centers", "1. Each penguin joins its nearest center", "2. Move each center to the mean of its group",
          sprintf("Repeat 1 and 2: after %d rounds, nothing moves", rounds))
pts = rbind(data.frame(X, grp = NA, panel = labs4[1]), data.frame(X, grp = a1, panel = labs4[2]),
            data.frame(X, grp = a1, panel = labs4[3]), data.frame(X, grp = a, panel = labs4[4]))
pts$panel = factor(pts$panel, labs4)
cen = rbind(data.frame(centers0, grp = 1:k, panel = labs4[1]), data.frame(centers0, grp = 1:k, panel = labs4[2]),
            data.frame(centers1, grp = 1:k, panel = labs4[3]), data.frame(C, grp = 1:k, panel = labs4[4]))
cen$panel = factor(cen$panel, labs4)
mv = data.frame(x = centers0[, 1], y = centers0[, 2], xend = centers1[, 1], yend = centers1[, 2], panel = factor(labs4[3], labs4))
p2 = ggplot(pts, aes(bill, flipper)) +
  geom_point(data = pts[is.na(pts$grp), ], color = grey, size = 1.6, alpha = 0.7) +
  geom_point(data = pts[!is.na(pts$grp), ], aes(color = factor(grp)), size = 1.6, alpha = 0.75) +
  geom_segment(data = mv, aes(x = x, y = y, xend = xend, yend = yend), inherit.aes = FALSE, color = ink, linewidth = 0.7,
               arrow = arrow(length = unit(0.16, "cm"))) +
  geom_point(data = cen, aes(fill = factor(grp)), shape = 23, size = 5, color = ink, stroke = 1.1) +
  scale_color_manual(values = cols, guide = "none") + scale_fill_manual(values = cols, guide = "none") +
  facet_wrap(~panel, ncol = 2) +
  labs(title = "k-means, step by step (k = 3)", subtitle = "Palmer penguins: bill length and flipper length, both rescaled (z-scores). Diamonds are the centers.",
       x = "Bill length (z-score)", y = "Flipper length (z-score)") +
  base + theme(strip.text = element_text(face = "bold", size = 12.5, hjust = 0, color = ink), panel.grid.major.x = element_line(color = "gray92"),
               panel.border = element_rect(fill = NA, color = "gray85"))
ggsave("exam03/img/kmeans.png", p2, width = 9, height = 7.4, dpi = 150, bg = "white")
cat("wrote exam03/img/luck.png and exam03/img/kmeans.png (k-means converged after", rounds, "rounds)\n")

# ---- lift.png: lift compares a share with the share in all baskets (Groceries; rules not used in any question) ----
data("Groceries", package = "arules")
nb = Groceries@data@Dim[2]
rr = arules::apriori(Groceries, parameter = list(support = 0.01, confidence = 0.2, minlen = 2), control = list(verbose = FALSE))
qq = arules::quality(rr); ll = arules::labels(rr)
get = function(lab) { i = which(ll == lab); stopifnot(length(i) == 1); qq[i, ] }
beer = get("{bottled beer} => {whole milk}"); butter = get("{other vegetables,butter} => {whole milk}")
p_milk = arules::itemFrequency(Groceries)[["whole milk"]]
stopifnot(nb == 9835, round(p_milk, 3) == 0.256, round(beer$confidence, 3) == 0.254, round(beer$lift, 2) == 0.99,
          round(butter$confidence, 3) == 0.574, round(butter$lift, 2) == 2.24)
lev = c("All 9,835 baskets
(the baseline)",
        sprintf("Baskets with bottled beer
lift = %.3f / %.3f = %.2f", beer$confidence, p_milk, beer$lift),
        sprintf("Baskets with butter and
other vegetables
lift = %.3f / %.3f = %.2f", butter$confidence, p_milk, butter$lift))
L = data.frame(grp = factor(lev, levels = lev), share = c(p_milk, beer$confidence, butter$confidence),
               verdict = c("", "about the same as chance", "more than twice as likely"))
p3 = ggplot(L, aes(grp, share, fill = grp)) +
  geom_col(width = 0.62) +
  geom_hline(yintercept = p_milk, linetype = "dashed", color = ink, linewidth = 0.6) +
  geom_text(aes(label = sprintf("%.1f%%", 100 * share)), vjust = -0.5, size = 5.4, fontface = "bold", color = ink) +
  geom_text(aes(label = verdict, color = grp), vjust = -2.6, size = 4.4, fontface = "bold") +
  scale_fill_manual(values = c(grey, "#56606B", red), guide = "none") +
  scale_color_manual(values = c(grey, "#56606B", red), guide = "none") +
  scale_y_continuous(labels = function(x) paste0(round(100 * x), "%"), limits = c(0, 0.72), expand = expansion(mult = c(0, 0))) +
  labs(title = "Share of baskets with whole milk", subtitle = "Lift = the share in these baskets / the share in all baskets (the dashed line). Groceries, 9,835 baskets.",
       x = NULL, y = NULL) + base + theme(axis.text.x = element_text(size = 12.5, color = ink, lineheight = 1.05))
ggsave("exam03/img/lift.png", p3, width = 8.5, height = 4.8, dpi = 150, bg = "white")
cat("wrote exam03/img/lift.png\n")
