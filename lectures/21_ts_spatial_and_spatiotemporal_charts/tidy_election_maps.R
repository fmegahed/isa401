# tidy_election_maps.R: put election-map screenshots into the Class 21 deck.
# See refresh_election_maps.md for the pages, the views and the order. Run from this folder with R 4.6.1:
#
#   Rscript tidy_election_maps.R house_shift       # newest screenshot -> figures/ts_spatial/nyt_2026_house_shift.png
#   Rscript tidy_election_maps.R                   # only trim the maps that are already saved
#
# The slide prints "Results as of <time>" from the file's time stamp, so the copy keeps the time the
# screenshot was taken (not the time this script ran).

# The House district map and the Ohio governor map are live ABC News embeds, so they need no screenshot.
slots = c(house_cartogram = "guardian_2026_house_cartogram.png",  # the Guardian's House cartogram (taken 5:40 AM ET, Nov 4)
          house_shift     = "nyt_2026_house_shift.png")           # optional: NYT 'Shift from 2024' arrows (proportional symbols)
fig_dir = "../../figures/ts_spatial"

tidy = function(f) {
  t0 = file.mtime(f)
  img = magick::image_read(f) |>
    magick::image_trim(fuzz = 8) |>
    magick::image_border("white", "14x14")
  if (magick::image_info(img)$width > 1800) img = magick::image_scale(img, "1800")
  magick::image_write(img, f, format = "png")
  Sys.setFileTime(f, t0)
  cat("tidied", basename(f), "| as of", format(t0, tz = "America/New_York", usetz = TRUE), "\n")
}

args = commandArgs(TRUE)
if (length(args) == 1) {
  stopifnot("unknown slot; use one of the names in `slots`" = args %in% names(slots))
  shot_dirs = file.path(Sys.getenv("USERPROFILE"), c("Pictures/Screenshots", "OneDrive/Pictures/Screenshots",
                                                     "OneDrive - Miami University/Pictures/Screenshots"))
  shots = list.files(shot_dirs[dir.exists(shot_dirs)], pattern = "[.]png$", full.names = TRUE)
  stopifnot("no screenshots found; save the snip as PNG into figures/ts_spatial by hand" = length(shots) > 0)
  newest = shots[which.max(file.mtime(shots))]
  dest = file.path(fig_dir, slots[[args]])
  file.copy(newest, dest, overwrite = TRUE, copy.date = TRUE)
  cat("copied", basename(newest), "->", dest, "\n")
}

for (f in file.path(fig_dir, slots)) if (file.exists(f)) tidy(f)
