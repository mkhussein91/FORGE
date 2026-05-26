module.exports = async function handler(req, res) {
const token = (req.headers.cookie||"").match(/wa=([^;]+)/)?.[1];
if (!token) return res.status(401).json({ error: "Not connected" });
const h = { Authorization: "Bearer " + token };
try {
const [rec, slp, cyc] = await Promise.all([
fetch("https://api.prod.whoop.com/developer/v1/recovery?limit=1", { headers: h }).then(r=>r.text()),
fetch("https://api.prod.whoop.com/developer/v1/sleep?limit=1", { headers: h }).then(r=>r.text()),
fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=1", { headers: h }).then(r=>r.text()),
]);
res.json({ rec: rec.substring(0,500), slp: slp.substring(0,500), cyc: cyc.substring(0,500) });
} catch(e) { res.status(500).json({ error: e.message }); }
}
