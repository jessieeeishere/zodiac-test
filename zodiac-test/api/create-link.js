export default async function handler(req, res) {
  const adminKey = req.query.admin_key;
  const expectedAdminKey = process.env.ADMIN_KEY;

  if (!expectedAdminKey) {
    return res.status(500).json({ success: false, message: "服务器未配置 ADMIN_KEY" });
  }

  if (adminKey !== expectedAdminKey) {
    return res.status(403).json({ success: false, message: "无权限生成链接" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  const headers = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };

  let token = "";
  let inserted = false;
  let lastError = null;

  for (let i = 0; i < 5; i++) {
    token = generateToken(12);

    const body = {
      token,
      remaining_uses: 2,
      status: "active"
    };

    const insertUrl = `${supabaseUrl}/rest/v1/test_links`;
    const response = await fetch(insertUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      inserted = true;
      break;
    } else {
      lastError = data;
    }
  }

  if (!inserted) {
    return res.status(500).json({
      success: false,
      message: "创建链接失败",
      error: lastError
    });
  }

  const baseUrl = `https://${req.headers.host}`;
  const shareUrl = `${baseUrl}/?token=${token}`;

  return res.status(200).json({
    success: true,
    token,
    remaining_uses: 2,
    status: "active",
    url: shareUrl
  });
}

function generateToken(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}