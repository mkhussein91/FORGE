module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  var key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "No API key configured" });
  try {
    var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    var prompt = body.prompt || "";
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }]
      })
    });
    var d = await r.json();
    res.json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
