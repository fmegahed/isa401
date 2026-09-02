// Stage 2: shared-drive activity for the compromised account, served as JSON.
// Students: jsonlite::fromJSON("https://<app>/api/stage2?key=ACCOUNT")
// The right account is the one with the most failed_attempts in stage 1.
const KEY = "smithj31";

// Why every other stage-1 account looks benign (used in the LOCKED hint).
const ALIBIS = {
  hallm7: "signed in at 08:14 from the United States with 0 failed attempts and MFA on: a normal morning sign-in",
  patelr2: "signed in at 09:02 from the United States with 1 failed attempt and MFA on: one typo, then MFA",
  chenw4: "signed in at 13:47 from the United States with 0 failed attempts and MFA on: nothing unusual",
  oconnork: "signed in at 17:25 from the United States with 2 failed attempts and MFA on: a couple of typos, then MFA",
  nguyent9: "signed in at 22:10 from the United States with 0 failed attempts and MFA on: late, but clean",
  garciad5: "signed in at 07:55 from the United States with 1 failed attempt and MFA on: a normal morning sign-in",
};

// 16 shared-drive events between 02:32 and 02:57; exactly 6 are DOWNLOADs (28.1 MB).
// The last event is an OVERWRITE of README.txt: not a download, so it does not change
// the finish code, but the replay shows it being restored from version history.
const EVENTS = [
  ["02:32", "fsb_shared/README.txt", "VIEW", 0.01],
  ["02:33", "fsb_shared/dept_directory.xlsx", "VIEW", 0.4],
  ["02:35", "fsb_shared/dept_directory.xlsx", "DOWNLOAD", 0.4],
  ["02:37", "fsb_shared/finance/budget_fy26.xlsx", "VIEW", 2.1],
  ["02:38", "fsb_shared/finance/budget_fy26.xlsx", "DOWNLOAD", 2.1],
  ["02:40", "fsb_shared/finance/payroll_fall2026.xlsx", "DOWNLOAD", 5.6],
  ["02:42", "fsb_shared/hr/onboarding_checklist.docx", "VIEW", 0.2],
  ["02:44", "fsb_shared/hr/employee_roster.csv", "VIEW", 1.3],
  ["02:45", "fsb_shared/hr/employee_roster.csv", "DOWNLOAD", 1.3],
  ["02:47", "fsb_shared/isa/isa401_grades_fall2026.xlsx", "VIEW", 0.3],
  ["02:48", "fsb_shared/isa/isa401_grades_fall2026.xlsx", "DOWNLOAD", 0.3],
  ["02:50", "fsb_shared/research/survey_responses_pii.csv", "VIEW", 18.4],
  ["02:52", "fsb_shared/research/survey_responses_pii.csv", "DOWNLOAD", 18.4],
  ["02:54", "fsb_shared/marketing/brand_guidelines.pdf", "VIEW", 6.0],
  ["02:56", "fsb_shared/it/vpn_setup_guide.pdf", "VIEW", 0.9],
  ["02:57", "fsb_shared/README.txt", "OVERWRITE", 0.01],
];
const events = EVENTS.map((e, i) => ({
  event: i + 1,
  time: e[0],
  file: e[1],
  action: e[2],
  size_mb: e[3],
}));

function sendJSON(res, obj) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(JSON.stringify(obj, null, 2));
}

module.exports = (req, res) => {
  const raw = String((req.query && req.query.key) || "").trim();
  const key = raw.toLowerCase();
  if (key !== KEY) {
    let hint;
    if (raw === "") {
      hint =
        "This log is sealed until you name the compromised account. Add its account name to the end of the address, like this: " +
        "jsonlite::fromJSON(\"https://isa401-import-heist.vercel.app/api/stage2?key=ACCOUNT\") where ACCOUNT comes from the account column in stage 1.";
    } else if (ALIBIS[key]) {
      hint =
        "'" + raw + "' " + ALIBIS[key] + ". Back in R, look at your stage-1 data: run logins to print it, find the LARGEST value in the failed_attempts column " +
        "(max(logins$failed_attempts) tells you what it is), and use the account name from that same row as the key.";
    } else {
      hint =
        "'" + raw + "' is not an account in the sign-in log. The key must be one of the values in logins$account (spelled exactly as it appears there); " +
        "pick the row whose failed_attempts is the largest.";
    }
    sendJSON(res, { status: "LOCKED", hint: hint });
    return;
  }
  sendJSON(res, {
    status: "UNLOCKED",
    account: KEY,
    briefing:
      "Everything smithj31 touched on the FSB shared drive between the 02:31 sign-in and the end of the session. " +
      "The events element below is a data frame with an action column (VIEW, DOWNLOAD, or OVERWRITE). " +
      "Count how many events are DOWNLOADs; that count is the incident code for https://isa401-import-heist.vercel.app/api/finish?code=NUMBER",
    session: {
      start: "02:31",
      end: "02:58",
      source_country: "Romania",
      source_ip: "203.0.113.57",
      vpn_gateway_ip: "198.51.100.10",
      mfa: "no",
    },
    events: events,
  });
};
