export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, message: "缺少 token" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const url = `${supabaseUrl}/rest/v1/test_links?token=eq.${token}&select=*`;

  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  const data = await response.json();

  if (!data || data.length === 0) {
    return res.status(404).json({ valid: false, message: "链接不存在" });
  }

  const link = data[0];

  if (link.status !== "active" || link.remaining_uses <= 0) {
    return res.status(403).json({ valid: false, message: "该链接已失效" });
  }

  return res.status(200).json({
    valid: true,
    remaining_uses: link.remaining_uses,
    token: link.token,
  });
}