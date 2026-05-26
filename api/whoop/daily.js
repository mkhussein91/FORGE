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
const s0 = slp?.records?.[0]?.score || {};
const cycleId = [c0.id](http://c0.id/);

```
// Get recovery using the cycle ID
let recovery = null, hrv = null, restingHR = null;
if (cycleId) {
  const recRes = await fetch(
    "<https://api.prod.whoop.com/developer/v1/cycle/>" + cycleId + "/recovery",
    { headers: h }
  ).then(r=>r.json()).catch(()=>null);
  const rs = recRes?.score || {};
  recovery  = Math.round(rs.recovery_score)     || null;
  hrv       = Math.round(rs.hrv_rmssd_milli)    || null;
  restingHR = Math.round(rs.resting_heart_rate) || null;
}

res.json({
  recovery,
  hrv,
  restingHR,
  strain:     Math.round((cs.strain||0)*10)/10   || null,
  calories:   Math.round((cs.kilojoule||0)*0.239) || null,
  avgHR:      Math.round(cs.average_heart_rate)   || null,
  sleepScore: Math.round(s0.sleep_performance_percentage) || null,
  totalSleep: s0.total_in_bed_time_milli
                ? +((s0.total_in_bed_time_milli/3600000).toFixed(1)) : null,
});
```

} catch(e) { res.status(500).json({ error: e.message }); }
}
