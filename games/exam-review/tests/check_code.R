# Checks every code task in units.json with real R: the solution must pass its check, and the
# starter code must not. Run from this folder's parent:
#   "C:/Program Files/R/R-4.6.1/bin/x64/Rscript.exe" tests/check_code.R
# The task code runs from a temporary markdowns/ folder beside a copy of data/, as on the site.
units = jsonlite::fromJSON("units.json", simplifyVector = FALSE)
root = file.path(tempdir(), "project")
dir.create(file.path(root, "markdowns"), recursive = TRUE, showWarnings = FALSE)
dir.create(file.path(root, "data"), showWarnings = FALSE)
file.copy(list.files("data", full.names = TRUE), file.path(root, "data"), overwrite = TRUE)
setwd(file.path(root, "markdowns"))
options(readr.show_col_types = FALSE, dplyr.summarise.inform = FALSE)

run_task = function(code, check) {
  env = new.env(parent = globalenv())
  ran = tryCatch({ suppressWarnings(suppressMessages(utils::capture.output(eval(parse(text = code), envir = env)))); TRUE },
                 error = function(e) FALSE)
  passed = ran && isTRUE(tryCatch(eval(parse(text = check), envir = env), error = function(e) FALSE))
  c(ran = ran, passed = passed)
}

bad = 0
for (u in units) for (s in u$steps) {
  if (s$type != "code") next
  sol = run_task(s$solution, s$check)
  start = run_task(s$starter, s$check)
  ok = sol[["passed"]] && !start[["passed"]]
  if (!ok) bad = bad + 1
  cat(sprintf("%s %-16s solution passes: %-5s  starter passes: %-5s (starter runs without error: %s)\n",
              if (ok) "ok  " else "FAIL", s$id, sol[["passed"]], start[["passed"]], start[["ran"]]))
}
cat(if (bad == 0) "\nAll code tasks behave as intended.\n" else sprintf("\n%d code task(s) need attention.\n", bad))
quit(status = bad)
