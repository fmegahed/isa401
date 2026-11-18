# QR codes for The ESP Test's lobby (host.html) and the Class 25 deck: one per section.
# Run from games/esp-test with R 4.6.1:
#   & "C:\Program Files\R\R-4.6.1\bin\x64\Rscript.exe" make_qr.R
if (!requireNamespace("qrcode", quietly = TRUE)) install.packages("qrcode")

site = "https://isa401-esp-test.vercel.app/?section="
dir.create("images", showWarnings = FALSE)

for (s in c("A", "B")) {
  code = qrcode::qr_code(paste0(site, s), ecl = "M")
  png(file.path("images", paste0("qr_", s, ".png")), width = 600, height = 600)
  par(mar = c(0, 0, 0, 0))
  plot(code)
  dev.off()
}
