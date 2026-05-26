export default async function handler(req, res) {
const { code } = req.query;
const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "[https://forge-k9id.vercel.app](https://forge-k9id.vercel.app/)";
const REDIRECT = ${APP_URL}/api/whoop/callback;
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
wa=${tokens.access_token}; Path=/; HttpOnly; Secure; Max-Age=3600,
wr=${tokens.refresh_token}; Path=/; HttpOnly; Secure; Max-Age=2592000,
]);
res.redirect("/?whoop=connected");
}
