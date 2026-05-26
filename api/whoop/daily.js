module.exports = async function handler(req, res) {
const token = (req.headers.cookie||"").match(/wa=([^;]+)/)?.[1];
if (!token) return res.status(401).json({ error: "Not connected" });
const h = { Authorization: "Bearer " + token };
try {
const [rec, slp, cyc] = await Promise.all([
fetch("https://api.prod.whoop.com/developer/v1/recovery?limit=1&start=2026-05-25", { headers: h }).then(r=>r.json()),
fetch("https://api.prod.whoop.com/developer/v1/sleep?limit=1&start=2026-05-25", { headers: h }).then(r=>r.json()),
fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=1", { headers: h }).then(r=>r.json()),
]);
const r0 = rec?.records?.[0]?.score || {};
const s0 = slp?.records?.[0]?.score || {};
const c0 = cyc?.records?.[0]?.score || {};
res.json({
recovery:   Math.round(r0.recovery_score)      || null,
hrv:        Math.round(r0.hrv_rmssd_milli)     || null,
restingHR:  Math.round(r0.resting_heart_rate)  || null,
strain:     Math.round(c0.strain * 10) / 10    || null,
calories:   Math.round((c0.kilojoule||0)*0.239) || null,
avgHR:      Math.round(c0.average_heart_rate)   || null,
totalSleep: s0.total_in_bed_time_milli
? +((s0.total_in_bed_time_milli/3600000).toFixed(1)) : null,
sleepScore: Math.round(s0.sleep_performance_percentage) || null,
raw: { rec, slp }
});
} catch(e) { res.status(500).json({ error: e.message }); }
}
