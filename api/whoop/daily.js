module.exports = async function handler(req, res) {
const token = (req.headers.cookie||"").match(/wa=([^;]+)/)?.[1];
if (!token) return res.status(401).json({ error: "Not connected" });
const h = { Authorization: "Bearer " + token };

let strain=null, calories=null, avgHR=null, sleepScore=null, totalSleep=null;

try {
const cycRes = await fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=1", { headers: h });
const cyc = await cycRes.json();
const cs = cyc?.records?.[0]?.score || {};
strain   = Math.round((cs.strain||0)*10)/10 || null;
calories = Math.round((cs.kilojoule||0)*0.239) || null;
avgHR    = Math.round(cs.average_heart_rate) || null;
} catch(e) {}

try {
const slpRes = await fetch("https://api.prod.whoop.com/developer/v2/activity/sleep?limit=1", { headers: h });
const slp = await slpRes.json();
const s0 = slp?.records?.[0]?.score || {};
sleepScore = Math.round(s0.sleep_performance_percentage) || null;
totalSleep = s0.total_in_bed_time_milli ? +((s0.total_in_bed_time_milli/3600000).toFixed(1)) : null;
} catch(e) {}

res.json({ recovery:null, hrv:null, restingHR:null, strain, calories, avgHR, sleepScore, totalSleep });
}
