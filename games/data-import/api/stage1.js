// Stage 1: last night's VPN sign-in log, served as CSV.
// Students: readr::read_csv("https://<app>/api/stage1")
// Identify the compromised account: the one with the most failed attempts
// before a successful sign-in (also after hours, from abroad, without MFA).
// Source addresses come from the RFC 5737 documentation ranges (192.0.2.0/24,
// 203.0.113.0/24), which are reserved for examples and never route anywhere.
const ROWS = [
  ["account", "sign_in_time", "country", "source_ip", "failed_attempts", "mfa"],
  ["hallm7", "2026-09-01 08:14:00", "United States", "192.0.2.41", 0, "yes"],
  ["patelr2", "2026-09-01 09:02:00", "United States", "192.0.2.118", 1, "yes"],
  ["chenw4", "2026-09-01 13:47:00", "United States", "192.0.2.77", 0, "yes"],
  ["oconnork", "2026-09-01 17:25:00", "United States", "192.0.2.203", 2, "yes"],
  ["nguyent9", "2026-09-01 22:10:00", "United States", "192.0.2.156", 0, "yes"],
  ["smithj31", "2026-09-02 02:31:00", "Romania", "203.0.113.57", 17, "no"],
  ["garciad5", "2026-09-02 07:55:00", "United States", "192.0.2.92", 1, "yes"],
];

module.exports = (req, res) => {
  const csv = ROWS.map((r) => r.join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).send(csv + "\n");
};
