export default function handler(req, res) {
  // Set CORS headers - allow both frontend domains
  const allowedOrigins = ['https://pdl-ruddy.vercel.app', 'https://pdl-lo5pj0o8l-pdl2.vercel.app'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, url } = req;

  try {
    // Parse URL to get ID for specific operations
    const urlParts = url.split('/');
    const id = urlParts[urlParts.length - 1];

    switch (method) {
      case 'GET':
        if (url.includes('/statistics')) {
          // Return mock statistics
          return res.json({
            ok: true,
            statistics: {
              total: 25,
              active: 20,
              inactive: 5,
              registeredThisMonth: 8
            }
          });
        } else {
          // Return all sericulturists (mock data)
          const sericulturists = [
            {
              id: 1,
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+91 9876543210',
              address: 'Chennai, Tamil Nadu',
              status: 'active',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '+91 9876543211',
              address: 'Coimbatore, Tamil Nadu',
              status: 'active',
              created_at: new Date().toISOString()
            }
          ];

          // Apply filters from query params
          let filtered = sericulturists;
          if (query.search) {
            filtered = filtered.filter(s => 
              s.name.toLowerCase().includes(query.search.toLowerCase()) ||
              s.email.toLowerCase().includes(query.search.toLowerCase())
            );
          }
          if (query.status) {
            filtered = filtered.filter(s => s.status === query.status);
          }

          // Apply pagination
          const page = parseInt(query.page) || 1;
          const limit = parseInt(query.limit) || 10;
          const start = (page - 1) * limit;
          const paginated = filtered.slice(start, start + limit);

          return res.json({
            ok: true,
            sericulturists: paginated,
            pagination: {
              page,
              limit,
              total: filtered.length,
              pages: Math.ceil(filtered.length / limit)
            }
          });
        }

      case 'POST':
        // Create new sericulturist
        const userData = req.body;
        const newUser = {
          id: Date.now(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          role: 'sericulturist',
          status: 'active',
          created_at: new Date().toISOString()
        };

        return res.status(201).json({
          ok: true,
          message: 'Sericulturist created successfully',
          sericulturist: newUser
        });

      case 'PUT':
        // Update sericulturist
        if (!id) {
          return res.status(400).json({ error: 'Sericulturist ID required' });
        }

        const updateData = req.body;
        return res.json({
          ok: true,
          message: 'Sericulturist updated successfully',
          sericulturist: {
            id: parseInt(id),
            ...updateData,
            updated_at: new Date().toISOString()
          }
        });

      case 'DELETE':
        // Delete sericulturist
        if (!id) {
          return res.status(400).json({ error: 'Sericulturist ID required' });
        }

        return res.json({
          ok: true,
          message: 'Sericulturist deleted successfully',
          id: parseInt(id)
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
