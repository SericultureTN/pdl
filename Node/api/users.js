export default function handler(req, res) {
  // Set CORS headers - allow both frontend domains
  const allowedOrigins = ['https://pdl-ruddy.vercel.app', 'https://pdl-lo5pj0o8l-pdl2.vercel.app'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock users data - replace with real database logic
    const users = [
      {
        id: 1,
        name: 'Administrator',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Sample Sericulturist',
        email: 'sericulturist@example.com',
        phone: '+91 9876543210',
        address: 'Tamil Nadu, India',
        role: 'sericulturist',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];

    return res.json({
      ok: true,
      users: users,
      total: users.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
