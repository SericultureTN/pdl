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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Mock admin check - replace with real database logic
    if (email === 'admin@example.com' && password === 'Admin123!') {
      return res.json({
        ok: true,
        user: {
          id: 1,
          email: 'admin@example.com',
          role: 'admin',
          name: 'Administrator'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
