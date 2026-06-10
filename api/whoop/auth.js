module.exports = function handler(req, res) {
  const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
  const APP_URL = process.env.APP_URL || "https://forge-k9id.vercel.app";
  const REDIRECT = APP_URL + "/api/whoop/callback";
  const state = Math.random().toString(36).substring(2, 18);
  const scope = "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement";
  const url = "https://api.prod.whoop.com/oauth/oauth2/auth"
    + "?response_type=code"
    + "&client_id=" + CLIENT_ID
    + "&redirect_uri=" + encodeURIComponent(REDIRECT)
    + "&scope=" + encodeURIComponent(scope)
    + "&state=" + state;
  res.json({ debug_client_id: CLIENT_ID, debug_url: url });
}
