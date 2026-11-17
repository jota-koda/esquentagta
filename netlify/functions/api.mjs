// Esquenta GTA — API de palpites (Netlify Functions + Netlify Blobs)
import { getStore } from "@netlify/blobs";

// Lançamento: 19/11/2026 00:00 horário de Brasília
const LAUNCH = Date.parse("2026-11-19T00:00:00-03:00");
const CATS = ["historia", "personagens", "mapa", "gameplay", "online", "zoeira"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const clean = (s, n) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
const okId = (s) => /^[a-z0-9-]{6,48}$/i.test(String(s || ""));

export default async (req) => {
  const store = getStore({ name: "esquenta-gta", consistency: "strong" });
  const launched = Date.now() >= LAUNCH;

  if (req.method === "GET") {
    const uid = new URL(req.url).searchParams.get("uid") || "";
    const [p, v, j] = await Promise.all(
      ["p/", "v/", "j/"].map((prefix) => store.list({ prefix }))
    );
    const preds = await Promise.all(p.blobs.map((b) => store.get(b.key, { type: "json" })));
    const map = {};
    for (const x of preds) {
      if (x) map[x.id] = { ...x, up: 0, down: 0, yes: 0, no: 0, myVote: null, myJudge: null };
    }
    const tally = (blobs, mine) => {
      for (const b of blobs) {
        const [, pid, rest] = b.key.split("/");
        const [u, val] = (rest || "").split("~");
        const t = map[pid];
        if (!t || !(val in t)) continue;
        t[val]++;
        if (u === uid) t[mine] = val;
      }
    };
    tally(v.blobs, "myVote");
    tally(j.blobs, "myJudge");
    const predictions = Object.values(map)
      .map(({ uid: owner, ...rest }) => ({ ...rest, mine: owner === uid }))
      .sort((a, b) => b.ts - a.ts);
    return json({ launch: LAUNCH, now: Date.now(), predictions });
  }

  if (req.method !== "POST") return json({ error: "Método não suportado" }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const { action, uid } = body;
  if (!okId(uid)) return json({ error: "Usuário inválido" }, 400);

  if (action === "create") {
    if (launched) return json({ error: "Os palpites foram trancados à meia-noite. Agora é hora da verdade!" }, 403);
    const name = clean(body.name, 24);
    const text = clean(body.text, 280);
    const cat = CATS.includes(body.cat) ? body.cat : "zoeira";
    const conf = Math.max(0, Math.min(100, Math.round(Number(body.conf) || 50)));
    if (name.length < 2) return json({ error: "Coloca teu nome aí" }, 400);
    if (text.length < 4) return json({ error: "Palpite muito curto" }, 400);
    const mine = await store.list({ prefix: "p/" });
    if (mine.blobs.length > 2000) return json({ error: "Limite de palpites atingido" }, 429);
    const id = crypto.randomUUID();
    const pred = { id, uid, name, text, cat, conf, ts: Date.now() };
    await store.setJSON(`p/${id}`, pred);
    return json({ ok: true, id });
  }

  if (action === "vote" || action === "judge") {
    const pid = body.pid;
    if (!okId(pid)) return json({ error: "Palpite inválido" }, 400);
    const exists = await store.get(`p/${pid}`);
    if (!exists) return json({ error: "Palpite não existe mais" }, 404);
    const prefix = action === "vote" ? "v" : "j";
    const allowed = action === "vote" ? ["up", "down", "none"] : ["yes", "no", "none"];
    if (!allowed.includes(body.val)) return json({ error: "Valor inválido" }, 400);
    if (action === "judge" && !launched) return json({ error: "Só dá pra julgar depois do lançamento" }, 403);
    await Promise.all(
      allowed.filter((x) => x !== "none").map((x) => store.delete(`${prefix}/${pid}/${uid}~${x}`))
    );
    if (body.val !== "none") await store.set(`${prefix}/${pid}/${uid}~${body.val}`, "1");
    return json({ ok: true });
  }

  if (action === "delete") {
    if (launched) return json({ error: "Depois do lançamento não dá mais pra apagar 😏" }, 403);
    const pid = body.pid;
    if (!okId(pid)) return json({ error: "Palpite inválido" }, 400);
    const pred = await store.get(`p/${pid}`, { type: "json" });
    if (!pred) return json({ ok: true });
    if (pred.uid !== uid) return json({ error: "Esse palpite não é teu" }, 403);
    const [v, j] = await Promise.all([store.list({ prefix: `v/${pid}/` }), store.list({ prefix: `j/${pid}/` })]);
    await Promise.all([...v.blobs, ...j.blobs].map((b) => store.delete(b.key)));
    await store.delete(`p/${pid}`);
    return json({ ok: true });
  }

  return json({ error: "Ação desconhecida" }, 400);
};

export const config = { path: "/api" };
