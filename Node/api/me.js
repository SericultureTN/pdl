export default function handler(req, res) {
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
