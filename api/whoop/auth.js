export default function handler(req, res) {
const CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const APP_URL = process.env.APP_URL || "[https://forge-k9id.vercel.app](https://forge-k9id.vercel.app/)";
const REDIRECT = APP_URL + "/api/whoop/callback";
const scope = "offline read:recovery read:sleep read:cycles read:profile read:body_measurement";
const url = "https://api.prod.whoop.com/oauth/oauth2/auth"
+ "?response_type=code"
+ "&client_id=" + CLIENT_ID
+ "&redirect_uri=" + encodeURIComponent(REDIRECT)
+ "&scope=" + encodeURIComponent(scope);
res.redirect(url);
}
