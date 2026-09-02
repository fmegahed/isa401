// Finish line: jsonlite::fromJSON("https://<app>/api/finish?code=NUMBER")
// NUMBER is the count of DOWNLOAD events in the stage-2 log.
const CODE = 6;

function sendJSON(res, obj) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(JSON.stringify(obj, null, 2));
}

module.exports = (req, res) => {
  const raw = String((req.query && req.query.code) || "").trim();
  const code = Number(raw);
  if (raw === "" || Number.isNaN(code)) {
    sendJSON(res, {
      status: "WRONG_CODE",
      hint:
        "The code is a number: https://isa401-import-heist.vercel.app/api/finish?code=NUMBER. To find it in R: log$events is a data frame, and log$events$action is its action column. " +
        "The comparison log$events$action == \"DOWNLOAD\" gives TRUE for every download, and sum() of those TRUEs is your count.",
    });
    return;
  }
  if (code !== CODE) {
    sendJSON(res, {
      status: "WRONG_CODE",
      hint:
        code > CODE
          ? "Too high. You may be counting every event in the log (that is what nrow(log$events) gives you) instead of only the DOWNLOADs. Run log$events$action == \"DOWNLOAD\" first and look at the TRUEs and FALSEs it returns, then sum() them."
          : "Too low. Make sure you counted ALL the downloads: sum(log$events$action == \"DOWNLOAD\") counts every TRUE in the comparison, top to bottom of the log.",
    });
    return;
  }
  sendJSON(res, {
    status: "CLEARED",
    verdict:
      "Account smithj31 was compromised by password guessing (17 failed attempts, then a successful sign-in from Romania at 02:31 without MFA). " +
      "In the next 27 minutes, 6 files (28.1 MB) were downloaded from the FSB shared drive, including payroll, an employee roster, and survey responses with PII, " +
      "and fsb_shared/README.txt was overwritten at 02:57 (restored from the drive's version history).",
    report: {
      incident: "INC-2026-0902",
      compromised_account: "smithj31",
      attack: "password guessing (17 failed attempts before success)",
      source_country: "Romania",
      source_ip: "203.0.113.57",
      mfa_used: "no",
      session_window: "02:31 to 02:58",
      files_downloaded: 6,
      data_downloaded_mb: 28.1,
      highest_risk_file: "fsb_shared/research/survey_responses_pii.csv",
      files_overwritten: 1,
    },
    containment: [
      "Disable smithj31 and reset its credentials",
      "Require MFA on every VPN sign-in",
      "Notify the owners of the 6 downloaded files, starting with the PII export",
      "Block the source address 203.0.113.57 and review sign-ins from outside the US",
      "Restore fsb_shared/README.txt from version history (overwritten at 02:57)",
    ],
    replay: "https://isa401-import-heist.vercel.app/replay",
    message:
      "Incident closed. Open the replay address above in your browser to watch the incident unfold from the two files you imported, " +
      "then post your team name on the Menti wall to claim your spot on the board.",
  });
};
