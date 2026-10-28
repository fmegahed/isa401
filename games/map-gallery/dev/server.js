// Local stand-in for Vercel: static files plus api/*.js with a req.query/res shim.
// Copied from games/press-time/dev/server.js.
// Reads ./.env.local (the shared Upstash store) and OPENAI_API_KEY from the course .Renviron.
// With no store configured (or MG_MEMORY=1) it uses the in-memory store in dev/memory_redis.js,
// so the whole game can be rehearsed offline; data then lasts until the server stops.
//   node dev/server.js   ->  http://localhost:4040
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PORT || 4040);
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv(path.join(ROOT, ".env.local"));
loadEnv(path.join(ROOT, "..", "..", ".Renviron"));
process.env.ADMIN_KEY = process.env.ADMIN_KEY || "fall2026";
const memory = process.env.MG_MEMORY === "1" || !(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);
if (memory) require(path.join(ROOT, "api", "_store.js")).setRedis(require("./memory_redis").memoryRedis());
// MG_FAKE_CHECK=1 replaces the OpenAI pin checker (every other pin "not found"); =error fakes an outage.
if (process.env.MG_FAKE_CHECK) {
  const kind = process.env.MG_FAKE_CHECK;
  require(path.join(ROOT, "api", "_game.js")).setChecker(async (image, pins) => {
    await new Promise((r) => setTimeout(r, 900));
    if (kind === "error") { const e = new Error("fake outage"); e.code = "service"; throw e; }
    return { seen: pins.map((p, i) => i % 2 === 0), features: { per_capita: true, butler_stands_out: true, legend_units: false, takeaway_title: true, change_over_time: false, source_note: false }, form: "single_map", butlerValue: null };
  });
}
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp", ".csv": "text/csv; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".mp3": "audio/mpeg", ".gif": "image/gif", ".woff2": "font/woff2", ".css": "text/css" };

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
    const blocked = (["/dev/", "/tests/", "/api/"].some((d) => p.startsWith(d))) || path.basename(f).startsWith(".");
  if (blocked || !f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("map-gallery dev on http://localhost:" + PORT + (memory ? " (in-memory store)" : " (Upstash store)")));
