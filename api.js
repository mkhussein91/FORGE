const express = require("express");
const app = express();
app.use(express.json());

let whoopTokens = {
  access_token:  process.env.WHOOP_ACCESS_TOKEN  || null,
  refresh_token: process.env.WHOOP_REFRESH_TOKEN || null,
  expires_at:    parseInt(process.env.WHOOP_EXPIRES_AT || "0"),
};

const CLIENT_ID     = process.env.WHOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
const APP_URL       = process.env.APP_URL || "https://forge-k9id.vercel.app";
const REDIRECT_URI  = `${APP_URL}/api/whoop/callback`;

async function ensureToken() {
  if (!whoopTokens.access_token) return null;
  if (Date.now() < whoopTokens.expires_at - 60000) return whoopTokens.access_token;
  const res = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: whoopTokens.refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const d = await res.json();
  if (d.access_token) {
    whoopTokens = {
      access_token: d.access_token,
      refresh_token: d.refresh_token || whoopTokens.refresh_token,
      expires_at: Date.now() + d.expires_in * 1000,
    };
  }
  return whoopTokens.access_token;
}

// Start WHOOP OAuth
app.get("/api/whoop/auth", (req, res) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "offline read:recovery read:sleep read:workout read:profile read:cycles read:body_measurement",
  });
  res.redirect(`https://api.prod.whoop.com/oauth/oauth2/auth?${params}`);
});

// WHOOP sends user back here after login
app.get("/api/whoop/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code");
  const r = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const tokens = await r.json();
  if (!tokens.access_token) return res.status(500).send("Token exchange failed");
  whoopTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
  };
  res.redirect("/?whoop=connected");
});

// Check if connected
app.get("/api/whoop/status", (req, res) => {
  res.json({ connected: !!whoopTokens.access_token });
});

// Get today's WHOOP data
app.get("/api/whoop/daily", async (req, res) => {
  const token = await ensureToken();
  if (!token) return res.status(401).json({ error: "Not connected" });
  const h = { Authorization: `Bearer ${token}` };
  const [rec, slp, cyc] = await Promise.all([
    fetch("https://api.prod.whoop.com/developer/v1/recovery?limit=1", { headers: h }).then(r => r.json()),
    fetch("https://api.prod.whoop.com/developer/v1/sleep?limit=1",    { headers: h }).then(r => r.json()),
    fetch("https://api.prod.whoop.com/developer/v1/cycle?limit=1",    { headers: h }).then(r => r.json()),
  ]);
  const r0 = rec?.records?.[0] || {};
  const s0 = slp?.records?.[0] || {};
  const c0 = cyc?.records?.[0] || {};
  res.json({
    recovery:       Math.round(r0.score?.recovery_score)     || null,
    hrv:            Math.round(r0.score?.hrv_rmssd_milli)    || null,
    restingHR:      Math.round(r0.score?.resting_heart_rate) || null,
    skinTemp:       r0.score?.skin_temp_celsius               || null,
    strain:         c0.score?.strain                          || null,
    calories:       Math.round((c0.score?.kilojoule||0)*0.239)|| null,
    avgHR:          Math.round(c0.score?.average_heart_rate)  || null,
    activeCalories: Math.round((c0.score?.kilojoule||0)*0.239*0.7)||null,
    totalSleep:     s0.score?.total_in_bed_time_milli
                      ? +((s0.score.total_in_bed_time_milli/3600000).toFixed(1)) : null,
  });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

module.exports = app;
