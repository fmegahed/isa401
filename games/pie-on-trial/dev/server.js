// Local stand-in for Vercel: static files plus api/*.js with a req.query/res shim.
// Adapted from games/game-day/dev/server.js. Always uses the in-memory store; data lasts until it stops.
//   node dev/server.js   ->  http://localhost:4040
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 4040);
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "local-test";
require(path.join(ROOT, "api", "_store.js")).setRedis(require("./memory_redis").memoryRedis());
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".png": "image/png", ".mp3": "audio/mpeg" };

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  let p = u.pathname; const query = Object.fromEntries(u.searchParams);
  if (p.startsWith("/api/") && !p.includes("/_")) {
    const file = path.join(ROOT, p + ".js");
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end("no such function"); }
    let body = ""; for await (const c of req) body += c;
    const shim = Object.assign(res, { status(c) { res.statusCode = c; return res; }, send(s) { res.end(s); return res; } });
    try { await require(file)(Object.assign(req, { query, body }), shim); } catch (e) { res.statusCode = 500; res.end(String(e.stack)); }
    return;
  }
  if (p === "/") p = "/index.html";
  let f = path.join(ROOT, p);
  if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
  if (["/dev/", "/tests/", "/api/"].some((d) => p.startsWith(d)) || !f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("pie-on-trial dev on http://localhost:" + PORT));
