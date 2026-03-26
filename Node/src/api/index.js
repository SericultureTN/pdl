import { createClient } from '@supabase/supabase-js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://pdl-ruddy.vercel.app',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Health check
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('admins').select('count');
    if (error) throw error;
    
    return res.json({ 
      ok: true, 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.json({ 
      ok: true, 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic auth endpoints
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check admin
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (admin && await bcrypt.compare(password, admin.password_hash)) {
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '24h' }
      );
      
      return res.json({
        ok: true,
        user: { id: admin.id, email: admin.email, role: 'admin', name: 'Administrator' }
      });
    }
    
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/me', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    
    return res.json({ 
      ok: true, 
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      }
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default app;
