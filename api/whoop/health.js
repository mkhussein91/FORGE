export default function handler(req, res) {
res.json({ ok: true, whoop: process.env.WHOOP_CLIENT_ID ? "configured" : "missing" });
}
