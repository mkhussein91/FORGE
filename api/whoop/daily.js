module.exports = async function handler(req, res) {
const token = (req.headers.cookie||"").match(/wa=([^;]+)/)?.[1];
if (!token) return res.status(401).json({ error: "Not connected" });
const h = { Authorization: "Bearer " + token };
try {
const [cyc, slp] = await Promise.all([
fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=1", { headers: h }).then(r=>r.json()),
fetch("https://api.prod.whoop.com/developer/v2/activity/sleep?limit=1", { headers: h }).then(r=>r.json()),
]);
const c0 = cyc?.records?.[0] || {};
const cs = c0.score || {};
const cr = c0.recovery || {};
const s0 = slp?.records?.[0]?.score || {};
res.json({
recovery:   Math.round(cr.recovery_score)        || null,
hrv:        Math.round(cr.hrv_rmssd_milli)       || null,
restingHR:  Math.round(cr.resting_heart_rate)    || null,
strain:     Math.round((cs.strain||0) * 10) / 10 || null,
calories:   Math.round((cs.kilojoule||0) * 0.239)|| null,
avgHR:      Math.round(cs.average_heart_rate)    || null,
totalSleep: s0.total_in_bed_time_milli
? +((s0.total_in_bed_time_milli/3600000).toFixed(1)) : null,
sleepScore: Math.round(s0.sleep_performance_percentage) || null,
});
} catch(e) { res.status(500).json({ error: e.message }); }
}
