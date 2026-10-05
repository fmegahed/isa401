// Local stand-in for Vercel: static files, api/*.js with a req.query/res shim,
// and the two rewrites from vercel.json. Reads ../.env.local (the shared Upstash
// store, so test in section Z and reset it afterwards).
//   node dev/server.js   ->  http://localhost:4010
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 4010);
for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "fall2026";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".txt": "text/plain; charset=utf-8", ".mp3": "audio/mpeg" };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  let p = u.pathname; const query = Object.fromEntries(u.searchParams);
  if (p === "/registry") p = "/api/registry";
  const wm = p.match(/^\/wreck\/([^/]+)$/); if (wm) { p = "/api/wreck"; query.hull = decodeURIComponent(wm[1]); }
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
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("salvage-run dev on http://localhost:" + PORT));
