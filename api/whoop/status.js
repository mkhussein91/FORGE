export default function handler(req, res) {
const token = (req.headers.cookie||"").match(/wa=([^;]+)/)?.[1];
res.json({ connected: !!token });
}
