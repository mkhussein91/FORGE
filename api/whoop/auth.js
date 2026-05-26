export default function handler(req, res) {
const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const APP_URL = process.env.APP_URL || "[https://forge-k9id.vercel.app](https://forge-k9id.vercel.app/)";
const params = new URLSearchParams({
response_type: "code",
client_id: CLIENT_ID,
redirect_uri: ${APP_URL}/api/whoop/callback,
scope: "offline read:recovery read:sleep read:cycles read:profile read:body_measurement",
});
res.redirect(https://api.prod.whoop.com/oauth/oauth2/auth?${params});
}
