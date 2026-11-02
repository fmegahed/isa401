// In-memory stand-in for the Upstash store: only the commands api/_game.js uses, with results
// shaped like the Upstash REST API. Used by tests/game.test.mjs and by dev/server.js when no
// KV_REST_API_URL is set (or GD_MEMORY=1). Expiry is ignored.
function memoryRedis() {
  const db = new Map();
  const map = (k) => { if (!db.has(k)) db.set(k, new Map()); return db.get(k); };
  const zsorted = (k) => [...map(k).entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1));
  const fn = async (cmd, ...a) => {
    switch (String(cmd).toUpperCase()) {
      case "GET": return db.has(a[0]) ? db.get(a[0]) : null;
      case "SET": {
        const nx = a.slice(2).map((s) => String(s).toUpperCase()).includes("NX");
        if (nx && db.has(a[0])) return null;
        db.set(a[0], String(a[1])); return "OK";
      }
      case "INCR": { const v = Number(db.get(a[0]) || 0) + 1; db.set(a[0], String(v)); return v; }
      case "EXPIRE": return 1;
      case "DEL": return a.reduce((n, k) => n + (db.delete(k) ? 1 : 0), 0);
      case "HGET": { const h = map(a[0]); return h.has(a[1]) ? h.get(a[1]) : null; }
      case "HSET": { const h = map(a[0]); let n = 0; for (let i = 1; i < a.length; i += 2) { if (!h.has(a[i])) n++; h.set(a[i], String(a[i + 1])); } return n; }
      case "HSETNX": { const h = map(a[0]); if (h.has(a[1])) return 0; h.set(a[1], String(a[2])); return 1; }
      case "HINCRBY": { const h = map(a[0]); const v = Number(h.get(a[1]) || 0) + Number(a[2]); h.set(a[1], String(v)); return v; }
      case "HDEL": return map(a[0]).delete(a[1]) ? 1 : 0;
      case "HLEN": return map(a[0]).size;
      case "HGETALL": return [...map(a[0]).entries()].flat();
      case "ZADD": {
        const z = map(a[0]); let i = 1, nx = false, n = 0;
        if (String(a[1]).toUpperCase() === "NX") { nx = true; i = 2; }
        for (; i < a.length; i += 2) { if (nx && z.has(a[i + 1])) continue; if (!z.has(a[i + 1])) n++; z.set(a[i + 1], Number(a[i])); }
        return n;
      }
      case "ZINCRBY": { const z = map(a[0]); const v = (z.get(a[2]) || 0) + Number(a[1]); z.set(a[2], v); return String(v); }
      case "ZSCORE": { const z = map(a[0]); return z.has(a[1]) ? String(z.get(a[1])) : null; }
      case "ZREVRANK": { const i = zsorted(a[0]).findIndex(([m]) => m === a[1]); return i < 0 ? null : i; }
      case "ZREVRANGE": {
        const all = zsorted(a[0]);
        const stop = Number(a[2]) < 0 ? all.length + Number(a[2]) : Number(a[2]);
        const part = all.slice(Number(a[1]), stop + 1);
        return String(a[3] || "").toUpperCase() === "WITHSCORES" ? part.flatMap(([m, s]) => [m, String(s)]) : part.map(([m]) => m);
      }
      default: throw new Error("memory redis: unsupported " + cmd);
    }
  };
  fn.db = db;
  return fn;
}

module.exports = { memoryRedis };
