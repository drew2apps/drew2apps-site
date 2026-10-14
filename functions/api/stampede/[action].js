// Stampede beta: stores anonymous run logs and optional feedback for drew2apps.com/apps/stampede/.
//   POST /api/stampede/run       {id, doc}    one row per run, updated as the run goes on
//   POST /api/stampede/feedback  {run, rating, comment, name, result, t, touch}
// Needs a D1 database bound to the Pages project as STAMPEDE_DB. Tables are created on first use.

const RUN_ID = /^r[a-z0-9]{6,24}$/;
const MAX_RUN_BYTES = 400_000;
let ready = false;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const int = (v) => (Number.isFinite(+v) ? Math.round(+v) : null);
const str = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");

async function setup(db) {
  if (ready) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY, started TEXT, updated TEXT, result TEXT, secs INTEGER, wave INTEGER, lvl INTEGER,
      kills INTEGER, touch INTEGER, data TEXT)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT, run TEXT, rating INTEGER, name TEXT, comment TEXT,
      result TEXT, secs INTEGER, touch INTEGER)`),
  ]);
  ready = true;
}

async function saveRun(db, text) {
  if (text.length > MAX_RUN_BYTES) return json({ error: "too big" }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "bad json" }, 400); }
  const id = body && body.id, doc = body && body.doc;
  if (typeof id !== "string" || !RUN_ID.test(id) || !doc || typeof doc !== "object" || !Array.isArray(doc.rows)) return json({ error: "bad run" }, 400);
  const end = doc.end && typeof doc.end === "object" ? doc.end : {};
  const last = doc.rows.length ? doc.rows[doc.rows.length - 1] : [];
  await setup(db);
  await db.prepare(
    `INSERT INTO runs (id, started, updated, result, secs, wave, lvl, kills, touch, data) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
     ON CONFLICT(id) DO UPDATE SET updated = excluded.updated, result = excluded.result, secs = excluded.secs, wave = excluded.wave,
       lvl = excluded.lvl, kills = excluded.kills, data = excluded.data`,
  ).bind(
    id, str(doc.started, 40), new Date().toISOString(), str(end.result, 12) || "playing",
    int(end.t ?? last[0]), int(end.wave ?? last[1]), int(end.lvl ?? last[2]), int(end.kills ?? last[7]),
    doc.touch ? 1 : 0, JSON.stringify(doc),
  ).run();
  return json({ ok: true });
}

async function saveFeedback(db, text) {
  if (text.length > 8_000) return json({ error: "too big" }, 413);
  let b;
  try { b = JSON.parse(text); } catch { return json({ error: "bad json" }, 400); }
  if (!b || typeof b !== "object") return json({ error: "bad feedback" }, 400);
  const rating = int(b.rating), comment = str(b.comment, 1000).trim();
  if (!(rating >= 1 && rating <= 5) && !comment) return json({ error: "empty" }, 400);
  const run = typeof b.run === "string" && RUN_ID.test(b.run) ? b.run : null;
  await setup(db);
  await db.prepare(
    `INSERT INTO feedback (created, run, rating, name, comment, result, secs, touch) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
  ).bind(
    new Date().toISOString(), run, rating >= 1 && rating <= 5 ? rating : null, str(b.name, 40).trim(), comment,
    str(b.result, 12), int(b.t), b.touch ? 1 : 0,
  ).run();
  return json({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const db = env.STAMPEDE_DB;
  if (!db) return json({ error: "storage not set up" }, 503);
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) return json({ error: "expected json" }, 415);
  const text = await request.text();
  try {
    if (params.action === "run") return await saveRun(db, text);
    if (params.action === "feedback") return await saveFeedback(db, text);
  } catch (err) {
    return json({ error: "could not save" }, 500);
  }
  return json({ error: "not found" }, 404);
}

export const onRequest = () => json({ error: "method not allowed" }, 405);
