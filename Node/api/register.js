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
    const { name, email, password, phone, address } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Mock user creation - replace with real database logic
    const newUser = {
      id: Date.now(), // Generate unique ID
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      role: 'sericulturist',
      status: 'active',
      created_at: new Date().toISOString()
    };

    return res.status(201).json({
      ok: true,
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
