// Local stand-in for Vercel: static files plus api/*.js with a req.query/res shim.
// Adapted from games/game-day/dev/server.js. Reads ./.env.local (the shared Upstash store) if present.
// With no store configured (or RC_MEMORY=1) it uses the in-memory store in dev/memory_redis.js, so the
// whole game can be rehearsed offline; data then lasts until the server stops.
//   node dev/server.js   ->  http://localhost:4060   (PORT=... to change)
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 4060);
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(ROOT, ".env.local"));
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "local-test";   // dev-only key; never a production value (the repo is public)
const memory = process.env.RC_MEMORY === "1" || !(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
if (memory) require(path.join(ROOT, "api", "_store.js")).setRedis(require("./memory_redis").memoryRedis());
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp", ".csv": "text/csv; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".css": "text/css" };
// mirrors .vercelignore: none of these are served
const HIDDEN = ["/dev/", "/tests/", "/api/", "/content/", "/data/", "/reveal/", "/build.mjs", "/make_charts.R", "/README.md", "/package.json"];

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  let p;
  try { p = decodeURIComponent(u.pathname); } catch (e) { res.writeHead(400); return res.end("bad path"); }
  // An encoded slash (%2f) survives URL normalization, so "..%2f" would become "../" here: refuse any ".." or "\".
  if (p.includes("\\") || p.split("/").includes("..")) { res.writeHead(404); return res.end("not found"); }
  const query = Object.fromEntries(u.searchParams);
  if (p.startsWith("/api/") && !p.includes("/_")) {
    const apiDir = path.join(ROOT, "api") + path.sep;
    const file = path.resolve(ROOT, "." + p.replace(/\.js$/, "") + ".js");
    if (!file.startsWith(apiDir) || path.basename(file).startsWith("_") || !fs.existsSync(file)) { res.writeHead(404); return res.end("no such function"); }
    let body = ""; for await (const c of req) body += c;
    const shim = Object.assign(res, { status(c) { res.statusCode = c; return res; }, send(s) { res.end(s); return res; } });
    try { await require(file)(Object.assign(req, { query, body }), shim); } catch (e) { res.statusCode = 500; res.end(String(e.stack)); }
    return;
  }
  if (p === "/") p = "/index.html";
  let f = path.resolve(ROOT, "." + p);
  if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";
  // check the resolved file, not the raw request path
  const rel = "/" + path.relative(ROOT, f).split(path.sep).join("/");
  const blocked = !f.startsWith(ROOT + path.sep) || HIDDEN.some((d) => rel.startsWith(d)) || rel.split("/").some((seg) => seg.startsWith("."));
  if (blocked || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log("race-call dev on http://localhost:" + PORT + (memory ? " (in-memory store)" : " (Upstash store)")));   // loopback only
