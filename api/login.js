// Vercel Serverless Function for Login
import { query } from '../../Node/src/postgres.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Demo credentials fallback
    if (email === 'admin@example.com' && password === 'Admin123!') {
      const token = jwt.sign(
        { 
          id: 1, 
          email: 'admin@example.com', 
          role: 'admin',
          name: 'Administrator'
        },
        'demo_secret',
        { expiresIn: '2h' }
      );

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

    return res.status(401).json({ error: "Invalid credentials" });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
