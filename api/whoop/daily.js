module.exports = async function handler(req, res) {
  const cookie = req.headers.cookie || "";
  let token = cookie.match(/wa=([^;]+)/)?.[1];
  const refresh = cookie.match(/wr=([^;]+)/)?.[1];

  if (!token && refresh) {
    try {
      const r = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refresh,
          client_id: process.env.WHOOP_CLIENT_ID,
          client_secret: process.env.WHOOP_CLIENT_SECRET,
        }),
      });
      const t = await r.json();
      if (t.access_token) {
        token = t.access_token;
        res.setHeader("Set-Cookie", [
          "wa=" + token + "; Path=/; HttpOnly; Secure; Max-Age=2592000",
          "wr=" + (t.refresh_token||refresh) + "; Path=/; HttpOnly; Secure; Max-Age=2592000",
        ]);
      }
    } catch(e) {}
  }

  if (!token) return res.status(401).json({ error: "Not connected" });

  const h = { Authorization: "Bearer " + token };
  let strain=null,calories=null,avgHR=null,maxHR=null,sleepScore=null,totalSleep=null,
      sleepEfficiency=null,respiratoryRate=null,sleepNeed=null,timeInBed=null,
      lightSleep=null,deepSleep=null,remSleep=null,awakeTime=null,disturbances=null,
      skinTemp=null,spo2=null;

  try {
    const cyc = await fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=1", { headers: h }).then(r=>r.json());
    const cs = cyc?.records?.[0]?.score || {};
    strain   = Math.round((cs.strain||0)*10)/10 || null;
    calories = Math.round((cs.kilojoule||0)*0.239) || null;
    avgHR    = Math.round(cs.average_heart_rate) || null;
    maxHR    = Math.round(cs.max_heart_rate) || null;

    const cycId = cyc?.records?.[0]?.id;
    if(cycId){
      const rec = await fetch("https://api.prod.whoop.com/developer/v1/cycle/"+cycId+"/recovery", { headers: h }).then(r=>r.json());
      const rs = rec?.score || {};
      skinTemp = rs.skin_temp_celsius != null ? Math.round(rs.skin_temp_celsius*10)/10 : null;
      spo2 = rs.spo2_percentage != null ? Math.round(rs.spo2_percentage*10)/10 : null;
    }
  } catch(e) {}

  try {
    const slp = await fetch("https://api.prod.whoop.com/developer/v2/activity/sleep?limit=1", { headers: h }).then(r=>r.json());
    const s0 = slp?.records?.[0]?.score || {};
    const stage = s0.stage_summary || {};
    sleepScore = Math.round(s0.sleep_performance_percentage) || null;
    sleepEfficiency = Math.round(s0.sleep_efficiency_percentage) || null;
    respiratoryRate = s0.respiratory_rate ? Math.round(s0.respiratory_rate*10)/10 : null;
    totalSleep = s0.total_in_bed_time_milli ? +((s0.total_in_bed_time_milli/3600000).toFixed(1)) : null;
    timeInBed = totalSleep;
    lightSleep = stage.total_light_sleep_time_milli ? +((stage.total_light_sleep_time_milli/3600000).toFixed(1)) : null;
    deepSleep = stage.total_slow_wave_sleep_time_milli ? +((stage.total_slow_wave_sleep_time_milli/3600000).toFixed(1)) : null;
    remSleep = stage.total_rem_sleep_time_milli ? +((stage.total_rem_sleep_time_milli/3600000).toFixed(1)) : null;
    awakeTime = stage.total_awake_time_milli ? +((stage.total_awake_time_milli/3600000).toFixed(1)) : null;
    disturbances = stage.disturbance_count != null ? stage.disturbance_count : null;
    sleepNeed = s0.sleep_needed?.baseline_milli ? +((s0.sleep_needed.baseline_milli/3600000).toFixed(1)) : null;
  } catch(e) {}

  res.json({
    recovery: null, hrv: null, restingHR: null,
    strain, calories, avgHR, maxHR,
    sleepScore, totalSleep, sleepEfficiency, respiratoryRate, sleepNeed,
    timeInBed, lightSleep, deepSleep, remSleep, awakeTime, disturbances,
    skinTemp, spo2
  });
}
