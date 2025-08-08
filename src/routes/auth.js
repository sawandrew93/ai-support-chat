import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

const router = express.Router();
const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  const password_hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('agents').insert({ email, password_hash, name }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json({ id: data.id, email: data.email, name: data.name });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: agent, error } = await supabase.from('agents').select('*').eq('email', email).single();
  if (error || !agent) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, agent.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: agent.id, email: agent.email, name: agent.name }, config.jwtSecret, { expiresIn: '8h' });
  return res.json({ token });
});

export default router;

