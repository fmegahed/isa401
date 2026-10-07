// Local stand-in for Vercel: static files plus api/*.js with a req.query/res shim.
// Reads ../.env.local (the shared Upstash store) and JEV_API_KEY from the course .Renviron.
//   node dev/server.js   ->  http://localhost:4020
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 4020);
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(ROOT, ".env.local"));
loadEnv(path.join(ROOT, "..", "..", ".Renviron"));
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "fall2026";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".csv": "text/csv; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  let p = u.pathname; const query = Object.fromEntries(u.searchParams);
  if (p.startsWith("/api/") && !p.includes("/_")) {
    const file = path.join(ROOT, p.replace(/\.js$/, "") + ".js");
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end("no such function"); }
    let body = ""; for await (const c of req) body += c;
    const shim = Object.assign(res, { status(c) { res.statusCode = c; return res; }, send(s) { res.end(s); return res; } });
    try { await require(file)(Object.assign(req, { query, body }), shim); } catch (e) { res.statusCode = 500; res.end(String(e.stack)); }
    return;
  }
  if (p === "/") p = "/index.html";
  let f = path.join(ROOT, p);
  if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
  const blocked = ["/dev/", "/tests/", "/content/", "/api/"].some((d) => p.startsWith(d));
  if (blocked || !f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  // same isolation headers as vercel.json, so R can make network requests locally too
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store",
    "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("exam-review dev on http://localhost:" + PORT));
