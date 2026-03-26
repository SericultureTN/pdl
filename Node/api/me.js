export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://pdl-ruddy.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock user check - replace with real authentication
    return res.json({
      ok: true,
      user: {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        name: 'Administrator'
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
