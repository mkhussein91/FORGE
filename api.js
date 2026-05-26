export default async function handler(req, res) {
  const path = req.url.split("?")[0];
  const CLIENT_ID     = process.env.WHOOP_CLIENT_ID;
  const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
  const APP_URL       = process.env.APP_URL || "https://forge-k9id.vercel.app";
  const REDIRECT      = `${APP_URL}/api/whoop/callback`;

  if (path === "/api/health") {
    return res.json({ ok: true, whoop_id: CLIENT_ID ? "set" : "missing" });
  }
  if (path === "/api/whoop/auth") {
    const params = new URLSearchParams({
      response_type: "code", client_id: CLIENT_ID,
      redirect_uri: REDIRECT,
      scope: "offline read:recovery read:sleep read:cycles read:profile read:body_measurement",
    });
    return res.redirect(`https://api.prod.whoop.com/oauth/oauth2/auth?${params}`);
  }
  if (path === "/api/whoop/callback") {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code");
    const r = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: REDIRECT, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      }),
    });
    const tokens = await r.json();
    if (!tokens.access_token) return res.status(500).json({ error: "Failed", detail: tokens });
    res.setHeader("Set-Cookie", [
      `whoop_access=${tokens.access_token}; Path=/; HttpOnly; Secure; Max-Age=3600`,
      `whoop_refresh=${tokens.refresh_token}; Path=/; HttpOnly; Secure; Max-Age=2592000`,
    ]);
    return res.redirect("/?whoop=connected");
  }
  if (path === "/api/whoop/status") {
    const token = (req.headers.cookie||"").match(/whoop_access=([^;]+)/)?.[1];
    return res.json({ connected: !!token });
  }
  if (path === "/api/whoop/daily") {
    const token = (req.headers.cookie||"").match(/whoop_access=([^;]+)/)?.[1];
    if (!token) return res.status(401).json({ error: "Not connected" });
    const h = { Authorization: `Bearer ${token}` };
    const [rec, slp, cyc] = await Promise.all([
      fetch("https://api.prod.whoop.com/developer/v1/recovery?limit=1", { headers: h }).then(r=>r.json()),
      fetch("https://api.prod.whoop.com/developer/v1/sleep?limit=1",    { headers: h }).then(r=>r.json()),
      fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=1",    { headers: h }).then(r=>r.json()),
    ]);
    const r0=rec?.records?.[0]?.score||{}, s0=slp?.records?.[0]?.score||{}, c0=cyc?.records?.[0]?.score||{};
    return res.json({
      recovery:       Math.round(r0.recovery_score)      ||null,
      hrv:            Math.round(r0.hrv_rmssd_milli)     ||null,
      restingHR:      Math.round(r0.resting_heart_rate)  ||null,
      strain:         c0.strain                           ||null,
      calories:       Math.round((c0.kilojoule||0)*0.239) ||null,
      avgHR:          Math.round(c0.average_heart_rate)   ||null,
      activeCalories: Math.round((c0.kilojoule||0)*0.167) ||null,
      totalSleep:     s0.total_in_bed_time_milli ? +((s0.total_in_bed_time_milli/3600000).toFixed(1)) : null,
    });
  }
  res.status(404).json({ error: "Not found" });
}
