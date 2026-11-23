# Quiz 03 review code tasks: every starter must fail its check and every solution must pass it (desktop R 4.6.1;
# the page test runs the same in webR). Run from games/exam-review:  Rscript tests/check_code_exam03.R
u = jsonlite::fromJSON("units_exam03.json", simplifyVector = FALSE)
steps = unlist(lapply(u, function(x) Filter(function(s) identical(s$type, "code"), x$steps)), recursive = FALSE)
ok = TRUE
for (s in steps) {
  run = function(src) { e = new.env(); r = try(suppressWarnings(eval(parse(text = src), envir = e)), silent = TRUE)
                        isTRUE(tryCatch(eval(parse(text = s$check), envir = e), error = function(err) FALSE)) }
  sp = run(s$starter); so = run(s$solution)
  cat(sprintf("%-14s starter fails: %-5s solution passes: %s\n", s$id, !sp, so)); ok = ok && !sp && so
}
if (!ok) quit(status = 1)
